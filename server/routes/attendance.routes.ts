import { Router, Request, Response, NextFunction } from 'express';
import { dbClient, withTransaction } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { createAuditLog } from '../services/auditService';
import { attendanceController } from '../controllers/attendance.controller';

export const attendanceRouter = Router();

attendanceRouter.use(authenticateToken);
attendanceRouter.use(enforceTenantIsolation);

// GET /api/v1/attendance/sessions
attendanceRouter.get(
  '/sessions',
  requirePermission('attendance.read'),
  attendanceController.getSessions.bind(attendanceController)
);

// GET /api/v1/attendance/records - query by sessionId or return list
attendanceRouter.get(
  '/records',
  requirePermission('attendance.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.query.sessionId as string;
      if (sessionId) {
        req.params.sessionId = sessionId;
        return attendanceController.getSessionRecords(req, res, next);
      }

      const result = await dbClient.query(`
        SELECT 
          ar.id,
          ar.session_id as "sessionId",
          s.id as "studentId",
          s.roll_number as "studentRoll",
          CONCAT(u.first_name, ' ', u.last_name) as "studentName",
          ar.status,
          ar.recorded_at as "recordedAt"
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE u.institution_id = $1
        ORDER BY s.roll_number ASC
        LIMIT 100
      `, [req.user!.institutionId]);

      res.json({
        success: true,
        data: result.rows,
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/attendance/sessions - Record attendance with ABAC faculty boundary check
attendanceRouter.post(
  '/sessions',
  requirePermission('attendance.record'),
  attendanceController.recordAttendance.bind(attendanceController)
);

// PUT /api/v1/attendance/records/:id - Modifies record with mandatory reason and cryptographic audit
attendanceRouter.put(
  '/records/:id',
  requireAnyPermission(['attendance.record', 'attendance.approve']),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !['present', 'absent', 'late', 'excused'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: "Status must be 'present', 'absent', 'late', or 'excused'" },
      });
      return;
    }

    if (!reason || reason.trim().length < 5) {
      res.status(400).json({
        success: false,
        error: { code: 'REASON_REQUIRED', message: 'A mandatory justification reason (min 5 characters) is required' },
      });
      return;
    }

    const updated = await withTransaction(async (tx) => {
      const curRes = await tx.query(`
        SELECT 
          ar.id, ar.status, ar.session_id,
          s.roll_number, CONCAT(u.first_name, ' ', u.last_name) as student_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE ar.id = $1 AND u.institution_id = $2
      `, [id, req.user!.institutionId]);

      if (curRes.rows.length === 0) {
        return null;
      }

      const cur = curRes.rows[0];
      const oldStatus = cur.status;

      const updateRes = await tx.query(`
        UPDATE attendance_records
        SET status = $1, recorded_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [status, id]);

      await createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        role: req.user!.role,
        action: 'ATTENDANCE_CHANGE',
        entity: 'attendance_records',
        entityId: id,
        institutionId: req.user!.institutionId,
        oldValues: { status: oldStatus },
        newValues: { status },
        reason: `Attendance for ${cur.student_name} (${cur.roll_number}) modified: ${reason}`,
        ipAddress: req.ip || '127.0.0.1',
      }, tx);

      return updateRes.rows[0];
    });

    if (!updated) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attendance record not found' } });
      return;
    }

    res.json({
      success: true,
      message: 'Attendance record updated successfully with cryptographic audit logging',
      data: updated,
      requestId: req.id,
    });
  }
);

// POST /api/v1/attendance/corrections
attendanceRouter.post(
  '/corrections',
  requirePermission('attendance.correct'),
  attendanceController.requestCorrection.bind(attendanceController)
);

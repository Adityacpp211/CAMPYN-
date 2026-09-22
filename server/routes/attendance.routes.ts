import { Router, Request, Response } from 'express';
import { dbClient, withTransaction } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { createAuditLog } from '../services/auditService';

export const attendanceRouter = Router();

attendanceRouter.use(authenticateToken);

// GET /api/attendance/sessions
attendanceRouter.get('/sessions', requirePermission('attendance.read'), async (_req: Request, res: Response): Promise<void> => {
  const result = await dbClient.query(`
    SELECT 
      att_s.id,
      c.code as "courseCode",
      c.name as "courseName",
      sec.name as "sectionName",
      att_s.session_date as "sessionDate",
      CONCAT(TO_CHAR(att_s.slot_start, 'HH12:MI AM'), ' - ', TO_CHAR(att_s.slot_end, 'HH12:MI AM')) as slot,
      CONCAT(u.first_name, ' ', u.last_name) as "recordedBy",
      att_s.is_locked as "isLocked"
    FROM attendance_sessions att_s
    JOIN section_courses sc ON att_s.section_course_id = sc.id
    JOIN courses c ON sc.course_id = c.id
    JOIN sections sec ON sc.section_id = sec.id
    JOIN users u ON att_s.recorded_by = u.id
    ORDER BY att_s.session_date DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});

// GET /api/attendance/records?sessionId=...
attendanceRouter.get('/records', requirePermission('attendance.read'), async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.query;

  let sql = `
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
    WHERE 1=1
  `;

  const params: any[] = [];
  if (sessionId) {
    params.push(sessionId);
    sql += ` AND ar.session_id = $${params.length}`;
  }

  sql += ' ORDER BY s.roll_number ASC';

  const result = await dbClient.query(sql, params);
  res.json({
    success: true,
    data: result.rows,
  });
});

// PUT /api/attendance/records/:id (Requires mandatory reason & audit tracking)
attendanceRouter.put('/records/:id', requireAnyPermission(['attendance.record', 'attendance.approve']), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!status || !['present', 'absent', 'late', 'excused'].includes(status)) {
    res.status(400).json({
      success: false,
      error: { message: "Status must be 'present', 'absent', 'late', or 'excused'" },
    });
    return;
  }

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({
      success: false,
      error: { message: 'A mandatory justification reason (min 5 characters) is required to modify attendance records' },
    });
    return;
  }

  try {
    const updated = await withTransaction(async (tx) => {
      // 1. Fetch current record
      const curRes = await tx.query(`
        SELECT 
          ar.id, ar.status, ar.session_id,
          s.roll_number, CONCAT(u.first_name, ' ', u.last_name) as student_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE ar.id = $1
      `, [id]);

      if (curRes.rows.length === 0) {
        return null;
      }

      const cur = curRes.rows[0];
      const oldStatus = cur.status;

      // 2. Update record
      const updateRes = await tx.query(`
        UPDATE attendance_records
        SET status = $1, recorded_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [status, id]);

      // 3. Cryptographic audit log
      await createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        role: req.user!.role,
        action: 'ATTENDANCE_CHANGE',
        entity: 'attendance_records',
        entityId: id,
        oldValues: { status: oldStatus },
        newValues: { status },
        reason: `Attendance status for ${cur.student_name} (${cur.roll_number}) modified: ${reason}`,
        ipAddress: req.ip || '127.0.0.1',
      }, tx);

      return updateRes.rows[0];
    });

    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Attendance record not found' } });
      return;
    }

    res.json({
      success: true,
      message: 'Attendance record updated successfully with cryptographic audit logging',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/attendance/corrections (Workflow request)
attendanceRouter.post('/corrections', requirePermission('attendance.correct'), async (req: Request, res: Response): Promise<void> => {
  const { recordId, newStatus, reason } = req.body;

  if (!recordId || !newStatus || !reason) {
    res.status(400).json({ success: false, error: { message: 'recordId, newStatus and reason are required' } });
    return;
  }

  const recRes = await dbClient.query('SELECT status FROM attendance_records WHERE id = $1', [recordId]);
  if (recRes.rows.length === 0) {
    res.status(404).json({ success: false, error: { message: 'Attendance record not found' } });
    return;
  }

  const previousStatus = recRes.rows[0].status;

  const result = await withTransaction(async (tx) => {
    // 1. Insert correction
    const corrRes = await tx.query(`
      INSERT INTO attendance_corrections (attendance_record_id, requested_by, previous_status, new_status, reason, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [recordId, req.user!.id, previousStatus, newStatus, reason]);

    // 2. Insert approval request
    await tx.query(`
      INSERT INTO approval_requests (institution_id, requester_id, entity, entity_id, request_type, reason, status)
      VALUES (
        (SELECT institution_id FROM users WHERE id = $1),
        $1, 'attendance', $2, 'Attendance Regularization', $3, 'pending'
      )
    `, [req.user!.id, recordId, reason]);

    return corrRes.rows[0];
  });

  res.json({
    success: true,
    message: 'Correction request submitted for administrative governance approval',
    data: result,
  });
});

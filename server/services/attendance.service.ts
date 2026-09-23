import { attendanceRepository } from '../repositories/attendance.repository';
import { AuthUser } from '../middleware/auth';
import { assertFacultyCourseAssignment } from '../middleware/resourceAuth';
import { RecordAttendanceInput, AttendanceCorrectionInput } from '../validators/attendance.validator';
import { createAuditLog } from './auditService';
import { dbClient, withTransaction } from '../db';

export class AttendanceService {
  async getSessions(
    actor: AuthUser,
    options: { sectionCourseId?: string; date?: string; facultyId?: string; status?: string }
  ) {
    return await attendanceRepository.getSessions(actor.institutionId, options);
  }

  async getSessionRecords(sessionId: string) {
    return await attendanceRepository.getSessionRecords(sessionId);
  }

  async recordAttendance(actor: AuthUser, input: RecordAttendanceInput, clientIp = '127.0.0.1') {
    // 1. Resolve course code from section_course_id to enforce faculty assignment boundary
    const scRes = await dbClient.query(
      `SELECT c.code, c.id as course_id, sc.section_id 
       FROM section_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.id = $1`,
      [input.sectionCourseId]
    );

    if (scRes.rows.length === 0) {
      const error: any = new Error('Section course allocation not found');
      error.statusCode = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    const { code, section_id } = scRes.rows[0];

    // 2. Resource-level ABAC assertion: Faculty must be assigned to this section/course
    await assertFacultyCourseAssignment(actor, code, section_id);

    // 3. Atomically record the session and records
    const result = await attendanceRepository.recordSessionWithTransaction(actor.id, input);

    // 4. Create Cryptographic Audit Trail
    await createAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'ATTENDANCE_RECORD',
      entity: 'attendance_sessions',
      entityId: result.sessionId,
      institutionId: actor.institutionId,
      newValues: {
        sectionCourseId: input.sectionCourseId,
        date: input.sessionDate,
        recordCount: result.recordCount,
      },
      reason: `Recorded attendance for ${result.recordCount} students`,
      ipAddress: clientIp,
    });

    return result;
  }

  async lockSession(actor: AuthUser, sessionId: string, clientIp = '127.0.0.1') {
    const locked = await attendanceRepository.lockSession(sessionId, actor.id);
    if (!locked) {
      const err: any = new Error(`Attendance session '${sessionId}' not found`);
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    await createAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'ATTENDANCE_LOCKED',
      entity: 'attendance_sessions',
      entityId: sessionId,
      institutionId: actor.institutionId,
      reason: `Attendance session ${sessionId} locked by ${actor.role} ${actor.email}`,
      ipAddress: clientIp,
    });

    return locked;
  }

  async updateRecord(
    actor: AuthUser,
    recordId: string,
    status: string,
    reason: string,
    clientIp = '127.0.0.1'
  ) {
    // Check if session is locked
    const isLocked = await attendanceRepository.isRecordLocked(recordId);
    if (isLocked) {
      const err: any = new Error('This attendance session is locked and finalized. To modify finalized attendance, submit a formal correction request.');
      err.code = 'SESSION_LOCKED';
      err.statusCode = 403;
      throw err;
    }

    return await withTransaction(async (tx) => {
      const curRes = await tx.query(`
        SELECT 
          ar.id, ar.status, ar.session_id,
          s.roll_number, CONCAT(u.first_name, ' ', u.last_name) as student_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE ar.id = $1 AND (s.institution_id = $2 OR u.institution_id = $2)
      `, [recordId, actor.institutionId]);

      if (curRes.rows.length === 0) {
        const err: any = new Error('Attendance record not found');
        err.code = 'NOT_FOUND';
        err.statusCode = 404;
        throw err;
      }

      const cur = curRes.rows[0];
      const oldStatus = cur.status;

      const updateRes = await tx.query(`
        UPDATE attendance_records
        SET status = $1, recorded_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [status, recordId]);

      await createAuditLog({
        actorId: actor.id,
        actorEmail: actor.email,
        role: actor.role,
        action: 'ATTENDANCE_CHANGE',
        entity: 'attendance_records',
        entityId: recordId,
        institutionId: actor.institutionId,
        oldValues: { status: oldStatus },
        newValues: { status },
        reason: `Attendance for ${cur.student_name} (${cur.roll_number}) modified: ${reason}`,
        ipAddress: clientIp,
      }, tx);

      return updateRes.rows[0];
    });
  }

  async requestCorrection(
    actor: AuthUser,
    input: AttendanceCorrectionInput,
    clientIp = '127.0.0.1'
  ) {
    const result = await attendanceRepository.createCorrectionRequest(
      actor.id,
      actor.institutionId,
      input
    );

    await createAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'ATTENDANCE_CORRECTION_REQUEST',
      entity: 'attendance_corrections',
      entityId: result.correctionId,
      institutionId: actor.institutionId,
      oldValues: { status: result.previousStatus },
      newValues: { status: result.newStatus, reason: input.reason },
      reason: input.reason,
      ipAddress: clientIp,
    });

    return result;
  }

  async getStudentStats(actor: AuthUser, studentId?: string) {
    let targetStudentId = studentId;
    if (!targetStudentId && actor.role === 'STUDENT') {
      const sRes = await dbClient.query('SELECT id FROM students WHERE user_id = $1', [actor.id]);
      if (sRes.rows.length > 0) targetStudentId = sRes.rows[0].id;
    }
    if (!targetStudentId) {
      const err: any = new Error('Student ID is required');
      err.code = 'BAD_REQUEST';
      err.statusCode = 400;
      throw err;
    }

    return await attendanceRepository.getStudentAttendanceStats(targetStudentId);
  }

  async getDepartmentStats(actor: AuthUser, departmentId?: string) {
    const deptId = departmentId || actor.departmentId || 'CSE';
    return await attendanceRepository.getDepartmentAttendanceStats(deptId);
  }
}

export const attendanceService = new AttendanceService();

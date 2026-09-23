import { attendanceRepository } from '../repositories/attendance.repository';
import { AuthUser } from '../middleware/auth';
import { assertFacultyCourseAssignment } from '../middleware/resourceAuth';
import { RecordAttendanceInput, AttendanceCorrectionInput } from '../validators/attendance.validator';
import { createAuditLog } from './auditService';
import { dbClient } from '../db';

export class AttendanceService {
  async getSessions(
    actor: AuthUser,
    options: { sectionCourseId?: string; date?: string; facultyId?: string }
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
}

export const attendanceService = new AttendanceService();

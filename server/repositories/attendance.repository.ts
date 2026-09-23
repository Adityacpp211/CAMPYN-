import { dbClient, withTransaction } from '../db';
import { RecordAttendanceInput, AttendanceCorrectionInput } from '../validators/attendance.validator';

export class AttendanceRepository {
  async getSessions(
    institutionId: string,
    options: { sectionCourseId?: string; date?: string; facultyId?: string }
  ): Promise<any[]> {
    let sql = `
      SELECT 
        ats.id,
        ats.section_course_id as "sectionCourseId",
        ats.session_date as "sessionDate",
        ats.slot_start as "slotStart",
        ats.slot_end as "slotEnd",
        ats.is_locked as "isLocked",
        c.code as "courseCode",
        c.name as "courseName",
        sec.name as "sectionName",
        u.first_name || ' ' || u.last_name as "recordedByName",
        (SELECT COUNT(*)::int FROM attendance_records ar WHERE ar.session_id = ats.id) as "totalRecords",
        (SELECT COUNT(*)::int FROM attendance_records ar WHERE ar.session_id = ats.id AND ar.status = 'present') as "presentCount"
      FROM attendance_sessions ats
      JOIN section_courses sc ON ats.section_course_id = sc.id
      JOIN courses c ON sc.course_id = c.id
      JOIN sections sec ON sc.section_id = sec.id
      JOIN programs p ON sec.program_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN users u ON ats.recorded_by = u.id
      WHERE d.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (options.sectionCourseId) {
      params.push(options.sectionCourseId);
      sql += ` AND ats.section_course_id = $${params.length}`;
    }

    if (options.date) {
      params.push(options.date);
      sql += ` AND ats.session_date = $${params.length}`;
    }

    if (options.facultyId) {
      params.push(options.facultyId);
      sql += ` AND sc.faculty_id = $${params.length}`;
    }

    sql += ` ORDER BY ats.session_date DESC, ats.slot_start DESC LIMIT 100`;

    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async getSessionRecords(sessionId: string): Promise<any[]> {
    const sql = `
      SELECT 
        ar.id,
        ar.session_id as "sessionId",
        ar.student_id as "studentId",
        ar.status,
        ar.recorded_at as "recordedAt",
        s.roll_number as "rollNumber",
        u.first_name as "firstName",
        u.last_name as "lastName"
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE ar.session_id = $1
      ORDER BY s.roll_number ASC
    `;
    const res = await dbClient.query(sql, [sessionId]);
    return res.rows;
  }

  async recordSessionWithTransaction(
    userId: string,
    input: RecordAttendanceInput
  ): Promise<{ sessionId: string; recordCount: number }> {
    return await withTransaction(async (tx) => {
      // 1. Create the attendance session
      const sessRes = await tx.query<{ id: string }>(
        `
        INSERT INTO attendance_sessions (section_course_id, session_date, slot_start, slot_end, recorded_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
        [input.sectionCourseId, input.sessionDate, input.slotStart, input.slotEnd, userId]
      );
      const sessionId = sessRes.rows[0].id;

      // 2. Insert attendance records
      for (const rec of input.records) {
        await tx.query(
          `
          INSERT INTO attendance_records (session_id, student_id, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (session_id, student_id)
          DO UPDATE SET status = EXCLUDED.status, recorded_at = CURRENT_TIMESTAMP
        `,
          [sessionId, rec.studentId, rec.status]
        );
      }

      return { sessionId, recordCount: input.records.length };
    });
  }

  async createCorrectionRequest(
    userId: string,
    institutionId: string,
    input: AttendanceCorrectionInput
  ): Promise<any> {
    return await withTransaction(async (tx) => {
      // Lookup existing attendance record
      const recRes = await tx.query(
        `SELECT id, status FROM attendance_records WHERE id = $1`,
        [input.attendanceRecordId]
      );
      if (recRes.rows.length === 0) {
        throw new Error('Attendance record not found');
      }
      const prevStatus = recRes.rows[0].status;

      // Create attendance_corrections entry
      const corrRes = await tx.query(
        `
        INSERT INTO attendance_corrections (attendance_record_id, requested_by, previous_status, new_status, reason, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id
      `,
        [input.attendanceRecordId, userId, prevStatus, input.newStatus, input.reason]
      );
      const correctionId = corrRes.rows[0].id;

      // Create linked approval request for HOD/Admin review
      await tx.query(
        `
        INSERT INTO approval_requests (institution_id, requester_id, entity, entity_id, request_type, reason, status)
        VALUES ($1, $2, 'attendance_corrections', $3, 'ATTENDANCE_CORRECTION', $4, 'pending')
      `,
        [institutionId, userId, correctionId, input.reason]
      );

      return { correctionId, previousStatus: prevStatus, newStatus: input.newStatus };
    });
  }
}

export const attendanceRepository = new AttendanceRepository();

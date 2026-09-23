import { dbClient } from '../db';
import { TimetableSlotCreateInput, TimetableQueryInput } from '../validators/timetable.validator';

export interface ConflictResult {
  hasConflict: boolean;
  type?: 'FACULTY_CONFLICT' | 'ROOM_CONFLICT' | 'SECTION_CONFLICT';
  conflictingSlot?: any;
  message?: string;
}

export class TimetableRepository {
  async findSlots(institutionId: string, query: TimetableQueryInput): Promise<any[]> {
    let sql = `
      SELECT 
        tt.id,
        tt.institution_id as "institutionId",
        tt.section_course_id as "sectionCourseId",
        tt.day_of_week as "day",
        CONCAT(TO_CHAR(tt.start_time, 'HH24:MI'), ' - ', TO_CHAR(tt.end_time, 'HH24:MI')) as "timeSlot",
        TO_CHAR(tt.start_time, 'HH24:MI') as "startTime",
        TO_CHAR(tt.end_time, 'HH24:MI') as "endTime",
        tt.room_number as "roomNumber",
        tt.slot_type as "slotType",
        c.id as "courseId",
        c.code as "courseCode",
        c.name as "courseName",
        c.credits,
        sec.id as "sectionId",
        sec.name as "sectionName",
        f.id as "facultyId",
        CONCAT(u.first_name, ' ', u.last_name) as "facultyName",
        f.employee_id as "facultyEmployeeId",
        false as "hasConflict"
      FROM timetable_slots tt
      JOIN section_courses sc ON tt.section_course_id = sc.id
      JOIN sections sec ON sc.section_id = sec.id
      JOIN courses c ON sc.course_id = c.id
      JOIN faculty f ON sc.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE tt.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (query.dayOfWeek) {
      params.push(query.dayOfWeek);
      sql += ` AND tt.day_of_week = $${params.length}`;
    }

    if (query.sectionId) {
      params.push(query.sectionId);
      sql += ` AND (sec.id = $${params.length} OR sec.name = $${params.length})`;
    }

    if (query.facultyId) {
      params.push(query.facultyId);
      sql += ` AND (f.id = $${params.length} OR f.employee_id = $${params.length} OR u.id = $${params.length})`;
    }

    if (query.courseId) {
      params.push(query.courseId);
      sql += ` AND (c.id = $${params.length} OR c.code = $${params.length})`;
    }

    if (query.roomNumber) {
      params.push(query.roomNumber);
      sql += ` AND tt.room_number = $${params.length}`;
    }

    sql += ' ORDER BY CASE tt.day_of_week WHEN \'Monday\' THEN 1 WHEN \'Tuesday\' THEN 2 WHEN \'Wednesday\' THEN 3 WHEN \'Thursday\' THEN 4 WHEN \'Friday\' THEN 5 WHEN \'Saturday\' THEN 6 ELSE 7 END, tt.start_time ASC';

    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async checkConflicts(
    institutionId: string,
    slot: {
      sectionCourseId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      roomNumber: string;
      excludeSlotId?: string;
    }
  ): Promise<ConflictResult> {
    // 1. Fetch target faculty and section for the section_course
    const scRes = await dbClient.query(`
      SELECT sc.id, sc.section_id, sc.faculty_id, c.code as course_code, sec.name as section_name,
             CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM section_courses sc
      JOIN courses c ON sc.course_id = c.id
      JOIN sections sec ON sc.section_id = sec.id
      JOIN faculty f ON sc.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE sc.id = $1
    `, [slot.sectionCourseId]);

    if (scRes.rows.length === 0) {
      return { hasConflict: false };
    }

    const { faculty_id, section_id, faculty_name, section_name } = scRes.rows[0];

    // 2. Check Room Conflict (Room booked for another class on same day with overlapping time)
    const roomSql = `
      SELECT tt.id, tt.room_number, tt.day_of_week, tt.start_time, tt.end_time,
             c.code as course_code, sec.name as section_name
      FROM timetable_slots tt
      JOIN section_courses sc ON tt.section_course_id = sc.id
      JOIN courses c ON sc.course_id = c.id
      JOIN sections sec ON sc.section_id = sec.id
      WHERE tt.institution_id = $1
        AND tt.day_of_week = $2
        AND tt.room_number = $3
        AND (tt.start_time < $5::time AND tt.end_time > $4::time)
        ${slot.excludeSlotId ? 'AND tt.id != $6' : ''}
      LIMIT 1
    `;
    const roomParams = [institutionId, slot.dayOfWeek, slot.roomNumber, slot.startTime, slot.endTime];
    if (slot.excludeSlotId) roomParams.push(slot.excludeSlotId);

    const roomRes = await dbClient.query(roomSql, roomParams);
    if (roomRes.rows.length > 0) {
      const match = roomRes.rows[0];
      return {
        hasConflict: true,
        type: 'ROOM_CONFLICT',
        conflictingSlot: match,
        message: `Room conflict: ${slot.roomNumber} is already scheduled for ${match.course_code} (${match.section_name}) from ${match.start_time} to ${match.end_time}`,
      };
    }

    // 3. Check Faculty Conflict (Faculty teaching another section on same day with overlapping time)
    const facultySql = `
      SELECT tt.id, tt.room_number, tt.day_of_week, tt.start_time, tt.end_time,
             c.code as course_code, sec.name as section_name
      FROM timetable_slots tt
      JOIN section_courses sc ON tt.section_course_id = sc.id
      JOIN courses c ON sc.course_id = c.id
      JOIN sections sec ON sc.section_id = sec.id
      WHERE tt.institution_id = $1
        AND tt.day_of_week = $2
        AND sc.faculty_id = $3
        AND (tt.start_time < $5::time AND tt.end_time > $4::time)
        ${slot.excludeSlotId ? 'AND tt.id != $6' : ''}
      LIMIT 1
    `;
    const facParams = [institutionId, slot.dayOfWeek, faculty_id, slot.startTime, slot.endTime];
    if (slot.excludeSlotId) facParams.push(slot.excludeSlotId);

    const facRes = await dbClient.query(facultySql, facParams);
    if (facRes.rows.length > 0) {
      const match = facRes.rows[0];
      return {
        hasConflict: true,
        type: 'FACULTY_CONFLICT',
        conflictingSlot: match,
        message: `Faculty conflict: ${faculty_name} is already scheduled for ${match.course_code} (${match.section_name}) in room ${match.room_number} from ${match.start_time} to ${match.end_time}`,
      };
    }

    // 4. Check Section Conflict (Section having another class on same day with overlapping time)
    const secSql = `
      SELECT tt.id, tt.room_number, tt.day_of_week, tt.start_time, tt.end_time,
             c.code as course_code, sec.name as section_name
      FROM timetable_slots tt
      JOIN section_courses sc ON tt.section_course_id = sc.id
      JOIN courses c ON sc.course_id = c.id
      JOIN sections sec ON sc.section_id = sec.id
      WHERE tt.institution_id = $1
        AND tt.day_of_week = $2
        AND sc.section_id = $3
        AND (tt.start_time < $5::time AND tt.end_time > $4::time)
        ${slot.excludeSlotId ? 'AND tt.id != $6' : ''}
      LIMIT 1
    `;
    const secParams = [institutionId, slot.dayOfWeek, section_id, slot.startTime, slot.endTime];
    if (slot.excludeSlotId) secParams.push(slot.excludeSlotId);

    const secConflictRes = await dbClient.query(secSql, secParams);
    if (secConflictRes.rows.length > 0) {
      const match = secConflictRes.rows[0];
      return {
        hasConflict: true,
        type: 'SECTION_CONFLICT',
        conflictingSlot: match,
        message: `Section conflict: ${section_name} is already scheduled for ${match.course_code} in room ${match.room_number} from ${match.start_time} to ${match.end_time}`,
      };
    }

    return { hasConflict: false };
  }

  async createSlot(institutionId: string, input: TimetableSlotCreateInput): Promise<any> {
    const res = await dbClient.query(`
      INSERT INTO timetable_slots (
        institution_id, section_course_id, day_of_week, start_time, end_time, room_number, slot_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      institutionId,
      input.sectionCourseId,
      input.dayOfWeek,
      input.startTime,
      input.endTime,
      input.roomNumber.trim().toUpperCase(),
      input.slotType,
    ]);

    return res.rows[0];
  }

  async deleteSlot(id: string, institutionId: string): Promise<boolean> {
    const res = await dbClient.query(`
      DELETE FROM timetable_slots
      WHERE id = $1 AND institution_id = $2
      RETURNING id
    `, [id, institutionId]);

    return res.rows.length > 0;
  }
}

export const timetableRepository = new TimetableRepository();

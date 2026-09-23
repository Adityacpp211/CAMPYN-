import { dbClient } from '../db';
import { StudentQueryInput } from '../validators/student.validator';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class StudentRepository {
  async findAll(
    institutionId: string,
    query: StudentQueryInput
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    let whereClause = `WHERE (s.institution_id = $1 OR u.institution_id = $1) AND s.deleted_at IS NULL`;
    const params: any[] = [institutionId];

    if (query.departmentId && query.departmentId !== 'all') {
      params.push(query.departmentId);
      whereClause += ` AND (d.id = $${params.length} OR d.code = $${params.length})`;
    }

    if (query.section && query.section !== 'all') {
      params.push(query.section);
      whereClause += ` AND sec.name = $${params.length}`;
    }

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND s.academic_status = $${params.length}`;
    }

    if (query.search) {
      params.push(`%${query.search}%`);
      whereClause += ` AND (
        u.first_name ILIKE $${params.length} OR
        u.last_name ILIKE $${params.length} OR
        s.roll_number ILIKE $${params.length} OR
        s.student_id_number ILIKE $${params.length} OR
        u.email ILIKE $${params.length}
      )`;
    }

    // Count query for total
    const countSql = `
      SELECT COUNT(s.id)::int as total
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN sections sec ON s.current_section_id = sec.id
      ${whereClause}
    `;
    const countRes = await dbClient.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    // Data query
    const dataSql = `
      SELECT 
        s.id,
        s.user_id as "userId",
        s.student_id_number as "studentIdNumber",
        s.roll_number as "rollNumber",
        s.registration_number as "registrationNumber",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        COALESCE(u.phone, '+1 (555) 000-0000') as phone,
        d.id as "departmentId",
        d.name as "departmentName",
        p.name as "programName",
        sem.semester_number as "semesterNumber",
        sec.name as "sectionName",
        s.admission_date as "admissionDate",
        s.date_of_birth as "dateOfBirth",
        s.blood_group as "bloodGroup",
        s.guardian_name as "guardianName",
        s.guardian_phone as "guardianPhone",
        s.academic_status as "academicStatus",
        COALESCE(
          (
            SELECT ROUND(
              (COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::numeric / NULLIF(COUNT(ar.id), 0)) * 100, 1
            )
            FROM attendance_records ar
            WHERE ar.student_id = s.id
          ),
          85.0
        ) as "attendancePercentage",
        COALESCE(
          (
            SELECT ROUND(AVG(me.marks_obtained / me.max_marks * 4 + 6)::numeric, 2)
            FROM marks_entries me
            WHERE me.student_id = s.id
          ),
          3.75
        ) as cgpa,
        COALESCE(
          (
            SELECT SUM(sfd.outstanding_amount)
            FROM student_fee_dues sfd
            WHERE sfd.student_id = s.id
          ),
          0
        ) as "pendingFees"
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN semesters sem ON s.current_semester_id = sem.id
      JOIN sections sec ON s.current_section_id = sec.id
      ${whereClause}
      ORDER BY s.roll_number ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataRes = await dbClient.query(dataSql, [...params, limit, offset]);

    return {
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(institutionId: string, id: string): Promise<any | null> {
    const sql = `
      SELECT 
        s.id,
        s.user_id as "userId",
        s.student_id_number as "studentIdNumber",
        s.roll_number as "rollNumber",
        s.registration_number as "registrationNumber",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.phone,
        d.id as "departmentId",
        d.name as "departmentName",
        p.id as "programId",
        p.name as "programName",
        sem.id as "semesterId",
        sem.semester_number as "semesterNumber",
        sec.id as "sectionId",
        sec.name as "sectionName",
        s.admission_date as "admissionDate",
        s.date_of_birth as "dateOfBirth",
        s.blood_group as "bloodGroup",
        s.gender,
        s.address,
        s.guardian_name as "guardianName",
        s.guardian_phone as "guardianPhone",
        s.guardian_email as "guardianEmail",
        s.academic_status as "academicStatus"
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN semesters sem ON s.current_semester_id = sem.id
      JOIN sections sec ON s.current_section_id = sec.id
      WHERE (s.id::text = $1 OR s.roll_number = $1)
        AND (s.institution_id = $2 OR u.institution_id = $2)
        AND s.deleted_at IS NULL
    `;
    const res = await dbClient.query(sql, [id, institutionId]);
    return res.rows[0] || null;
  }

  async findByUserId(institutionId: string, userId: string): Promise<any | null> {
    const sql = `
      SELECT s.*, u.email, u.first_name, u.last_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
        AND (s.institution_id = $2 OR u.institution_id = $2)
        AND s.deleted_at IS NULL
    `;
    const res = await dbClient.query(sql, [userId, institutionId]);
    return res.rows[0] || null;
  }
}

export const studentRepository = new StudentRepository();

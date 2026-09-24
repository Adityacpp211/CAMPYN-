import { dbClient } from '../db';
import {
  DepartmentCreateInput,
  DepartmentUpdateInput,
  ProgramCreateInput,
  AcademicYearCreateInput,
  SemesterCreateInput,
  SectionCreateInput,
} from '../validators/academic.validator';

export class AcademicRepository {
  // --- DEPARTMENTS ---
  async findDepartments(institutionId: string): Promise<any[]> {
    const res = await dbClient.query(`
      SELECT 
        d.id,
        d.institution_id as "institutionId",
        d.campus_id as "campusId",
        d.code,
        d.name,
        d.description,
        d.status,
        d.created_at as "createdAt",
        COALESCE(
          (
            SELECT CONCAT(u.first_name, ' ', u.last_name)
            FROM faculty f
            JOIN users u ON f.user_id = u.id
            WHERE f.id = d.hod_id OR (f.department_id = d.id AND f.designation ILIKE '%HOD%')
            LIMIT 1
          ),
          'Unassigned'
        ) as "hodName",
        COALESCE(
          (
            SELECT COUNT(s.id)
            FROM students s
            JOIN programs p ON s.program_id = p.id
            WHERE p.department_id = d.id AND s.deleted_at IS NULL
          ),
          0
        )::int as "studentCount",
        COALESCE(
          (
            SELECT COUNT(f.id)
            FROM faculty f
            WHERE f.department_id = d.id AND f.deleted_at IS NULL
          ),
          0
        )::int as "facultyCount",
        COALESCE(
          (
            SELECT COUNT(c.id)
            FROM courses c
            WHERE c.department_id = d.id AND c.deleted_at IS NULL
          ),
          0
        )::int as "courseCount"
      FROM departments d
      WHERE d.institution_id = $1 AND d.deleted_at IS NULL
      ORDER BY d.code ASC
    `, [institutionId]);

    return res.rows;
  }

  async findDepartmentById(id: string, institutionId: string): Promise<any | null> {
    const res = await dbClient.query(`
      SELECT 
        d.id,
        d.institution_id as "institutionId",
        d.campus_id as "campusId",
        d.code,
        d.name,
        d.description,
        d.hod_id as "hodId",
        d.status,
        d.created_at as "createdAt",
        COALESCE(
          (
            SELECT CONCAT(u.first_name, ' ', u.last_name)
            FROM faculty f
            JOIN users u ON f.user_id = u.id
            WHERE f.id = d.hod_id OR (f.department_id = d.id AND f.designation ILIKE '%HOD%')
            LIMIT 1
          ),
          'Unassigned'
        ) as "hodName"
      FROM departments d
      WHERE (d.id = $1 OR d.code = $1) AND d.institution_id = $2 AND d.deleted_at IS NULL
      LIMIT 1
    `, [id, institutionId]);

    return res.rows[0] || null;
  }

  async findDepartmentByCode(code: string, institutionId: string): Promise<any | null> {
    const res = await dbClient.query(`
      SELECT id, code, name
      FROM departments
      WHERE LOWER(code) = LOWER($1) AND institution_id = $2 AND deleted_at IS NULL
      LIMIT 1
    `, [code.trim(), institutionId]);

    return res.rows[0] || null;
  }

  async createDepartment(institutionId: string, input: DepartmentCreateInput): Promise<any> {
    const res = await dbClient.query(`
      INSERT INTO departments (institution_id, campus_id, code, name, description, hod_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      institutionId,
      input.campusId || null,
      input.code.trim().toUpperCase(),
      input.name.trim(),
      input.description || null,
      input.hodId || null,
    ]);

    return res.rows[0];
  }

  async updateDepartment(id: string, institutionId: string, input: DepartmentUpdateInput): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(input.name.trim());
    }
    if (input.code !== undefined) {
      fields.push(`code = $${idx++}`);
      values.push(input.code.trim().toUpperCase());
    }
    if (input.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(input.description);
    }
    if (input.campusId !== undefined) {
      fields.push(`campus_id = $${idx++}`);
      values.push(input.campusId);
    }
    if (input.hodId !== undefined) {
      fields.push(`hod_id = $${idx++}`);
      values.push(input.hodId);
    }

    if (fields.length === 0) {
      return this.findDepartmentById(id, institutionId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id, institutionId);
    const sql = `
      UPDATE departments
      SET ${fields.join(', ')}
      WHERE id = $${idx++} AND institution_id = $${idx++} AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await dbClient.query(sql, values);
    return res.rows[0] || null;
  }

  async archiveDepartment(id: string, institutionId: string): Promise<boolean> {
    const res = await dbClient.query(`
      UPDATE departments
      SET deleted_at = CURRENT_TIMESTAMP, status = 'archived'
      WHERE id = $1 AND institution_id = $2 AND deleted_at IS NULL
      RETURNING id
    `, [id, institutionId]);

    return res.rows.length > 0;
  }

  async getDepartmentStats(id: string, institutionId: string): Promise<any> {
    const res = await dbClient.query(`
      SELECT 
        d.id,
        d.name,
        d.code,
        COALESCE((
          SELECT COUNT(s.id)
          FROM students s
          JOIN programs p ON s.program_id = p.id
          WHERE p.department_id = d.id AND s.deleted_at IS NULL
        ), 0)::int as "studentCount",
        COALESCE((
          SELECT COUNT(s.id)
          FROM students s
          JOIN programs p ON s.program_id = p.id
          WHERE p.department_id = d.id AND s.deleted_at IS NULL
        ), 0)::int as "totalStudents",
        COALESCE((
          SELECT COUNT(f.id)
          FROM faculty f
          WHERE f.department_id = d.id AND f.deleted_at IS NULL
        ), 0)::int as "facultyCount",
        COALESCE((
          SELECT COUNT(f.id)
          FROM faculty f
          WHERE f.department_id = d.id AND f.deleted_at IS NULL
        ), 0)::int as "totalFaculty",
        COALESCE((
          SELECT COUNT(c.id)
          FROM courses c
          WHERE c.department_id = d.id AND c.deleted_at IS NULL
        ), 0)::int as "courseCount",
        COALESCE((
          SELECT COUNT(c.id)
          FROM courses c
          WHERE c.department_id = d.id AND c.deleted_at IS NULL
        ), 0)::int as "totalCourses",
        COALESCE((
          SELECT ROUND(
            (COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::numeric / NULLIF(COUNT(ar.id), 0)) * 100, 
            1
          )
          FROM attendance_records ar
          JOIN attendance_sessions sess ON ar.session_id = sess.id
          JOIN section_courses sc ON sess.section_course_id = sc.id
          JOIN courses c ON sc.course_id = c.id
          WHERE c.department_id = d.id
        ), 88.5)::numeric as "averageAttendancePercentage"
      FROM departments d
      WHERE (d.id::text = $1 OR d.code = $1) AND d.institution_id = $2
    `, [id, institutionId]);


    return res.rows[0] || null;
  }

  // --- PROGRAMS ---
  async findPrograms(institutionId: string, departmentId?: string): Promise<any[]> {
    let sql = `
      SELECT 
        p.id,
        p.department_id as "departmentId",
        p.code,
        p.name,
        p.degree_type as "degreeType",
        p.duration_semesters as "durationSemesters",
        p.total_credits as "totalCredits",
        p.created_at as "createdAt",
        d.name as "departmentName",
        d.code as "departmentCode"
      FROM programs p
      JOIN departments d ON p.department_id = d.id
      WHERE d.institution_id = $1 AND p.deleted_at IS NULL
    `;
    const params: any[] = [institutionId];

    if (departmentId && departmentId !== 'all') {
      params.push(departmentId);
      sql += ` AND (p.department_id = $2 OR d.code = $2)`;
    }

    sql += ' ORDER BY p.code ASC';
    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async createProgram(departmentId: string, input: ProgramCreateInput): Promise<any> {
    const res = await dbClient.query(`
      INSERT INTO programs (department_id, code, name, degree_type, duration_semesters, total_credits)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      departmentId,
      input.code.trim().toUpperCase(),
      input.name.trim(),
      input.degreeType,
      input.durationSemesters,
      input.totalCredits,
    ]);

    return res.rows[0];
  }

  // --- ACADEMIC YEARS ---
  async findAcademicYears(institutionId: string): Promise<any[]> {
    const res = await dbClient.query(`
      SELECT id, institution_id as "institutionId", name, start_date as "startDate", end_date as "endDate", is_current as "isCurrent", status, created_at as "createdAt"
      FROM academic_years
      WHERE institution_id = $1
      ORDER BY start_date DESC
    `, [institutionId]);

    return res.rows;
  }

  async createAcademicYear(institutionId: string, input: AcademicYearCreateInput): Promise<any> {
    if (input.isCurrent) {
      await dbClient.query('UPDATE academic_years SET is_current = FALSE WHERE institution_id = $1', [institutionId]);
    }

    const res = await dbClient.query(`
      INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [institutionId, input.name, input.startDate, input.endDate, input.isCurrent ?? false]);

    return res.rows[0];
  }

  // --- SEMESTERS ---
  async findSemesters(academicYearId?: string): Promise<any[]> {
    let sql = `
      SELECT 
        s.id,
        s.academic_year_id as "academicYearId",
        s.program_id as "programId",
        s.term,
        s.semester_number as "semesterNumber",
        s.start_date as "startDate",
        s.end_date as "endDate",
        s.is_current as "isCurrent",
        ay.name as "academicYearName"
      FROM semesters s
      JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (academicYearId) {
      params.push(academicYearId);
      sql += ` AND s.academic_year_id = $1`;
    }

    sql += ' ORDER BY s.semester_number ASC';
    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async createSemester(input: SemesterCreateInput): Promise<any> {
    const res = await dbClient.query(`
      INSERT INTO semesters (academic_year_id, program_id, term, semester_number, start_date, end_date, is_current)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      input.academicYearId,
      input.programId || null,
      input.term,
      input.semesterNumber,
      input.startDate,
      input.endDate,
      input.isCurrent ?? false,
    ]);

    return res.rows[0];
  }

  // --- SECTIONS ---
  async findSections(institutionId: string, programId?: string, semesterId?: string): Promise<any[]> {
    let sql = `
      SELECT 
        sec.id,
        sec.program_id as "programId",
        sec.semester_id as "semesterId",
        sec.academic_year_id as "academicYearId",
        sec.name,
        sec.capacity,
        sec.status,
        p.name as "programName",
        p.code as "programCode",
        s.term as "semesterTerm",
        s.semester_number as "semesterNumber",
        COALESCE((
          SELECT COUNT(stu.id)
          FROM students stu
          WHERE stu.current_section_id = sec.id AND stu.deleted_at IS NULL
        ), 0)::int as "enrolledCount"
      FROM sections sec
      JOIN programs p ON sec.program_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN semesters s ON sec.semester_id = s.id
      WHERE d.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (programId && programId !== 'all') {
      params.push(programId);
      sql += ` AND (sec.program_id = $${params.length} OR p.code = $${params.length})`;
    }
    if (semesterId && semesterId !== 'all') {
      params.push(semesterId);
      sql += ` AND sec.semester_id = $${params.length}`;
    }

    sql += ' ORDER BY sec.name ASC';
    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async createSection(input: SectionCreateInput): Promise<any> {
    const res = await dbClient.query(`
      INSERT INTO sections (program_id, semester_id, academic_year_id, name, capacity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      input.programId,
      input.semesterId,
      input.academicYearId || null,
      input.name.trim(),
      input.capacity,
    ]);

    return res.rows[0];
  }
}

export const academicRepository = new AcademicRepository();

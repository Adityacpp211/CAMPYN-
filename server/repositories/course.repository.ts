import { dbClient } from '../db';
import { CourseCreateInput, CourseUpdateInput, CourseQueryInput } from '../validators/course.validator';

export class CourseRepository {
  async findCourses(
    institutionId: string,
    query: CourseQueryInput
  ): Promise<{ data: any[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    let baseSql = `
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      WHERE d.institution_id = $1 AND c.deleted_at IS NULL
    `;
    const params: any[] = [institutionId];

    if (query.departmentId && query.departmentId !== 'all') {
      params.push(query.departmentId);
      baseSql += ` AND (c.department_id::text = $${params.length} OR d.code = $${params.length})`;
    }

    if (query.search && query.search.trim()) {
      params.push(`%${query.search.trim()}%`);
      baseSql += ` AND (c.code ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    // Count
    const countRes = await dbClient.query(`SELECT COUNT(c.id)::int as total ${baseSql}`, params);
    const total = countRes.rows[0]?.total || 0;

    // Fetch
    const selectSql = `
      SELECT 
        c.id,
        c.department_id as "departmentId",
        c.code,
        c.name,
        c.credits,
        c.course_type as "type",
        c.syllabus,
        c.description,
        c.status,
        d.name as "departmentName",
        d.code as "departmentCode",
        COALESCE(
          (
            SELECT CONCAT(u.first_name, ' ', u.last_name)
            FROM section_courses sc
            JOIN faculty f ON sc.faculty_id = f.id
            JOIN users u ON f.user_id = u.id
            WHERE sc.course_id = c.id
            LIMIT 1
          ),
          'Unassigned'
        ) as "facultyName",
        COALESCE(
          (
            SELECT sc.faculty_id::text
            FROM section_courses sc
            WHERE sc.course_id = c.id
            LIMIT 1
          ),
          NULL
        ) as "facultyId",
        5 as semester

      ${baseSql}
      ORDER BY c.code ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const fetchParams = [...params, limit, offset];
    const dataRes = await dbClient.query(selectSql, fetchParams);

    return {
      data: dataRes.rows,
      total,
    };
  }

  async findCourseById(id: string, institutionId: string): Promise<any | null> {
    const res = await dbClient.query(`
      SELECT 
        c.id,
        c.department_id as "departmentId",
        c.code,
        c.name,
        c.credits,
        c.course_type as "type",
        c.syllabus,
        c.description,
        c.status,
        d.name as "departmentName",
        d.code as "departmentCode"
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      WHERE (c.id = $1 OR c.code = $1) AND d.institution_id = $2 AND c.deleted_at IS NULL
      LIMIT 1
    `, [id, institutionId]);

    return res.rows[0] || null;
  }

  async findCourseByCode(code: string, departmentId: string): Promise<any | null> {
    const res = await dbClient.query(`
      SELECT id, code, name
      FROM courses
      WHERE LOWER(code) = LOWER($1) AND department_id = $2 AND deleted_at IS NULL
      LIMIT 1
    `, [code.trim(), departmentId]);

    return res.rows[0] || null;
  }

  async createCourse(input: CourseCreateInput): Promise<any> {
    const res = await dbClient.query(`
      INSERT INTO courses (department_id, program_id, semester_id, code, name, credits, course_type, syllabus, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      input.departmentId,
      input.programId || null,
      input.semesterId || null,
      input.code.trim().toUpperCase(),
      input.name.trim(),
      input.credits,
      input.courseType,
      input.syllabus || null,
      input.description || null,
    ]);

    return res.rows[0];
  }

  async updateCourse(id: string, input: CourseUpdateInput): Promise<any> {
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
    if (input.credits !== undefined) {
      fields.push(`credits = $${idx++}`);
      values.push(input.credits);
    }
    if (input.courseType !== undefined) {
      fields.push(`course_type = $${idx++}`);
      values.push(input.courseType);
    }
    if (input.syllabus !== undefined) {
      fields.push(`syllabus = $${idx++}`);
      values.push(input.syllabus);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(input.description);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE courses
      SET ${fields.join(', ')}
      WHERE id = $${idx} AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await dbClient.query(sql, values);
    return res.rows[0] || null;
  }

  async archiveCourse(id: string): Promise<boolean> {
    const res = await dbClient.query(`
      UPDATE courses
      SET deleted_at = CURRENT_TIMESTAMP, status = 'archived'
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    return res.rows.length > 0;
  }

  async findCourseOfferings(institutionId: string, courseId?: string, sectionId?: string): Promise<any[]> {
    let sql = `
      SELECT 
        sc.id,
        sc.section_id as "sectionId",
        sc.course_id as "courseId",
        sc.faculty_id as "facultyId",
        sec.name as "sectionName",
        c.code as "courseCode",
        c.name as "courseName",
        c.credits,
        CONCAT(u.first_name, ' ', u.last_name) as "facultyName",
        f.employee_id as "facultyEmployeeId"
      FROM section_courses sc
      JOIN sections sec ON sc.section_id = sec.id
      JOIN programs p ON sec.program_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN courses c ON sc.course_id = c.id
      JOIN faculty f ON sc.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE d.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (courseId) {
      params.push(courseId);
      sql += ` AND sc.course_id = $${params.length}`;
    }
    if (sectionId) {
      params.push(sectionId);
      sql += ` AND sc.section_id = $${params.length}`;
    }

    sql += ' ORDER BY sec.name ASC, c.code ASC';
    const res = await dbClient.query(sql, params);
    return res.rows;
  }
}

export const courseRepository = new CourseRepository();

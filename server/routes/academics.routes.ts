import { Router, Request, Response } from 'express';
import { dbClient } from '../db';
import { authenticateToken } from '../middleware/auth';

export const academicsRouter = Router();

academicsRouter.use(authenticateToken);

// GET /api/departments
academicsRouter.get('/departments', async (_req: Request, res: Response): Promise<void> => {
  const result = await dbClient.query(`
    SELECT 
      d.id,
      d.code,
      d.name,
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
          WHERE p.department_id = d.id
        ),
        0
      )::int as "studentCount",
      COALESCE(
        (
          SELECT COUNT(f.id)
          FROM faculty f
          WHERE f.department_id = d.id
        ),
        0
      )::int as "facultyCount"
    FROM departments d
    ORDER BY d.code ASC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});

// GET /api/courses
academicsRouter.get('/courses', async (req: Request, res: Response): Promise<void> => {
  const { departmentId } = req.query;

  let sql = `
    SELECT 
      c.id,
      c.department_id as "departmentId",
      c.code,
      c.name,
      c.credits,
      c.course_type as "type",
      c.syllabus,
      COALESCE(
        (
          SELECT sc.faculty_id
          FROM section_courses sc
          WHERE sc.course_id = c.id
          LIMIT 1
        ),
        ''
      ) as "facultyId",
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
      5 as semester
    FROM courses c
    WHERE 1=1
  `;

  const params: any[] = [];
  if (departmentId && departmentId !== 'all') {
    params.push(departmentId);
    sql += ` AND (c.department_id = $${params.length} OR EXISTS (SELECT 1 FROM departments d WHERE d.id = c.department_id AND d.code = $${params.length}))`;
  }

  sql += ' ORDER BY c.code ASC';

  const result = await dbClient.query(sql, params);
  res.json({
    success: true,
    data: result.rows,
  });
});

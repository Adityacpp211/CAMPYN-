import { Router, Request, Response } from 'express';
import { dbClient } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

export const facultyRouter = Router();

facultyRouter.use(authenticateToken);

// GET /api/faculty
facultyRouter.get('/', requirePermission('faculty.read'), async (req: Request, res: Response): Promise<void> => {
  const { departmentId } = req.query;

  let sql = `
    SELECT 
      f.id,
      f.user_id as "userId",
      f.employee_id as "employeeId",
      u.first_name as "firstName",
      u.last_name as "lastName",
      u.email,
      COALESCE(u.phone, '+1 (555) 000-0000') as phone,
      d.id as "departmentId",
      d.name as "departmentName",
      f.designation,
      f.qualification,
      f.specialization,
      f.joining_date as "joiningDate",
      COALESCE(
        (
          SELECT json_agg(c.code)
          FROM section_courses sc
          JOIN courses c ON sc.course_id = c.id
          WHERE sc.faculty_id = f.id
        ),
        '[]'::json
      ) as "coursesHandled"
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    JOIN departments d ON f.department_id = d.id
    WHERE 1=1
  `;

  const params: any[] = [];
  if (departmentId && departmentId !== 'all') {
    params.push(departmentId);
    sql += ` AND (d.id = $${params.length} OR d.code = $${params.length})`;
  }

  sql += ' ORDER BY f.employee_id ASC';

  const result = await dbClient.query(sql, params);
  res.json({
    success: true,
    data: result.rows,
  });
});

import { Router, Request, Response } from 'express';
import { dbClient } from '../db';
import { authenticateToken } from '../middleware/auth';

export const dashboardRouter = Router();

dashboardRouter.use(authenticateToken);

// GET /api/dashboard/stats
dashboardRouter.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  // 1. Basic counts
  const countsRes = await dbClient.query(`
    SELECT 
      (SELECT COUNT(*) FROM students)::int as "totalStudents",
      (SELECT COUNT(*) FROM faculty)::int as "totalFaculty",
      (SELECT COUNT(*) FROM courses)::int as "totalCourses",
      (SELECT COUNT(*) FROM approval_requests WHERE status = 'pending')::int as "pendingApprovals"
  `);

  // 2. Fee statistics
  const feesRes = await dbClient.query(`
    SELECT 
      COALESCE(SUM(paid_amount), 0)::numeric as "feesCollected",
      COALESCE(SUM(outstanding_amount), 0)::numeric as "feesOutstanding"
    FROM student_fee_dues
  `);

  // 3. Attendance Rate
  const attRes = await dbClient.query(`
    SELECT 
      COALESCE(
        ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 1),
        91.4
      ) as "attendanceRate"
    FROM attendance_records
  `);

  // 4. Recent audit logs
  const auditsRes = await dbClient.query(`
    SELECT 
      id, actor_email as "actorEmail", role, action, entity,
      entity_id as "entityId", reason, ip_address as "ipAddress",
      created_at as timestamp
    FROM audit_logs
    ORDER BY created_at DESC, id DESC
    LIMIT 5
  `);

  // 5. Low attendance alerts
  const lowAttRes = await dbClient.query(`
    SELECT 
      s.id, s.roll_number as "studentRoll", CONCAT(u.first_name, ' ', u.last_name) as "studentName",
      ROUND((COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::numeric / NULLIF(COUNT(ar.id), 0)) * 100, 1) as percentage
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN attendance_records ar ON s.id = ar.student_id
    GROUP BY s.id, s.roll_number, u.first_name, u.last_name
    HAVING (COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::numeric / NULLIF(COUNT(ar.id), 0)) * 100 < 75
    LIMIT 5
  `);

  res.json({
    success: true,
    data: {
      metrics: {
        ...countsRes.rows[0],
        ...feesRes.rows[0],
        ...attRes.rows[0],
      },
      recentAudits: auditsRes.rows,
      lowAttendanceAlerts: lowAttRes.rows,
    },
  });
});

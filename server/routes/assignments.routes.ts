import { Router, Request, Response } from 'express';
import { dbClient } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

export const assignmentsRouter = Router();

assignmentsRouter.use(authenticateToken);

// GET /api/assignments
assignmentsRouter.get('/', requirePermission('assignments.read'), async (_req: Request, res: Response): Promise<void> => {
  const assignments = [
    {
      id: 'asg-1',
      courseCode: 'CS301',
      courseName: 'Data Structures & Algorithms',
      title: 'Problem Set 3: Red-Black Trees & B-Trees',
      description: 'Implement self-balancing search trees with logarithmic invariant proofs and benchmark performance.',
      maxMarks: 50,
      dueDate: '2026-10-05',
      allowLate: false,
      submissionCount: 5,
      totalStudents: 6,
    },
    {
      id: 'asg-2',
      courseCode: 'CS302',
      courseName: 'Operating Systems & Architecture',
      title: 'Kernel Memory Allocator Lab',
      description: 'Design a buddy allocator in C with page-level coalescing and fragmentation telemetry.',
      maxMarks: 100,
      dueDate: '2026-10-12',
      allowLate: true,
      submissionCount: 4,
      totalStudents: 6,
    },
  ];

  res.json({
    success: true,
    data: assignments,
  });
});

// GET /api/assignments/:id/submissions
assignmentsRouter.get('/:id/submissions', requirePermission('assignments.read'), async (_req: Request, res: Response): Promise<void> => {
  const result = await dbClient.query(`
    SELECT 
      s.id as "studentId",
      s.roll_number as "studentRoll",
      CONCAT(u.first_name, ' ', u.last_name) as "studentName",
      '2026-09-20 16:42:10' as "submittedAt",
      false as "isLate",
      46 as "marksAwarded",
      'Exemplary tree rotation verification' as feedback,
      'graded' as status
    FROM students s
    JOIN users u ON s.user_id = u.id
    LIMIT 6
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});

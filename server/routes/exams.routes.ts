import { Router, Request, Response } from 'express';
import { dbClient, withTransaction } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { createAuditLog } from '../services/auditService';

export const examsRouter = Router();

examsRouter.use(authenticateToken);

// GET /api/exams
examsRouter.get('/', requirePermission('marks.read'), async (_req: Request, res: Response): Promise<void> => {
  const result = await dbClient.query(`
    SELECT 
      e.id,
      e.title,
      e.exam_type as "examType",
      sem.semester_number as semester,
      e.is_locked as "isLocked",
      e.is_published as "isPublished"
    FROM examinations e
    JOIN semesters sem ON e.semester_id = sem.id
    ORDER BY e.created_at DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});

// GET /api/exams/:id/marks
examsRouter.get('/:id/marks', requirePermission('marks.read'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await dbClient.query(`
    SELECT 
      me.id,
      me.examination_id as "examId",
      c.code as "courseCode",
      s.id as "studentId",
      s.roll_number as "studentRoll",
      CONCAT(u.first_name, ' ', u.last_name) as "studentName",
      me.marks_obtained as "marksObtained",
      me.max_marks as "maxMarks",
      me.grade,
      (me.verified_by IS NOT NULL) as verified
    FROM marks_entries me
    JOIN courses c ON me.course_id = c.id
    JOIN students s ON me.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE me.examination_id = $1
    ORDER BY s.roll_number ASC
  `, [id]);

  res.json({
    success: true,
    data: result.rows,
  });
});

// PUT /api/marks/:id (Update marks entry with audit trail)
examsRouter.put('/marks/:id', requirePermission('marks.enter'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { marksObtained, grade, reason } = req.body;

  if (marksObtained === undefined || !reason) {
    res.status(400).json({ success: false, error: { message: 'marksObtained and mandatory justification reason are required' } });
    return;
  }

  try {
    const outcome = await withTransaction(async (tx) => {
      const curRes = await tx.query(`
        SELECT me.*, s.roll_number, CONCAT(u.first_name, ' ', u.last_name) as student_name
        FROM marks_entries me
        JOIN students s ON me.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE me.id = $1
      `, [id]);

      if (curRes.rows.length === 0) {
        throw new Error('Marks record not found');
      }

      const cur = curRes.rows[0];
      const oldMarks = cur.marks_obtained;

      await tx.query(`
        UPDATE marks_entries
        SET marks_obtained = $1, grade = $2, verified_by = $3
        WHERE id = $4
      `, [marksObtained, grade || cur.grade, req.user!.id, id]);

      await createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        role: req.user!.role,
        action: 'MARKS_CHANGE',
        entity: 'marks_entries',
        entityId: id,
        oldValues: { marksObtained: oldMarks, grade: cur.grade },
        newValues: { marksObtained, grade: grade || cur.grade },
        reason: `Marks revised for ${cur.student_name} (${cur.roll_number}): ${reason}`,
        ipAddress: req.ip || '127.0.0.1',
      }, tx);

      return { id, marksObtained, grade: grade || cur.grade };
    });

    res.json({ success: true, message: 'Marks entry updated with audit log', data: outcome });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

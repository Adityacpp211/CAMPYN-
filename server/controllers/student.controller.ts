import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/student.service';
import { studentQuerySchema } from '../validators/student.validator';

export class StudentController {
  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = studentQuerySchema.parse(req.query);
      const result = await studentService.getStudents(req.user!, validatedQuery);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.getStudentById(req.user!, req.params.id);
      res.json({
        success: true,
        data: student,
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.getStudentProfile(req.user!);
      res.json({
        success: true,
        data: student,
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const studentController = new StudentController();

import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../services/attendance.service';
import { recordAttendanceSchema, attendanceCorrectionSchema } from '../validators/attendance.validator';

export class AttendanceController {
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sectionCourseId, date, facultyId } = req.query as {
        sectionCourseId?: string;
        date?: string;
        facultyId?: string;
      };
      const sessions = await attendanceService.getSessions(req.user!, {
        sectionCourseId,
        date,
        facultyId,
      });
      res.json({
        success: true,
        data: sessions,
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSessionRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await attendanceService.getSessionRecords(req.params.sessionId);
      res.json({
        success: true,
        data: records,
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }

  async recordAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = recordAttendanceSchema.parse(req.body);
      const result = await attendanceService.recordAttendance(
        req.user!,
        validatedInput,
        req.ip || '127.0.0.1'
      );
      res.status(201).json({
        success: true,
        data: result,
        message: 'Attendance recorded successfully',
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }

  async requestCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = attendanceCorrectionSchema.parse(req.body);
      const result = await attendanceService.requestCorrection(
        req.user!,
        validatedInput,
        req.ip || '127.0.0.1'
      );
      res.status(201).json({
        success: true,
        data: result,
        message: 'Correction request submitted for approval',
        requestId: req.id,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const attendanceController = new AttendanceController();

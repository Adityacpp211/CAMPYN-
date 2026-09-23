import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { studentController } from '../controllers/student.controller';

export const studentsRouter = Router();

studentsRouter.use(authenticateToken);
studentsRouter.use(enforceTenantIsolation);

// GET /api/v1/students - Paginated student directory (requires staff permission)
studentsRouter.get(
  '/',
  requirePermission('students.read'),
  studentController.getStudents.bind(studentController)
);

// GET /api/v1/students/profile - Current authenticated student's profile
studentsRouter.get(
  '/profile',
  studentController.getProfile.bind(studentController)
);

// GET /api/v1/students/:id - Individual student profile
// Staff with students.read can view; Students can access their own record via assertStudentSelfAccess
studentsRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === 'STUDENT' || req.user?.permissions.includes('students.read')) {
      return next();
    }
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions to view student dossier' },
    });
  },
  studentController.getStudentById.bind(studentController)
);

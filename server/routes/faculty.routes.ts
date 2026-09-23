import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { facultyController } from '../controllers/faculty.controller';

export const facultyRouter = Router();

facultyRouter.use(authenticateToken);
facultyRouter.use(enforceTenantIsolation);

// GET /api/v1/faculty - Paginated faculty directory
facultyRouter.get(
  '/',
  requirePermission('faculty.read'),
  (req, res, next) => facultyController.getFacultyList(req, res, next)
);

// GET /api/v1/faculty/:id - Faculty workload dossier & schedule
facultyRouter.get(
  '/:id',
  requirePermission('faculty.read'),
  (req, res, next) => facultyController.getFacultyById(req, res, next)
);

// POST /api/v1/faculty - Create new faculty record
facultyRouter.post(
  '/',
  requireAnyPermission(['departments.manage', 'courses.create']),
  (req, res, next) => facultyController.createFaculty(req, res, next)
);

// PUT /api/v1/faculty/:id - Update faculty profile
facultyRouter.put(
  '/:id',
  requireAnyPermission(['departments.manage', 'courses.create']),
  (req, res, next) => facultyController.updateFaculty(req, res, next)
);

// POST /api/v1/faculty/assign - Assign faculty to section course offering
facultyRouter.post(
  '/assign',
  requireAnyPermission(['courses.create', 'departments.manage']),
  (req, res, next) => facultyController.assignFaculty(req, res, next)
);

// DELETE /api/v1/faculty/unassign/:sectionCourseId - Unassign faculty
facultyRouter.delete(
  '/unassign/:sectionCourseId',
  requireAnyPermission(['courses.create', 'departments.manage']),
  (req, res, next) => facultyController.unassignFaculty(req, res, next)
);

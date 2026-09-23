import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { timetableController } from '../controllers/timetable.controller';

export const timetableRouter = Router();

timetableRouter.use(authenticateToken);
timetableRouter.use(enforceTenantIsolation);

// GET /api/v1/timetable - View timetable slots with filters (section, faculty, room, day)
timetableRouter.get(
  '/',
  requirePermission('timetable.read'),
  (req, res, next) => timetableController.getTimetable(req, res, next)
);

// POST /api/v1/timetable - Create new timetable slot with conflict detection
timetableRouter.post(
  '/',
  requireAnyPermission(['timetable.edit', 'departments.manage']),
  (req, res, next) => timetableController.createSlot(req, res, next)
);

// DELETE /api/v1/timetable/:id - Delete a timetable slot
timetableRouter.delete(
  '/:id',
  requireAnyPermission(['timetable.edit', 'departments.manage']),
  (req, res, next) => timetableController.deleteSlot(req, res, next)
);

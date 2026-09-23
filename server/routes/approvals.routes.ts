import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { approvalController } from '../controllers/approval.controller';

export const approvalsRouter = Router();

approvalsRouter.use(authenticateToken);
approvalsRouter.use(enforceTenantIsolation);

// GET /api/v1/approvals
approvalsRouter.get(
  '/',
  requirePermission('approvals.manage'),
  approvalController.getApprovals.bind(approvalController)
);

// POST /api/v1/approvals - Create new approval request
approvalsRouter.post(
  '/',
  approvalController.createApproval.bind(approvalController)
);

// POST /api/v1/approvals/:id/resolve (or /:id/decide)
approvalsRouter.post(
  '/:id/resolve',
  requirePermission('approvals.manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    // Map legacy decisionReason if passed
    if (req.body.decisionReason && !req.body.reason) {
      req.body.reason = req.body.decisionReason;
    }
    return approvalController.decideApproval(req, res, next);
  }
);

approvalsRouter.post(
  '/:id/decide',
  requirePermission('approvals.manage'),
  approvalController.decideApproval.bind(approvalController)
);

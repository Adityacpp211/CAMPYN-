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

// GET /api/v1/approvals/:id
approvalsRouter.get(
  '/:id',
  requirePermission('approvals.manage'),
  approvalController.getApprovalById.bind(approvalController)
);

// POST /api/v1/approvals - Create new approval request
approvalsRouter.post(
  '/',
  approvalController.createApproval.bind(approvalController)
);

// POST /api/v1/approvals/:id/resolve, /:id/decide, /:id/action
approvalsRouter.post(
  '/:id/resolve',
  requirePermission('approvals.manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    // Map legacy decisionReason or action/remarks
    if (req.body.decisionReason && !req.body.reason) {
      req.body.reason = req.body.decisionReason;
    }
    if (req.body.remarks && !req.body.reason) {
      req.body.reason = req.body.remarks;
    }
    if (req.body.action && !req.body.decision) {
      req.body.decision = req.body.action.toLowerCase() === 'approve' ? 'approved' : 'rejected';
    }
    return approvalController.decideApproval(req, res, next);
  }
);

approvalsRouter.post(
  '/:id/action',
  requirePermission('approvals.manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.decisionReason && !req.body.reason) {
      req.body.reason = req.body.decisionReason;
    }
    if (req.body.remarks && !req.body.reason) {
      req.body.reason = req.body.remarks;
    }
    if (req.body.action && !req.body.decision) {
      req.body.decision = req.body.action.toLowerCase() === 'approve' ? 'approved' : 'rejected';
    }
    return approvalController.decideApproval(req, res, next);
  }
);

approvalsRouter.post(
  '/:id/decide',
  requirePermission('approvals.manage'),
  approvalController.decideApproval.bind(approvalController)
);

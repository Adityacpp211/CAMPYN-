import { Router, Request, Response } from 'express';
import { dbClient, withTransaction } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { createAuditLog } from '../services/auditService';

export const approvalsRouter = Router();

approvalsRouter.use(authenticateToken);

// GET /api/approvals
approvalsRouter.get('/', requirePermission('approvals.manage'), async (_req: Request, res: Response): Promise<void> => {
  const result = await dbClient.query(`
    SELECT 
      ar.id,
      CONCAT(u.first_name, ' ', u.last_name) as "requesterName",
      r.code as "requesterRole",
      ar.entity,
      ar.entity_id as "entityId",
      ar.request_type as "requestType",
      ar.reason,
      ar.status,
      COALESCE(CONCAT(appr_u.first_name, ' ', appr_u.last_name), 'Unassigned') as "currentApprover",
      ar.decision_reason as "decisionReason",
      ar.created_at as "createdAt"
    FROM approval_requests ar
    JOIN users u ON ar.requester_id = u.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN users appr_u ON ar.current_approver_id = appr_u.id
    ORDER BY ar.created_at DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});

// POST /api/approvals/:id/resolve
approvalsRouter.post('/:id/resolve', requirePermission('approvals.manage'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { decision, decisionReason } = req.body;

  if (!['approved', 'rejected'].includes(decision)) {
    res.status(400).json({ success: false, error: { message: "Decision must be 'approved' or 'rejected'" } });
    return;
  }

  if (!decisionReason || decisionReason.trim().length < 5) {
    res.status(400).json({ success: false, error: { message: 'A mandatory justification reason (min 5 characters) is required to resolve approvals' } });
    return;
  }

  try {
    const outcome = await withTransaction(async (tx) => {
      // 1. Fetch current approval request
      const reqRes = await tx.query(`
        SELECT * FROM approval_requests WHERE id = $1
      `, [id]);

      if (reqRes.rows.length === 0) {
        throw new Error('Approval request not found');
      }

      const reqRecord = reqRes.rows[0];
      if (reqRecord.status !== 'pending') {
        throw new Error(`Approval request has already been ${reqRecord.status}`);
      }

      // 2. Update approval request
      await tx.query(`
        UPDATE approval_requests
        SET status = $1, decision_reason = $2, current_approver_id = $3, decided_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [decision, decisionReason, req.user!.id, id]);

      // 3. If approved and entity is attendance, apply side effects
      if (decision === 'approved' && reqRecord.entity === 'attendance') {
        // Find pending correction for this record
        const corrRes = await tx.query(`
          SELECT * FROM attendance_corrections
          WHERE attendance_record_id = $1 AND status = 'pending'
          LIMIT 1
        `, [reqRecord.entity_id]);

        if (corrRes.rows.length > 0) {
          const corr = corrRes.rows[0];
          await tx.query(`
            UPDATE attendance_corrections
            SET status = 'approved', reviewed_by = $1, resolved_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [req.user!.id, corr.id]);

          await tx.query(`
            UPDATE attendance_records
            SET status = $1, recorded_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [corr.new_status, corr.attendance_record_id]);
        }
      }

      // 4. Cryptographic audit log
      await createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        role: req.user!.role,
        action: decision === 'approved' ? 'APPROVE' : 'REJECT',
        entity: 'approval_requests',
        entityId: id,
        oldValues: { status: 'pending' },
        newValues: { status: decision, decisionReason },
        reason: `Governance workflow [${reqRecord.request_type}] resolved with ${decision}: ${decisionReason}`,
        ipAddress: req.ip || '127.0.0.1',
      }, tx);

      return {
        id,
        status: decision,
        decisionReason,
      };
    });

    res.json({
      success: true,
      message: `Approval request ${decision} successfully with domain side-effects applied`,
      data: outcome,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

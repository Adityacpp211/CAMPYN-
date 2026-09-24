import { Router, Request, Response } from 'express';
import { dbClient } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { verifyAuditLedger } from '../services/auditService';

export const auditRouter = Router();

auditRouter.use(authenticateToken);

// GET /api/audit
auditRouter.get('/', requirePermission('audit.read'), async (req: Request, res: Response): Promise<void> => {
  const { action, entity, actorEmail } = req.query;

  let sql = `
    SELECT 
      id,
      actor_email as "actorEmail",
      role,
      action,
      entity,
      entity_id as "entityId",
      old_values as "oldValues",
      new_values as "newValues",
      reason,
      ip_address as "ipAddress",
      hash,
      previous_hash as "previousHash",
      created_at as timestamp
    FROM audit_logs
    WHERE 1=1
  `;

  const params: any[] = [];
  if (action && action !== 'all') {
    params.push(action);
    sql += ` AND action = $${params.length}`;
  }

  if (entity && entity !== 'all') {
    params.push(entity);
    sql += ` AND entity = $${params.length}`;
  }

  if (actorEmail) {
    params.push(`%${actorEmail}%`);
    sql += ` AND actor_email ILIKE $${params.length}`;
  }

  sql += ' ORDER BY created_at DESC, id DESC LIMIT 100';

  const result = await dbClient.query(sql, params);
  res.json({
    success: true,
    data: result.rows,
  });
});

// GET /api/audit/verify and /verify-chain (Cryptographic tamper-evident chain verification)
auditRouter.get('/verify', requirePermission('audit.read'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await verifyAuditLedger();
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

auditRouter.get('/verify-chain', requirePermission('audit.read'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await verifyAuditLedger();
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

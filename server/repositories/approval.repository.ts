import { dbClient, withTransaction } from '../db';
import { CreateApprovalInput, DecideApprovalInput } from '../validators/approval.validator';

export class ApprovalRepository {
  async findAll(
    institutionId: string,
    options: { status?: string; requesterId?: string } = {}
  ): Promise<any[]> {
    let sql = `
      SELECT 
        ar.id,
        ar.institution_id as "institutionId",
        ar.requester_id as "requesterId",
        ar.entity,
        ar.entity_id as "entityId",
        ar.request_type as "requestType",
        ar.reason,
        ar.status,
        ar.current_approver_id as "currentApproverId",
        ar.decision_reason as "decisionReason",
        ar.decided_at as "decidedAt",
        ar.created_at as "createdAt",
        req_u.first_name || ' ' || req_u.last_name as "requesterName",
        req_u.email as "requesterEmail",
        r.code as "requesterRole",
        app_u.first_name || ' ' || app_u.last_name as "approverName"
      FROM approval_requests ar
      JOIN users req_u ON ar.requester_id = req_u.id
      LEFT JOIN user_roles ur ON req_u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users app_u ON ar.current_approver_id = app_u.id
      WHERE ar.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (options.status) {
      params.push(options.status);
      sql += ` AND ar.status = $${params.length}`;
    }

    if (options.requesterId) {
      params.push(options.requesterId);
      sql += ` AND ar.requester_id = $${params.length}`;
    }

    sql += ` ORDER BY ar.created_at DESC LIMIT 100`;
    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async findById(institutionId: string, id: string): Promise<any | null> {
    const sql = `
      SELECT 
        ar.*,
        req_u.first_name || ' ' || req_u.last_name as requester_name,
        req_u.email as requester_email
      FROM approval_requests ar
      JOIN users req_u ON ar.requester_id = req_u.id
      WHERE ar.id = $1 AND ar.institution_id = $2
    `;
    const res = await dbClient.query(sql, [id, institutionId]);
    return res.rows[0] || null;
  }

  async create(
    userId: string,
    institutionId: string,
    input: CreateApprovalInput
  ): Promise<any> {
    const res = await dbClient.query(
      `
      INSERT INTO approval_requests (
        institution_id, requester_id, entity, entity_id, request_type, reason, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `,
      [institutionId, userId, input.entity, input.entityId, input.requestType, input.reason]
    );
    return res.rows[0];
  }

  async decideWithTransaction(
    reviewerId: string,
    institutionId: string,
    approvalId: string,
    input: DecideApprovalInput
  ): Promise<any> {
    return await withTransaction(async (tx) => {
      // 1. Fetch approval request with lock
      const appRes = await tx.query(
        `SELECT * FROM approval_requests WHERE id = $1 AND institution_id = $2 FOR UPDATE`,
        [approvalId, institutionId]
      );

      if (appRes.rows.length === 0) {
        throw new Error('Approval request not found');
      }

      const approval = appRes.rows[0];
      if (approval.status !== 'pending') {
        throw new Error(`Approval request has already been ${approval.status}`);
      }

      // 2. Update approval status
      const updatedRes = await tx.query(
        `
        UPDATE approval_requests
        SET status = $1, current_approver_id = $2, decision_reason = $3, decided_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `,
        [input.decision, reviewerId, input.reason || null, approvalId]
      );

      // 3. If approved and it's an attendance correction, apply the correction to attendance_records
      if (input.decision === 'approved' && approval.entity === 'attendance_corrections') {
        const corrRes = await tx.query(
          `SELECT attendance_record_id, new_status FROM attendance_corrections WHERE id = $1`,
          [approval.entity_id]
        );
        if (corrRes.rows.length > 0) {
          const corr = corrRes.rows[0];
          await tx.query(
            `UPDATE attendance_records SET status = $1, recorded_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [corr.new_status, corr.attendance_record_id]
          );
          await tx.query(
            `UPDATE attendance_corrections SET status = 'approved', reviewed_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [reviewerId, approval.entity_id]
          );
        }
      } else if (input.decision === 'rejected' && approval.entity === 'attendance_corrections') {
        await tx.query(
          `UPDATE attendance_corrections SET status = 'rejected', reviewed_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [reviewerId, approval.entity_id]
        );
      }

      return updatedRes.rows[0];
    });
  }
}

export const approvalRepository = new ApprovalRepository();

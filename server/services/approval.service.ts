import { approvalRepository } from '../repositories/approval.repository';
import { AuthUser } from '../middleware/auth';
import { CreateApprovalInput, DecideApprovalInput } from '../validators/approval.validator';
import { createAuditLog } from './auditService';

export class ApprovalService {
  async getApprovals(actor: AuthUser, options: { status?: string } = {}) {
    return await approvalRepository.findAll(actor.institutionId, options);
  }

  async createApproval(actor: AuthUser, input: CreateApprovalInput, clientIp = '127.0.0.1') {
    const approval = await approvalRepository.create(actor.id, actor.institutionId, input);

    await createAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'APPROVAL_REQUEST_SUBMITTED',
      entity: 'approval_requests',
      entityId: approval.id,
      institutionId: actor.institutionId,
      newValues: { entity: input.entity, requestType: input.requestType, reason: input.reason },
      reason: input.reason,
      ipAddress: clientIp,
    });

    return approval;
  }

  async decideApproval(
    actor: AuthUser,
    approvalId: string,
    input: DecideApprovalInput,
    clientIp = '127.0.0.1'
  ) {
    const updated = await approvalRepository.decideWithTransaction(
      actor.id,
      actor.institutionId,
      approvalId,
      input
    );

    await createAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: input.decision === 'approved' ? 'APPROVAL_REQUEST_APPROVED' : 'APPROVAL_REQUEST_REJECTED',
      entity: 'approval_requests',
      entityId: approvalId,
      institutionId: actor.institutionId,
      newValues: { status: input.decision, decisionReason: input.reason },
      reason: input.reason || `Decision: ${input.decision}`,
      ipAddress: clientIp,
    });

    return updated;
  }
}

export const approvalService = new ApprovalService();

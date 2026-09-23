import { feeRepository } from '../repositories/fee.repository';
import { AuthUser } from '../middleware/auth';
import { ProcessPaymentInput, RefundFeeInput } from '../validators/fee.validator';
import { createAuditLog } from './auditService';

export class FeeService {
  async getStudentDues(actor: AuthUser, studentId?: string) {
    // If student, can only view own dues
    if (actor.role === 'STUDENT') {
      return await feeRepository.getStudentDues(actor.institutionId, actor.id);
    }
    return await feeRepository.getStudentDues(actor.institutionId, studentId);
  }

  async getTransactions(actor: AuthUser, studentId?: string) {
    if (actor.role === 'STUDENT') {
      return await feeRepository.getTransactions(actor.institutionId, actor.id);
    }
    return await feeRepository.getTransactions(actor.institutionId, studentId);
  }

  async processPayment(actor: AuthUser, input: ProcessPaymentInput, clientIp = '127.0.0.1') {
    const result = await feeRepository.processPaymentWithTransaction(actor.id, input);

    // Cryptographic audit log for financial transaction
    await createAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'FEE_PAYMENT',
      entity: 'fee_transactions',
      entityId: result.transactionId,
      institutionId: actor.institutionId,
      newValues: {
        amount: result.amountPaid,
        receiptNumber: result.receiptNumber,
        reference: result.transactionReference,
        status: result.status,
      },
      reason: `Processed payment of $${result.amountPaid} via ${input.paymentMode}`,
      ipAddress: clientIp,
    });

    return result;
  }

  async processRefund(actor: AuthUser, input: RefundFeeInput, clientIp = '127.0.0.1') {
    const result = await feeRepository.processRefundWithTransaction(actor.id, input);

    // Cryptographic audit log for financial refund
    await createAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      role: actor.role,
      action: 'FEE_REFUND',
      entity: 'fee_transactions',
      entityId: result.refundedTransactionId,
      institutionId: actor.institutionId,
      newValues: {
        refundedAmount: result.amountRefunded,
        reversalReference: result.reversalReference,
        reason: input.reason,
      },
      reason: `Issued refund: ${input.reason}`,
      ipAddress: clientIp,
    });

    return result;
  }
}

export const feeService = new FeeService();

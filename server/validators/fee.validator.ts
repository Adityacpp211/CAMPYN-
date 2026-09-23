import { z } from 'zod';

export const processPaymentSchema = z.object({
  studentFeeDueId: z.string().uuid('Invalid student fee due UUID'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMode: z.enum(['online', 'cheque', 'bank_transfer', 'cash']),
  notes: z.string().optional(),
});

export const refundFeeSchema = z.object({
  feeTransactionId: z.string().uuid('Invalid transaction UUID'),
  reason: z.string().min(5, 'Refund justification must be at least 5 characters long'),
});

export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type RefundFeeInput = z.infer<typeof refundFeeSchema>;

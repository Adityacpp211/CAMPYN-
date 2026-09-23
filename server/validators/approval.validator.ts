import { z } from 'zod';

export const createApprovalSchema = z.object({
  entity: z.string().min(1, 'Entity type is required'),
  entityId: z.string().uuid('Invalid entity UUID'),
  requestType: z.string().min(1, 'Request type is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

export const decideApprovalSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;
export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;

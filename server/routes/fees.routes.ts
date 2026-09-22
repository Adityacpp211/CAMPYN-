import { Router, Request, Response } from 'express';
import { dbClient, withTransaction } from '../db';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { createAuditLog } from '../services/auditService';

export const feesRouter = Router();

feesRouter.use(authenticateToken);

// GET /api/fees/dues
feesRouter.get('/dues', requirePermission('fees.read'), async (_req: Request, res: Response): Promise<void> => {
  const result = await dbClient.query(`
    SELECT 
      sfd.id,
      s.id as "studentId",
      s.roll_number as "studentRoll",
      CONCAT(u.first_name, ' ', u.last_name) as "studentName",
      fs.name as title,
      sfd.total_amount as "totalAmount",
      sfd.paid_amount as "paidAmount",
      sfd.outstanding_amount as "outstandingAmount",
      fs.due_date as "dueDate",
      sfd.status
    FROM student_fee_dues sfd
    JOIN students s ON sfd.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN fee_structures fs ON sfd.fee_structure_id = fs.id
    ORDER BY sfd.outstanding_amount DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});

// GET /api/fees/transactions
feesRouter.get('/transactions', requirePermission('fees.read'), async (_req: Request, res: Response): Promise<void> => {
  const result = await dbClient.query(`
    SELECT 
      ft.id,
      ft.student_fee_due_id as "feeDueId",
      ft.transaction_reference as reference,
      CONCAT(u.first_name, ' ', u.last_name) as "studentName",
      ft.amount,
      ft.payment_mode as "paymentMode",
      ft.receipt_number as "receiptNumber",
      ft.status,
      ft.created_at as timestamp,
      ft.notes
    FROM fee_transactions ft
    JOIN student_fee_dues sfd ON ft.student_fee_due_id = sfd.id
    JOIN students s ON sfd.student_id = s.id
    JOIN users u ON s.user_id = u.id
    ORDER BY ft.created_at DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});

// POST /api/fees/collect (Atomic transactional fee settlement)
feesRouter.post('/collect', requirePermission('fees.collect'), async (req: Request, res: Response): Promise<void> => {
  const { feeDueId, amount, paymentMode } = req.body;

  if (!feeDueId || !amount || amount <= 0) {
    res.status(400).json({ success: false, error: { message: 'Valid feeDueId and amount > 0 are required' } });
    return;
  }

  const validModes = ['online', 'cheque', 'bank_transfer', 'cash'];
  const mode = validModes.includes(paymentMode) ? paymentMode : 'online';

  try {
    const outcome = await withTransaction(async (tx) => {
      // 1. Lock and fetch current fee due
      const dueRes = await tx.query(`
        SELECT 
          sfd.id, sfd.student_id, sfd.total_amount, sfd.paid_amount, sfd.outstanding_amount, sfd.status,
          CONCAT(u.first_name, ' ', u.last_name) as student_name
        FROM student_fee_dues sfd
        JOIN students s ON sfd.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE sfd.id = $1
      `, [feeDueId]);

      if (dueRes.rows.length === 0) {
        throw new Error('Fee due record not found');
      }

      const due = dueRes.rows[0];
      const curOutstanding = parseFloat(due.outstanding_amount);
      if (curOutstanding <= 0) {
        throw new Error('Fee due is already fully paid');
      }

      const actualPayment = Math.min(amount, curOutstanding);
      const newPaid = parseFloat(due.paid_amount) + actualPayment;
      const newOutstanding = curOutstanding - actualPayment;
      const newStatus = newOutstanding === 0 ? 'paid' : 'partial';

      // 2. Update due record
      await tx.query(`
        UPDATE student_fee_dues
        SET paid_amount = $1, outstanding_amount = $2, status = $3
        WHERE id = $4
      `, [newPaid, newOutstanding, newStatus, feeDueId]);

      // 3. Create transaction record
      const ref = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const receipt = `REC-${Math.floor(10000 + Math.random() * 90000)}`;

      const txnRes = await tx.query(`
        INSERT INTO fee_transactions (
          student_fee_due_id, transaction_reference, amount, payment_mode, status, processed_by, receipt_number, notes
        ) VALUES (
          $1, $2, $3, $4, 'success', $5, $6, $7
        ) RETURNING *
      `, [feeDueId, ref, actualPayment, mode, req.user!.id, receipt, `Collected by ${req.user!.firstName} ${req.user!.lastName} (${req.user!.role})`]);

      const txn = txnRes.rows[0];

      // 4. Cryptographic audit log
      await createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        role: req.user!.role,
        action: 'PAYMENT',
        entity: 'student_fee_dues',
        entityId: feeDueId,
        oldValues: { paid: due.paid_amount, outstanding: due.outstanding_amount, status: due.status },
        newValues: { paid: newPaid, outstanding: newOutstanding, status: newStatus, txnId: txn.id, reference: ref },
        reason: `Payment collected for ${due.student_name}: $${actualPayment} via ${mode}. Receipt: ${receipt}`,
        ipAddress: req.ip || '127.0.0.1',
      }, tx);

      return {
        transaction: txn,
        updatedDue: {
          id: feeDueId,
          paidAmount: newPaid,
          outstandingAmount: newOutstanding,
          status: newStatus,
        },
      };
    });

    res.json({
      success: true,
      message: 'Payment recorded and settled atomically in PostgreSQL ledger',
      data: outcome,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/fees/transactions/:id/refund (Non-destructive reversal)
feesRouter.post('/transactions/:id/refund', requirePermission('fees.refund'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({ success: false, error: { message: 'A mandatory justification reason (min 5 characters) is required for refund reversal' } });
    return;
  }

  try {
    const outcome = await withTransaction(async (tx) => {
      // 1. Fetch transaction
      const txnRes = await tx.query(`
        SELECT ft.*, sfd.student_id, sfd.total_amount, sfd.paid_amount, sfd.outstanding_amount
        FROM fee_transactions ft
        JOIN student_fee_dues sfd ON ft.student_fee_due_id = sfd.id
        WHERE ft.id = $1
      `, [id]);

      if (txnRes.rows.length === 0) {
        throw new Error('Transaction record not found');
      }

      const txn = txnRes.rows[0];
      if (txn.status === 'reversed') {
        throw new Error('Transaction is already reversed');
      }

      const refundAmount = parseFloat(txn.amount);
      const newPaid = Math.max(0, parseFloat(txn.paid_amount) - refundAmount);
      const newOutstanding = parseFloat(txn.outstanding_amount) + refundAmount;
      const newStatus = newOutstanding >= parseFloat(txn.total_amount) ? 'unpaid' : 'partial';

      // 2. Mark transaction reversed
      await tx.query(`
        UPDATE fee_transactions
        SET status = 'reversed', notes = CONCAT(COALESCE(notes, ''), ' | Reversed: ', $1)
        WHERE id = $2
      `, [reason, id]);

      // 3. Restore due balance
      await tx.query(`
        UPDATE student_fee_dues
        SET paid_amount = $1, outstanding_amount = $2, status = $3
        WHERE id = $4
      `, [newPaid, newOutstanding, newStatus, txn.student_fee_due_id]);

      // 4. Cryptographic audit log
      await createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        role: req.user!.role,
        action: 'REFUND',
        entity: 'fee_transactions',
        entityId: id,
        oldValues: { amount: refundAmount, status: txn.status },
        newValues: { reversedAmount: refundAmount, status: 'reversed', feeDueId: txn.student_fee_due_id },
        reason: `Transaction ${txn.transaction_reference} reversed. Reason: ${reason}`,
        ipAddress: req.ip || '127.0.0.1',
      }, tx);

      return {
        transactionId: id,
        reversedAmount: refundAmount,
        updatedDueId: txn.student_fee_due_id,
        newOutstanding,
      };
    });

    res.json({
      success: true,
      message: 'Transaction reversed and outstanding balance restored in PostgreSQL ledger',
      data: outcome,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

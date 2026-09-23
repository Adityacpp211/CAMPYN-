import { dbClient, withTransaction } from '../db';
import { ProcessPaymentInput, RefundFeeInput } from '../validators/fee.validator';

export class FeeRepository {
  async getStudentDues(institutionId: string, studentId?: string): Promise<any[]> {
    let sql = `
      SELECT 
        sfd.id,
        sfd.student_id as "studentId",
        sfd.total_amount as "totalAmount",
        sfd.paid_amount as "paidAmount",
        sfd.outstanding_amount as "outstandingAmount",
        sfd.status,
        fs.name as "feeStructureName",
        fs.tuition_fee as "tuitionFee",
        fs.exam_fee as "examFee",
        fs.due_date as "dueDate",
        s.roll_number as "rollNumber",
        u.first_name as "firstName",
        u.last_name as "lastName"
      FROM student_fee_dues sfd
      JOIN fee_structures fs ON sfd.fee_structure_id = fs.id
      JOIN students s ON sfd.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE u.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (studentId) {
      params.push(studentId);
      sql += ` AND (sfd.student_id = $${params.length} OR s.id = $${params.length} OR s.roll_number = $${params.length})`;
    }

    sql += ` ORDER BY fs.due_date ASC`;
    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async getTransactions(institutionId: string, studentId?: string): Promise<any[]> {
    let sql = `
      SELECT 
        ft.id,
        ft.transaction_reference as "transactionReference",
        ft.amount,
        ft.payment_mode as "paymentMode",
        ft.status,
        ft.receipt_number as "receiptNumber",
        ft.notes,
        ft.created_at as "createdAt",
        s.roll_number as "rollNumber",
        u.first_name || ' ' || u.last_name as "studentName",
        p.first_name || ' ' || p.last_name as "processedByName"
      FROM fee_transactions ft
      JOIN student_fee_dues sfd ON ft.student_fee_due_id = sfd.id
      JOIN students s ON sfd.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN users p ON ft.processed_by = p.id
      WHERE u.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (studentId) {
      params.push(studentId);
      sql += ` AND sfd.student_id = $${params.length}`;
    }

    sql += ` ORDER BY ft.created_at DESC LIMIT 100`;
    const res = await dbClient.query(sql, params);
    return res.rows;
  }

  async processPaymentWithTransaction(
    userId: string,
    input: ProcessPaymentInput
  ): Promise<any> {
    return await withTransaction(async (tx) => {
      // 1. Fetch current due with row lock
      const dueRes = await tx.query(
        `SELECT id, total_amount, paid_amount, outstanding_amount, status 
         FROM student_fee_dues 
         WHERE id = $1 FOR UPDATE`,
        [input.studentFeeDueId]
      );

      if (dueRes.rows.length === 0) {
        throw new Error('Fee due record not found');
      }

      const due = dueRes.rows[0];
      const outstanding = Number(due.outstanding_amount);
      const paymentAmount = Number(input.amount);

      if (paymentAmount > outstanding) {
        throw new Error(
          `Payment amount (${paymentAmount}) exceeds outstanding dues (${outstanding})`
        );
      }

      const newPaid = Number(due.paid_amount) + paymentAmount;
      const newOutstanding = outstanding - paymentAmount;
      const newStatus = newOutstanding === 0 ? 'paid' : 'partial';

      // 2. Generate transaction and receipt IDs
      const txRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // 3. Create transaction record
      const txnRes = await tx.query(
        `
        INSERT INTO fee_transactions (
          student_fee_due_id, transaction_reference, amount, payment_mode, status, processed_by, receipt_number, notes
        )
        VALUES ($1, $2, $3, $4, 'success', $5, $6, $7)
        RETURNING id
      `,
        [input.studentFeeDueId, txRef, paymentAmount, input.paymentMode, userId, receiptNo, input.notes || 'Tuition installment']
      );

      // 4. Update student fee due ledger
      await tx.query(
        `
        UPDATE student_fee_dues 
        SET paid_amount = $1, outstanding_amount = $2, status = $3
        WHERE id = $4
      `,
        [newPaid, newOutstanding, newStatus, input.studentFeeDueId]
      );

      return {
        transactionId: txnRes.rows[0].id,
        transactionReference: txRef,
        receiptNumber: receiptNo,
        amountPaid: paymentAmount,
        remainingOutstanding: newOutstanding,
        status: newStatus,
      };
    });
  }

  async processRefundWithTransaction(
    userId: string,
    input: RefundFeeInput
  ): Promise<any> {
    return await withTransaction(async (tx) => {
      // 1. Fetch target transaction
      const txnRes = await tx.query(
        `SELECT id, student_fee_due_id, amount, status FROM fee_transactions WHERE id = $1 FOR UPDATE`,
        [input.feeTransactionId]
      );

      if (txnRes.rows.length === 0) {
        throw new Error('Transaction record not found');
      }

      const originalTx = txnRes.rows[0];
      if (originalTx.status === 'reversed') {
        throw new Error('Transaction has already been reversed');
      }

      // 2. Fetch associated student fee due
      const dueRes = await tx.query(
        `SELECT id, paid_amount, outstanding_amount, total_amount FROM student_fee_dues WHERE id = $1 FOR UPDATE`,
        [originalTx.student_fee_due_id]
      );
      const due = dueRes.rows[0];

      const refundAmount = Number(originalTx.amount);
      const newPaid = Math.max(0, Number(due.paid_amount) - refundAmount);
      const newOutstanding = Number(due.outstanding_amount) + refundAmount;
      const newStatus = newPaid === 0 ? 'unpaid' : 'partial';

      // 3. Mark original transaction as reversed
      await tx.query(
        `UPDATE fee_transactions SET status = 'reversed' WHERE id = $1`,
        [input.feeTransactionId]
      );

      // 4. Create reversing transaction
      const revRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.query(
        `
        INSERT INTO fee_transactions (
          student_fee_due_id, transaction_reference, amount, payment_mode, status, processed_by, notes
        )
        VALUES ($1, $2, $3, 'reversal', 'reversed', $4, $5)
      `,
        [originalTx.student_fee_due_id, revRef, refundAmount, userId, `Refund: ${input.reason}`]
      );

      // 5. Update ledger balance
      await tx.query(
        `
        UPDATE student_fee_dues 
        SET paid_amount = $1, outstanding_amount = $2, status = $3
        WHERE id = $4
      `,
        [newPaid, newOutstanding, newStatus, originalTx.student_fee_due_id]
      );

      return {
        refundedTransactionId: input.feeTransactionId,
        reversalReference: revRef,
        amountRefunded: refundAmount,
        newOutstandingBalance: newOutstanding,
      };
    });
  }
}

export const feeRepository = new FeeRepository();

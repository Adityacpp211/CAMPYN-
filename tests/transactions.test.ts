import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';

let adminToken: string;

beforeAll(async () => {
  await seedDatabase();
  const adminLogin = await request(app).post('/api/auth/switch-role').send({ role: 'COLLEGE_ADMIN' });
  adminToken = adminLogin.body.data.token;
});

describe('Database Persistence & Atomic Transactions', () => {
  it('atomically settles a fee payment, creates ledger transaction, and generates audit log', async () => {
    // 1. Fetch dues
    const duesRes = await request(app)
      .get('/api/fees/dues')
      .set('Authorization', `Bearer ${adminToken}`);

    const targetDue = duesRes.body.data.find((d: any) => parseFloat(d.outstandingAmount) > 0);
    expect(targetDue).toBeDefined();

    const initialOutstanding = parseFloat(targetDue.outstandingAmount);
    const initialPaid = parseFloat(targetDue.paidAmount);
    const paymentAmount = 500.00;

    // 2. Collect fee
    const collectRes = await request(app)
      .post('/api/fees/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        feeDueId: targetDue.id,
        amount: paymentAmount,
        paymentMode: 'online',
      });

    expect(collectRes.status).toBe(200);
    expect(collectRes.body.success).toBe(true);
    expect(collectRes.body.data.transaction).toBeDefined();
    expect(collectRes.body.data.transaction.receipt_number).toBeDefined();

    // 3. Verify updated dues in DB
    const refreshedDues = await request(app)
      .get('/api/fees/dues')
      .set('Authorization', `Bearer ${adminToken}`);
    const updated = refreshedDues.body.data.find((d: any) => d.id === targetDue.id);

    expect(parseFloat(updated.outstandingAmount)).toBe(initialOutstanding - paymentAmount);
    expect(parseFloat(updated.paidAmount)).toBe(initialPaid + paymentAmount);

    // 4. Verify audit log entry was written
    const auditRes = await request(app)
      .get('/api/audit?action=PAYMENT')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.body.data.length).toBeGreaterThan(0);
    const latestAudit = auditRes.body.data[0];
    expect(latestAudit.action).toBe('PAYMENT');
    expect(latestAudit.entityId).toBe(targetDue.id);
  });

  it('rejects attendance update if mandatory justification is missing', async () => {
    const sessionsRes = await request(app)
      .get('/api/attendance/sessions')
      .set('Authorization', `Bearer ${adminToken}`);
    const sessionId = sessionsRes.body.data[0].id;

    const recordsRes = await request(app)
      .get(`/api/attendance/records?sessionId=${sessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const recordId = recordsRes.body.data[0].id;

    const failRes = await request(app)
      .put(`/api/attendance/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'absent' }); // Missing reason

    expect(failRes.status).toBe(400);
    expect(failRes.body.success).toBe(false);
  });

  it('updates attendance status with justification and creates audit record', async () => {
    const sessionsRes = await request(app)
      .get('/api/attendance/sessions')
      .set('Authorization', `Bearer ${adminToken}`);
    const sessionId = sessionsRes.body.data[0].id;

    const recordsRes = await request(app)
      .get(`/api/attendance/records?sessionId=${sessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const record = recordsRes.body.data[0];

    const newStatus = record.status === 'present' ? 'late' : 'present';

    const updateRes = await request(app)
      .put(`/api/attendance/records/${record.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: newStatus,
        reason: 'Authorized campus arrival delay with transit security pass',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    // Verify change
    const checkRes = await request(app)
      .get(`/api/attendance/records?sessionId=${sessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const updatedRecord = checkRes.body.data.find((r: any) => r.id === record.id);
    expect(updatedRecord.status).toBe(newStatus);
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';

let adminToken: string;
let studentToken: string;
let facultyToken: string;

beforeAll(async () => {
  await seedDatabase();

  const adminLogin = await request(app).post('/api/auth/switch-role').send({ role: 'COLLEGE_ADMIN' });
  adminToken = adminLogin.body.data.token;

  const studentLogin = await request(app).post('/api/auth/switch-role').send({ role: 'STUDENT' });
  studentToken = studentLogin.body.data.token;

  const facultyLogin = await request(app).post('/api/auth/switch-role').send({ role: 'FACULTY' });
  facultyToken = facultyLogin.body.data.token;
});

describe('Role-Based Access Control (RBAC) Enforcement', () => {
  it('allows COLLEGE_ADMIN to access governance approvals', async () => {
    const res = await request(app)
      .get('/api/approvals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('strictly forbids STUDENT from accessing governance approvals (403)', async () => {
    const res = await request(app)
      .get('/api/approvals')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.requiredPermission).toBe('approvals.manage');
  });

  it('strictly forbids STUDENT from collecting fees (403)', async () => {
    const res = await request(app)
      .post('/api/fees/collect')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ feeDueId: 'any', amount: 100 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows FACULTY to view attendance sessions but forbids refunding fees', async () => {
    const attRes = await request(app)
      .get('/api/attendance/sessions')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(attRes.status).toBe(200);

    const refundRes = await request(app)
      .post('/api/fees/transactions/some-id/refund')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ reason: 'Dispute' });
    expect(refundRes.status).toBe(403);
  });
});

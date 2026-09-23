import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';

let studentToken: string;

beforeAll(async () => {
  await seedDatabase();

  // Login as student 1 (Maya Chen - CSE-24-001)
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'm.chen@campus.edu',
      password: 'Password@123',
    });
  studentToken = loginRes.body.data.token;
});

describe('Security & Student Privacy (IDOR Protection)', () => {
  it('allows a student to access their own student profile', async () => {
    const res = await request(app)
      .get('/api/v1/students/profile')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roll_number).toBe('CSE-24-001');
  });

  it('allows a student to access their own record by roll number', async () => {
    const res = await request(app)
      .get('/api/v1/students/CSE-24-001')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rollNumber).toBe('CSE-24-001');
  });

  it('blocks a student from accessing another student record (IDOR / BOLA)', async () => {
    // Student 1 attempts to access Student 2's record
    const res = await request(app)
      .get('/api/v1/students/CSE-24-002')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('STUDENT_PRIVACY_VIOLATION');
  });

  it('blocks a student from accessing administrative audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('blocks a student from resolving institutional approval requests', async () => {
    const res = await request(app)
      .get('/api/v1/approvals')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';

beforeAll(async () => {
  await seedDatabase();
});

describe('Authentication & Session Subsystem', () => {
  it('should authenticate a valid user and return a JWT access token and profile', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.vance@campus.edu',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('COLLEGE_ADMIN');
    expect(res.body.data.user.permissions).toContain('students.read');
    expect(res.body.data.user.permissions).toContain('fees.collect');
  });

  it('should reject login attempts with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.vance@campus.edu',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject unauthenticated requests to protected endpoints', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return current user profile when given a valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.vance@campus.edu',
        password: 'Password@123',
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('admin.vance@campus.edu');
    expect(meRes.body.data.user.role).toBe('COLLEGE_ADMIN');
  });

  it('should switch role and issue legitimate JWT for role testing', async () => {
    const switchRes = await request(app)
      .post('/api/auth/switch-role')
      .send({ role: 'STUDENT' });

    expect(switchRes.status).toBe(200);
    expect(switchRes.body.data.user.role).toBe('STUDENT');
    expect(switchRes.body.data.token).toBeDefined();
  });
});

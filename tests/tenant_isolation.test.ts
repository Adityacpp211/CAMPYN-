import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';

let facultyToken: string;

beforeAll(async () => {
  await seedDatabase();

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 's.jenkins@campus.edu',
      password: 'Password@123',
    });
  facultyToken = loginRes.body.data.token;
});

describe('Multi-Tenant Isolation & Boundary Enforcement', () => {
  it('strictly blocks attempts to tamper with institution_id via headers', async () => {
    const maliciousTenantId = 'e0000000-0000-0000-0000-000000000001';

    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${facultyToken}`)
      .set('X-Institution-Id', maliciousTenantId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TENANT_ISOLATION_VIOLATION');
  });

  it('strictly blocks cross-tenant tampering in request body payload', async () => {
    const maliciousTenantId = 'e0000000-0000-0000-0000-000000000001';

    const res = await request(app)
      .post('/api/v1/attendance/corrections')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        recordId: '11111111-1111-1111-1111-111111111111',
        newStatus: 'present',
        reason: 'Authorized modification',
        institutionId: maliciousTenantId,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TENANT_ISOLATION_VIOLATION');
  });

  it('rejects unauthenticated requests to tenant-isolated endpoints', async () => {
    const res = await request(app).get('/api/v1/students');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

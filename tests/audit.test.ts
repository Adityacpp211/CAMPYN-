import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';
import { dbClient } from '../server/db/index';

let adminToken: string;

beforeAll(async () => {
  await seedDatabase();
  const adminLogin = await request(app).post('/api/auth/switch-role').send({ role: 'COLLEGE_ADMIN' });
  adminToken = adminLogin.body.data.token;
});

describe('Cryptographic Auditability & Tamper Detection', () => {
  it('records tamper-evident audit logs with SHA-256 hash chains', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const first = res.body.data[0];
    expect(first.hash).toBeDefined();
    expect(first.hash.length).toBe(64); // SHA-256 hex string
  });

  it('validates the cryptographic integrity of the ledger when untampered', async () => {
    const res = await request(app)
      .get('/api/audit/verify')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.totalRecords).toBeGreaterThan(0);
  });

  it('detects unauthorized tampering or modification in the audit ledger', async () => {
    // 1. Fetch an existing audit log
    const auditRes = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);
    const record = auditRes.body.data[0];

    // 2. Maliciously modify the database record's reason directly
    await dbClient.query(`
      UPDATE audit_logs
      SET reason = 'Tampered reason that was modified by an unauthorized database admin'
      WHERE id = $1
    `, [record.id]);

    // 3. Verify integrity: the hash chain verification MUST detect the discrepancy
    const verifyRes = await request(app)
      .get('/api/audit/verify')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.isValid).toBe(false);
    expect(verifyRes.body.data.tamperedRecordId).toBe(record.id);
  });
});

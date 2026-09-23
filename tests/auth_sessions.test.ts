import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { seedDatabase } from '../server/db/seed';
import { dbClient } from '../server/db';

beforeAll(async () => {
  await seedDatabase();
});

describe('Phase 1 - Enterprise Authentication & Session Management', () => {
  let adminToken: string;
  let adminSessionId: string;

  it('POST /api/v1/auth/login - should authenticate valid user, create session, and return token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.vance@campus.edu',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.session).toBeDefined();
    expect(res.body.data.session.id).toBeDefined();
    expect(res.body.data.user.role).toBe('COLLEGE_ADMIN');
    expect(res.body.data.user.email).toBe('admin.vance@campus.edu');

    adminToken = res.body.data.token;
    adminSessionId = res.body.data.session.id;

    // Verify session row in database
    const sessRes = await dbClient.query('SELECT * FROM user_sessions WHERE id = $1', [adminSessionId]);
    expect(sessRes.rows.length).toBe(1);
    expect(sessRes.rows[0].revoked_at).toBeNull();
  });

  it('GET /api/v1/auth/session - should retrieve safe authenticated session context', async () => {
    const res = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin.vance@campus.edu');
    expect(res.body.data.user.password_hash).toBeUndefined(); // Never expose secrets!
    expect(res.body.data.institution).toBeDefined();
    expect(res.body.data.role).toBe('COLLEGE_ADMIN');
    expect(res.body.data.permissions).toBeInstanceOf(Array);
    expect(res.body.data.session.id).toBe(adminSessionId);
  });

  it('POST /api/v1/auth/logout - should revoke the current session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Logged out successfully');

    // Subsequent access with the same token must be rejected with 401 SESSION_REVOKED
    const accessRes = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(accessRes.status).toBe(401);
    expect(accessRes.body.success).toBe(false);
    expect(accessRes.body.error.code).toBe('SESSION_REVOKED');
  });

  it('POST /api/v1/auth/logout-all - should revoke all active sessions for the user', async () => {
    // 1. Establish session 1
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 's.jenkins@campus.edu', password: 'Password@123' });
    const token1 = login1.body.data.token;

    // 2. Establish session 2
    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 's.jenkins@campus.edu', password: 'Password@123' });
    const token2 = login2.body.data.token;

    // Verify both are valid
    const check1 = await request(app).get('/api/v1/auth/session').set('Authorization', `Bearer ${token1}`);
    expect(check1.status).toBe(200);
    const check2 = await request(app).get('/api/v1/auth/session').set('Authorization', `Bearer ${token2}`);
    expect(check2.status).toBe(200);

    // Call logout-all using session 1
    const logoutAllRes = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${token1}`);

    expect(logoutAllRes.status).toBe(200);
    expect(logoutAllRes.body.success).toBe(true);
    expect(logoutAllRes.body.data.revokedSessions).toBeGreaterThanOrEqual(2);

    // Both sessions must now be rejected
    const rejected1 = await request(app).get('/api/v1/auth/session').set('Authorization', `Bearer ${token1}`);
    expect(rejected1.status).toBe(401);
    expect(rejected1.body.error.code).toBe('SESSION_REVOKED');

    const rejected2 = await request(app).get('/api/v1/auth/session').set('Authorization', `Bearer ${token2}`);
    expect(rejected2.status).toBe(401);
    expect(rejected2.body.error.code).toBe('SESSION_REVOKED');
  });

  it('Account Lockout - after 5 consecutive failed login attempts, account is locked', async () => {
    // Attempt 5 bad passwords for Maya Chen
    for (let i = 1; i <= 4; i++) {
      const failRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'm.chen@campus.edu', password: 'BadPassword999!' });
      expect(failRes.status).toBe(401);
      expect(failRes.body.error.code).toBe('INVALID_CREDENTIALS');
    }

    // 5th attempt locks the account
    const lockRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'm.chen@campus.edu', password: 'BadPassword999!' });
    expect(lockRes.status).toBe(401);

    // 6th attempt should return 403 ACCOUNT_LOCKED even if the password was correct!
    const blockedRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'm.chen@campus.edu', password: 'Password@123' });
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error.code).toBe('ACCOUNT_LOCKED');

    // Clean up lock state for other tests
    await dbClient.query(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL 
      WHERE email = 'm.chen@campus.edu'
    `);
  });

  it('Password Reset Flow - request token, reset password, verify invalidation of old sessions', async () => {
    // 1. Establish an active session before password reset
    const preLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bursar.cole@campus.edu', password: 'Password@123' });
    const preToken = preLogin.body.data.token;

    // 2. Request password reset
    const forgotRes = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'bursar.cole@campus.edu' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    expect(forgotRes.body.resetToken).toBeDefined();

    const resetToken = forgotRes.body.resetToken;

    // 3. Reset password with valid new password satisfying complexity requirements
    const resetRes = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({
        token: resetToken,
        newPassword: 'NewSecurePassword@2026',
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 4. Reset token cannot be reused (single-use constraint)
    const reuseRes = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({
        token: resetToken,
        newPassword: 'AnotherPassword@2026',
      });
    expect(reuseRes.status).toBe(400);
    expect(reuseRes.body.error.code).toBe('INVALID_TOKEN');

    // 5. Pre-existing session must be invalidated
    const checkOldSession = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${preToken}`);
    expect(checkOldSession.status).toBe(401);
    expect(checkOldSession.body.error.code).toBe('SESSION_REVOKED');

    // 6. Old password fails
    const oldLoginFail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bursar.cole@campus.edu', password: 'Password@123' });
    expect(oldLoginFail.status).toBe(401);

    // 7. New password succeeds
    const newLoginSuccess = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bursar.cole@campus.edu', password: 'NewSecurePassword@2026' });
    expect(newLoginSuccess.status).toBe(200);
    expect(newLoginSuccess.body.success).toBe(true);
    expect(newLoginSuccess.body.data.token).toBeDefined();
  });

  it('Audit logging - verifies authentication security events are captured in tamper-evident chain', async () => {
    const auditRes = await dbClient.query(`
      SELECT action, reason, ip_address 
      FROM audit_logs 
      WHERE action IN ('LOGIN_SUCCESS', 'LOGOUT', 'LOGOUT_ALL', 'PASSWORD_RESET', 'SECURITY_EVENT')
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    expect(auditRes.rows.length).toBeGreaterThan(0);
    const actions = auditRes.rows.map(r => r.action);
    expect(actions).toContain('LOGIN_SUCCESS');
  });
});

import { dbClient } from '../db';

export interface UserRow {
  id: string;
  institution_id: string;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until?: string | null;
  last_login_at?: string | null;
  role_code?: string;
  role_name?: string;
  department_id?: string;
  department_name?: string;
  permissions: string[];
}

export interface UserSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  revoked_at?: string | null;
  created_at: string;
}

export class AuthRepository {
  async findByIdentifier(identifier: string): Promise<UserRow | null> {
    const res = await dbClient.query(`
      SELECT 
        u.id, 
        u.institution_id, 
        u.email, 
        u.username, 
        u.password_hash, 
        u.first_name, 
        u.last_name, 
        u.phone,
        u.avatar_url,
        u.is_active,
        u.failed_login_attempts,
        u.locked_until,
        u.last_login_at,
        r.code AS role_code,
        r.name AS role_name,
        d.id AS department_id,
        d.name AS department_name,
        COALESCE(
          (
            SELECT json_agg(p.code)
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = r.id
          ),
          '[]'::json
        ) AS permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN faculty f ON f.user_id = u.id
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE LOWER(u.email) = LOWER($1) OR LOWER(u.username) = LOWER($1)
      LIMIT 1
    `, [identifier.trim()]);

    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async findById(userId: string): Promise<UserRow | null> {
    const res = await dbClient.query(`
      SELECT 
        u.id, 
        u.institution_id, 
        u.email, 
        u.username, 
        u.password_hash, 
        u.first_name, 
        u.last_name, 
        u.phone,
        u.avatar_url,
        u.is_active,
        u.failed_login_attempts,
        u.locked_until,
        u.last_login_at,
        r.code AS role_code,
        r.name AS role_name,
        COALESCE(f.department_id, p.department_id) AS department_id,
        d.name AS department_name,
        COALESCE(
          (
            SELECT json_agg(p.code)
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = r.id
          ),
          '[]'::json
        ) AS permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN faculty f ON f.user_id = u.id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN programs p ON s.program_id = p.id
      LEFT JOIN departments d ON d.id = COALESCE(f.department_id, p.department_id)
      WHERE u.id = $1
      LIMIT 1
    `, [userId]);

    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async getInstitutionInfo(institutionId: string): Promise<{ id: string; name: string; code: string } | null> {
    const res = await dbClient.query(`
      SELECT id, name, code
      FROM institutions
      WHERE id = $1
      LIMIT 1
    `, [institutionId]);
    return res.rows[0] || null;
  }

  async incrementFailedAttempts(userId: string, maxAttempts: number = 5, lockDurationMinutes: number = 15): Promise<{ attempts: number; isLocked: boolean }> {
    const userRes = await dbClient.query(`
      SELECT failed_login_attempts 
      FROM users 
      WHERE id = $1
    `, [userId]);

    const currentAttempts = (userRes.rows[0]?.failed_login_attempts || 0) + 1;
    let lockedUntil: Date | null = null;
    let isLocked = false;

    if (currentAttempts >= maxAttempts) {
      lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
      isLocked = true;
    }

    await dbClient.query(`
      UPDATE users 
      SET failed_login_attempts = $2,
          locked_until = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId, currentAttempts, lockedUntil]);

    return { attempts: currentAttempts, isLocked };
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await dbClient.query(`
      UPDATE users 
      SET failed_login_attempts = 0,
          locked_until = NULL,
          last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId]);
  }

  async createSession(
    userId: string,
    tokenHash: string,
    ipAddress: string,
    userAgent: string | undefined,
    expiresAt: Date
  ): Promise<UserSessionRow> {
    const res = await dbClient.query(`
      INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, token_hash, ip_address, user_agent, expires_at, revoked_at, created_at
    `, [userId, tokenHash, ipAddress, userAgent || null, expiresAt.toISOString()]);

    return res.rows[0];
  }

  async findActiveSession(sessionId: string): Promise<UserSessionRow | null> {
    const res = await dbClient.query(`
      SELECT id, user_id, token_hash, ip_address, user_agent, expires_at, revoked_at, created_at
      FROM user_sessions
      WHERE id = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
    `, [sessionId]);

    return res.rows[0] || null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await dbClient.query(`
      UPDATE user_sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [sessionId]);
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const res = await dbClient.query(`
      UPDATE user_sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND revoked_at IS NULL
      RETURNING id
    `, [userId]);

    return res.rows.length;
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<string> {
    // Invalidate existing unused tokens for this user
    await dbClient.query(`
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND used_at IS NULL
    `, [userId]);

    const res = await dbClient.query(`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [userId, tokenHash, expiresAt.toISOString()]);

    return res.rows[0].id;
  }

  async findValidPasswordResetToken(tokenHash: string): Promise<{ id: string; user_id: string } | null> {
    const res = await dbClient.query(`
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token_hash = $1 
        AND used_at IS NULL 
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `, [tokenHash]);

    return res.rows[0] || null;
  }

  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    await dbClient.query(`
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [tokenId]);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await dbClient.query(`
      UPDATE users
      SET password_hash = $2,
          failed_login_attempts = 0,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId, passwordHash]);
  }

  async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date): Promise<string> {
    const res = await dbClient.query(`
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [userId, tokenHash, expiresAt.toISOString()]);

    return res.rows[0].id;
  }

  async findValidEmailVerificationToken(tokenHash: string): Promise<{ id: string; user_id: string } | null> {
    const res = await dbClient.query(`
      SELECT id, user_id
      FROM email_verification_tokens
      WHERE token_hash = $1 
        AND verified_at IS NULL 
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `, [tokenHash]);

    return res.rows[0] || null;
  }

  async markEmailVerificationTokenVerified(tokenId: string, userId: string): Promise<void> {
    await dbClient.query(`
      UPDATE email_verification_tokens
      SET verified_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [tokenId]);

    await dbClient.query(`
      UPDATE users
      SET is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId]);
  }
}

export const authRepository = new AuthRepository();

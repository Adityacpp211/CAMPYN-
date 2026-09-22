import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbClient } from '../db';
import { config } from '../config';
import { authenticateToken } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required' },
    });
    return;
  }

  const userRes = await dbClient.query(`
    SELECT 
      u.id, u.email, u.username, u.password_hash, u.first_name, u.last_name, u.is_active,
      r.code as role_code,
      COALESCE(
        (
          SELECT json_agg(p.code)
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = r.id
        ),
        '[]'::json
      ) as permissions
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email = $1 OR u.username = $1
  `, [email]);

  if (userRes.rows.length === 0) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    return;
  }

  const user = userRes.rows[0];

  if (!user.is_active) {
    res.status(401).json({
      success: false,
      error: { code: 'USER_DEACTIVATED', message: 'This account has been deactivated' },
    });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role_code },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  // Record user session
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await dbClient.query(`
    INSERT INTO user_sessions (user_id, token_hash, ip_address, expires_at)
    VALUES ($1, $2, $3, $4)
  `, [user.id, token.substring(0, 32), req.ip || '127.0.0.1', expiresAt]);

  await createAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    role: user.role_code,
    action: 'LOGIN',
    entity: 'user_sessions',
    entityId: user.id,
    reason: 'Authenticated via email and password',
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_code,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      },
    },
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

// POST /api/auth/switch-role (Development / Demo role switcher to authenticate as designated role user)
authRouter.post('/switch-role', async (req: Request, res: Response): Promise<void> => {
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ success: false, error: { message: 'Role is required' } });
    return;
  }

  const userRes = await dbClient.query(`
    SELECT 
      u.id, u.email, u.username, u.first_name, u.last_name,
      r.code as role_code,
      COALESCE(
        (
          SELECT json_agg(p.code)
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = r.id
        ),
        '[]'::json
      ) as permissions
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.code = $1
    LIMIT 1
  `, [role]);

  if (userRes.rows.length === 0) {
    res.status(404).json({ success: false, error: { message: `No user found with role ${role}` } });
    return;
  }

  const user = userRes.rows[0];
  const token = jwt.sign(
    { userId: user.id, role: user.role_code },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_code,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      },
    },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await dbClient.query('DELETE FROM user_sessions WHERE user_id = $1', [req.user.id]);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

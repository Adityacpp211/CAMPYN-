import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { dbClient } from '../db';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  departmentId?: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or malformed',
      },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };

    // Fetch user details, role and permissions from DB
    const userRes = await dbClient.query(`
      SELECT 
        u.id, u.email, u.username, u.first_name, u.last_name, u.is_active,
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
      WHERE u.id = $1
    `, [payload.userId]);

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_DEACTIVATED',
          message: 'Account is inactive or does not exist',
        },
      });
      return;
    }

    const row = userRes.rows[0];
    req.user = {
      id: row.id,
      email: row.email,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role_code || 'STUDENT',
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token has expired or is invalid',
      },
    });
  }
}

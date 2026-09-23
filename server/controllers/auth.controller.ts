import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import {
  loginSchema,
  passwordResetSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  switchRoleSchema,
} from '../validators/auth.validator';
import { dbClient } from '../db';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(
        validated,
        req.ip || '127.0.0.1',
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(
        req.user?.sessionId,
        req.user?.id,
        req.ip || '127.0.0.1'
      );

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const revokedCount = await authService.logoutAll(
        req.user.id,
        req.ip || '127.0.0.1'
      );

      res.status(200).json({
        success: true,
        message: 'All active sessions have been revoked',
        data: { revokedSessions: revokedCount },
      });
    } catch (err) {
      next(err);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const sessionData = await authService.getSession(
        req.user.id,
        req.user.sessionId
      );

      res.status(200).json({
        success: true,
        data: sessionData,
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(
        validated.email,
        req.ip || '127.0.0.1'
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = passwordResetSchema.parse(req.body);
      const result = await authService.resetPassword(
        validated,
        req.ip || '127.0.0.1'
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyEmailSchema.parse(req.body);
      const result = await authService.verifyEmail(
        validated.token,
        req.ip || '127.0.0.1'
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  // Development helper for role testing
  async switchRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = switchRoleSchema.parse(req.body);

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
        res.status(404).json({
          success: false,
          error: { message: `No user found with role ${role}` },
        });
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
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

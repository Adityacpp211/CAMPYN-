import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

import { config } from '../config';

export const authRouter = Router();

// Public Authentication Endpoints
authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
authRouter.post('/password/forgot', (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post('/password/reset', (req, res, next) => authController.resetPassword(req, res, next));
authRouter.post('/verify', (req, res, next) => authController.verifyEmail(req, res, next));

// Authenticated Session Endpoints
authRouter.get('/session', authenticateToken, (req, res, next) => authController.getSession(req, res, next));
authRouter.get('/me', authenticateToken, (req, res, next) => authController.getSession(req, res, next));
authRouter.post('/logout', authenticateToken, (req, res, next) => authController.logout(req, res, next));
authRouter.post('/logout-all', authenticateToken, (req, res, next) => authController.logoutAll(req, res, next));

// Development-only role switch endpoint (forbidden in production)
authRouter.post('/switch-role', (req, res, next) => {
  if (config.isProduction || process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Role switching is permanently disabled in production environments.' },
    });
    return;
  }
  authController.switchRole(req, res, next);
});

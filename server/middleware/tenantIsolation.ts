import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      institutionId?: string;
    }
  }
}

export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required for tenant operations' },
    });
    return;
  }

  // Super Admin can bypass institutional scoping
  if (req.user.role === 'SUPER_ADMIN') {
    req.institutionId = (req.headers['x-institution-id'] as string) || req.user.institutionId;
    return next();
  }

  const userTenantId = req.user.institutionId;
  if (!userTenantId) {
    res.status(403).json({
      success: false,
      error: { code: 'TENANT_UNDEFINED', message: 'User is not bound to a valid institution tenant' },
    });
    return;
  }

  // Check if caller is attempting to target another institution in body or query
  const targetTenantId = req.body?.institutionId || req.query?.institutionId || req.headers['x-institution-id'];
  if (targetTenantId && targetTenantId !== userTenantId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Forbidden: Cross-tenant data access is strictly prohibited',
        userTenant: userTenantId,
        attemptedTenant: targetTenantId,
      },
    });
    return;
  }

  req.institutionId = userTenantId;
  next();
}

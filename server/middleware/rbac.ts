import { Request, Response, NextFunction } from 'express';

export function requirePermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user.permissions && req.user.permissions.includes(permissionCode)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Forbidden: Access requires '${permissionCode}' permission`,
        requiredPermission: permissionCode,
        currentRole: req.user.role,
      },
    });
  };
}

export function requireAnyPermission(permissionCodes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const hasAny = permissionCodes.some((p) => req.user!.permissions && req.user!.permissions.includes(p));
    if (hasAny) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Forbidden: Access requires one of: ${permissionCodes.join(', ')}`,
        requiredPermissions: permissionCodes,
        currentRole: req.user.role,
      },
    });
  };
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Forbidden: Action restricted to roles: ${allowedRoles.join(', ')}`,
        currentRole: req.user.role,
      },
    });
  };
}

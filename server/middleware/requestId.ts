import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'] as string;
  const requestId = incomingId || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

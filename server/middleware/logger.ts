import { Request, Response, NextFunction } from 'express';

export function structuredLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
      requestId: req.id,
      method: req.method,
      route: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id || null,
      institutionId: req.user?.institutionId || req.institutionId || null,
      ip: req.ip || '127.0.0.1',
    };

    // Output structured JSON in production; clean log in dev/test
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[${logEntry.timestamp}] [${logEntry.level}] ${logEntry.method} ${logEntry.route} ${logEntry.status} - ${logEntry.durationMs}ms (req: ${logEntry.requestId})`
      );
    }
  });

  next();
}

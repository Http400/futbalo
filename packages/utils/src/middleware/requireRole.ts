import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@futbalo/types';
import type { AuthLocals } from './auth.js';

export function requireRole(role: string) {
  return function (_req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): void {
    if (res.locals.user?.role === role) {
      next();
      return;
    }

    res.status(403).json({
      message: 'Forbidden',
      code: 'AUTH_003',
      statusCode: 403,
    } satisfies ApiError);
  };
}

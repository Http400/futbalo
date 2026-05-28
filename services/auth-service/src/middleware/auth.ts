import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@futbalo/types';
import { verifyAccess, type JwtAccessPayload } from '../lib/jwt.js';

export interface AuthLocals {
  user: JwtAccessPayload;
}

export function requireAuth(req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      message: 'No token provided',
      code: 'AUTH_001',
      statusCode: 401,
    });
    return;
  }

  try {
    const payload = verifyAccess(token);
    res.locals.user = payload;
    next();
  } catch {
    res.status(401).json({
      message: 'Invalid or expired token',
      code: 'AUTH_002',
      statusCode: 401,
    });
  }
}

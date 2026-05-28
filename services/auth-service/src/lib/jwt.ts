import jwt from 'jsonwebtoken';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: string;
}

export interface JwtRefreshPayload {
  sub: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function signAccess(payload: JwtAccessPayload): string {
  const expiresIn = (process.env['JWT_EXPIRES_IN'] ?? '15m') as jwt.SignOptions['expiresIn'] & string;
  return jwt.sign(payload, requireEnv('JWT_SECRET'), { expiresIn });
}

export function signRefresh(payload: JwtRefreshPayload): string {
  const expiresIn = (process.env['JWT_REFRESH_EXPIRES_IN'] ?? '30d') as jwt.SignOptions['expiresIn'] & string;
  return jwt.sign(payload, requireEnv('JWT_REFRESH_SECRET'), { expiresIn });
}

export function verifyAccess(token: string): JwtAccessPayload {
  return jwt.verify(token, requireEnv('JWT_SECRET')) as JwtAccessPayload;
}

export function verifyRefresh(token: string): JwtRefreshPayload {
  return jwt.verify(token, requireEnv('JWT_REFRESH_SECRET')) as JwtRefreshPayload;
}

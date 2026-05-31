import jwt from 'jsonwebtoken';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function verifyAccess(token: string): JwtAccessPayload {
  return jwt.verify(token, requireEnv('JWT_SECRET')) as JwtAccessPayload;
}

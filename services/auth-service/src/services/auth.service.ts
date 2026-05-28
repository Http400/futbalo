import type { AuthTokens, LoginRequest } from '@futbalo/types';
import { prisma } from '../db.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt.js';

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function buildTokens(user: { id: string; email: string; role: string }): AuthTokens {
  const accessToken = signAccess({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefresh({ sub: user.id });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthTokens> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AuthError('AUTH_003', 'Email already in use', 409);
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: hashedPassword,
    },
  });

  return buildTokens({ id: user.id, email: user.email, role: user.role });
}

export async function login(input: LoginRequest): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const passwordMatch = user ? await comparePassword(input.password, user.password) : false;

  // Constant-time check — don't short-circuit on missing user
  if (!user || !passwordMatch) {
    throw new AuthError('AUTH_004', 'Invalid credentials', 401);
  }

  return buildTokens({ id: user.id, email: user.email, role: user.role });
}

export async function refresh(refreshToken: string): Promise<Pick<AuthTokens, 'accessToken'>> {
  let payload: { sub: string };
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw new AuthError('AUTH_005', 'Invalid or expired refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AuthError('AUTH_005', 'Invalid or expired refresh token', 401);
  }

  const accessToken = signAccess({ sub: user.id, email: user.email, role: user.role });
  return { accessToken };
}

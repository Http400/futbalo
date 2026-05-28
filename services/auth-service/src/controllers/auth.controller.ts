import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { ApiResponse, ApiError, AuthTokens } from '@futbalo/types';
import * as authService from '../services/auth.service.js';
import { AuthError } from '../services/auth.service.js';

const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

function handleAuthError(err: unknown, res: Parameters<RequestHandler>[1]): void {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
    } satisfies ApiError);
    return;
  }
  res.status(500).json({
    message: 'Internal server error',
    code: 'AUTH_000',
    statusCode: 500,
  } satisfies ApiError);
}

export const register: RequestHandler = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      message: result.error.issues[0]?.message ?? 'Validation error',
      code: 'VAL_001',
      statusCode: 400,
    } satisfies ApiError);
    return;
  }

  try {
    const tokens = await authService.register(result.data);
    res.status(201).json({ data: tokens, message: 'Registration successful' } satisfies ApiResponse<AuthTokens>);
  } catch (err) {
    handleAuthError(err, res);
  }
};

export const login: RequestHandler = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      message: result.error.issues[0]?.message ?? 'Validation error',
      code: 'VAL_001',
      statusCode: 400,
    } satisfies ApiError);
    return;
  }

  try {
    const tokens = await authService.login(result.data);
    res.json({ data: tokens, message: 'Login successful' } satisfies ApiResponse<AuthTokens>);
  } catch (err) {
    handleAuthError(err, res);
  }
};

export const refresh: RequestHandler = async (req, res) => {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      message: result.error.issues[0]?.message ?? 'Validation error',
      code: 'VAL_001',
      statusCode: 400,
    } satisfies ApiError);
    return;
  }

  try {
    const tokens = await authService.refresh(result.data.refreshToken);
    res.json({ data: tokens } satisfies ApiResponse<Pick<AuthTokens, 'accessToken'>>);
  } catch (err) {
    handleAuthError(err, res);
  }
};

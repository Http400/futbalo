import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../lib/password.js', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock('../lib/jwt.js', () => ({
  signAccess: vi.fn(),
  signRefresh: vi.fn(),
  verifyRefresh: vi.fn(),
}));

import { AuthError, register, login, refresh } from './auth.service.js';
import { prisma } from '../db.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt.js';

const mockUser = vi.mocked(prisma.user);
const mockHashPassword = vi.mocked(hashPassword);
const mockComparePassword = vi.mocked(comparePassword);
const mockSignAccess = vi.mocked(signAccess);
const mockSignRefresh = vi.mocked(signRefresh);
const mockVerifyRefresh = vi.mocked(verifyRefresh);

const fakeUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'user',
  password: 'hashed-password',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSignAccess.mockReturnValue('access-token');
  mockSignRefresh.mockReturnValue('refresh-token');
});

describe('register', () => {
  it('creates a user and returns tokens on success', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockHashPassword.mockResolvedValue('hashed-password');
    mockUser.create.mockResolvedValue(fakeUser);

    const result = await register({ email: 'user@example.com', name: 'Test User', password: 'password123' });

    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'user@example.com', password: 'hashed-password' }),
      }),
    );
  });

  it('throws AUTH_003 (409) when email is already in use', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser);

    await expect(register({ email: 'user@example.com', name: 'Test User', password: 'password123' })).rejects.toMatchObject({
      code: 'AUTH_003',
      statusCode: 409,
    });

    expect(mockUser.create).not.toHaveBeenCalled();
  });
});

describe('login', () => {
  it('returns tokens on valid credentials', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser);
    mockComparePassword.mockResolvedValue(true);

    const result = await login({ email: 'user@example.com', password: 'password123' });

    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('throws AUTH_004 (401) when password does not match', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser);
    mockComparePassword.mockResolvedValue(false);

    await expect(login({ email: 'user@example.com', password: 'wrong-password' })).rejects.toMatchObject({
      code: 'AUTH_004',
      statusCode: 401,
    });
  });

  it('throws AUTH_004 (401) when user does not exist', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockComparePassword.mockResolvedValue(false);

    await expect(login({ email: 'ghost@example.com', password: 'any' })).rejects.toMatchObject({
      code: 'AUTH_004',
      statusCode: 401,
    });
  });

  it('throws AuthError instances (not plain Error)', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockComparePassword.mockResolvedValue(false);

    await expect(login({ email: 'x@example.com', password: 'any' })).rejects.toBeInstanceOf(AuthError);
  });
});

describe('refresh', () => {
  it('returns a new access token on a valid refresh token', async () => {
    mockVerifyRefresh.mockReturnValue({ sub: 'user-1' });
    mockUser.findUnique.mockResolvedValue(fakeUser);

    const result = await refresh('valid-refresh-token');

    expect(result).toEqual({ accessToken: 'access-token' });
    expect(mockSignAccess).toHaveBeenCalledWith(
      expect.objectContaining({ sub: fakeUser.id, email: fakeUser.email }),
    );
  });

  it('throws AUTH_005 (401) when the refresh token is invalid JWT', async () => {
    mockVerifyRefresh.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(refresh('bad-token')).rejects.toMatchObject({
      code: 'AUTH_005',
      statusCode: 401,
    });
  });

  it('throws AUTH_005 (401) when the user in the token no longer exists', async () => {
    mockVerifyRefresh.mockReturnValue({ sub: 'deleted-user' });
    mockUser.findUnique.mockResolvedValue(null);

    await expect(refresh('token-for-deleted-user')).rejects.toMatchObject({
      code: 'AUTH_005',
      statusCode: 401,
    });
  });
});

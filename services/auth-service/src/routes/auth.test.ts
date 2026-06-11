import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

vi.mock('../services/auth.service.js', () => {
  class AuthError extends Error {
    public code: string;
    public statusCode: number;
    constructor(code: string, message: string, statusCode = 400) {
      super(message);
      this.name = 'AuthError';
      this.code = code;
      this.statusCode = statusCode;
    }
  }
  return {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    AuthError,
  };
});

import * as authService from '../services/auth.service.js';

const mockRegister = vi.mocked(authService.register);
const mockLogin = vi.mocked(authService.login);
const mockRefresh = vi.mocked(authService.refresh);
 
const { AuthError } = authService as any;

const fakeTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'auth-service' });
  });
});

describe('POST /register', () => {
  it('returns 201 with tokens on success', async () => {
    mockRegister.mockResolvedValue(fakeTokens);

    const res = await request(app)
      .post('/register')
      .send({ email: 'user@example.com', name: 'Test User', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(fakeTokens);
    expect(res.body.message).toBe('Registration successful');
  });

  it('returns 400 VAL_001 when name is missing', async () => {
    const res = await request(app)
      .post('/register')
      .send({ email: 'user@example.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VAL_001');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('returns 400 VAL_001 when password is too short', async () => {
    const res = await request(app)
      .post('/register')
      .send({ email: 'user@example.com', name: 'Test User', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VAL_001');
  });

  it('returns 400 VAL_001 when email is invalid', async () => {
    const res = await request(app)
      .post('/register')
      .send({ email: 'not-an-email', name: 'Test User', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VAL_001');
  });

  it('returns 409 AUTH_003 when email is already in use', async () => {
    mockRegister.mockRejectedValue(new AuthError('AUTH_003', 'Email already in use', 409));

    const res = await request(app)
      .post('/register')
      .send({ email: 'taken@example.com', name: 'Test User', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('AUTH_003');
  });
});

describe('POST /login', () => {
  it('returns 200 with tokens on success', async () => {
    mockLogin.mockResolvedValue(fakeTokens);

    const res = await request(app)
      .post('/login')
      .send({ email: 'user@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(fakeTokens);
    expect(res.body.message).toBe('Login successful');
  });

  it('returns 400 VAL_001 when email is missing', async () => {
    const res = await request(app).post('/login').send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VAL_001');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('returns 401 AUTH_004 on invalid credentials', async () => {
    mockLogin.mockRejectedValue(new AuthError('AUTH_004', 'Invalid credentials', 401));

    const res = await request(app)
      .post('/login')
      .send({ email: 'user@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_004');
  });
});

describe('POST /refresh', () => {
  it('returns 200 with new access token on success', async () => {
    mockRefresh.mockResolvedValue({ accessToken: 'new-access-token' });

    const res = await request(app).post('/refresh').send({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ accessToken: 'new-access-token' });
  });

  it('returns 400 VAL_001 when refreshToken is missing', async () => {
    const res = await request(app).post('/refresh').send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VAL_001');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('returns 401 AUTH_005 on an invalid or expired refresh token', async () => {
    mockRefresh.mockRejectedValue(new AuthError('AUTH_005', 'Invalid or expired refresh token', 401));

    const res = await request(app).post('/refresh').send({ refreshToken: 'expired-token' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_005');
  });
});

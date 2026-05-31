import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, type AuthLocals } from './auth.js';

vi.mock('../jwt.js', () => ({
  verifyAccess: vi.fn(),
}));

import { verifyAccess } from '../jwt.js';
const mockVerifyAccess = vi.mocked(verifyAccess);

function makeReq(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

function makeRes() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const locals = {} as AuthLocals;
  return {
    res: { status, json, locals } as unknown as Response<unknown, AuthLocals>,
    status,
    json,
    locals,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireAuth middleware', () => {
  it('responds 401 AUTH_001 when Authorization header is absent', () => {
    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_001' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 AUTH_001 when Authorization header is not a Bearer token', () => {
    const req = makeReq('Basic dXNlcjpwYXNz');
    const { res, status, json } = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_001' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 AUTH_002 when the Bearer token is invalid', () => {
    mockVerifyAccess.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = makeReq('Bearer invalid-token');
    const { res, status, json } = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_002' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets res.locals.user on a valid token', () => {
    const payload = { sub: 'user-1', email: 'user@example.com', role: 'user', name: 'Test User' };
    mockVerifyAccess.mockReturnValue(payload);

    const req = makeReq('Bearer valid-token');
    const { res, locals, status } = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(locals.user).toEqual(payload);
    expect(status).not.toHaveBeenCalled();
  });
});

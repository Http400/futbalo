import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from './jwt.js';

beforeEach(() => {
  vi.stubEnv('JWT_SECRET', 'test-access-secret');
  vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret');
  vi.stubEnv('JWT_EXPIRES_IN', '15m');
  vi.stubEnv('JWT_REFRESH_EXPIRES_IN', '30d');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('signAccess / verifyAccess', () => {
  it('signs and verifies an access token round-trip', () => {
    const payload = { sub: 'user-1', email: 'user@example.com', role: 'user' };
    const token = signAccess(payload);
    const verified = verifyAccess(token);
    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
  });

  it('throws when verifying a tampered access token', () => {
    expect(() => verifyAccess('invalid.token.payload')).toThrow();
  });

  it('throws when JWT_SECRET env var is missing', () => {
    vi.stubEnv('JWT_SECRET', '');
    expect(() => signAccess({ sub: 'u', email: 'a@b.com', role: 'user' })).toThrow(
      'Missing required environment variable: JWT_SECRET',
    );
  });
});

describe('signRefresh / verifyRefresh', () => {
  it('signs and verifies a refresh token round-trip', () => {
    const payload = { sub: 'user-1' };
    const token = signRefresh(payload);
    const verified = verifyRefresh(token);
    expect(verified.sub).toBe(payload.sub);
  });

  it('throws when verifying a tampered refresh token', () => {
    expect(() => verifyRefresh('bad.refresh.token')).toThrow();
  });

  it('throws when JWT_REFRESH_SECRET env var is missing', () => {
    vi.stubEnv('JWT_REFRESH_SECRET', '');
    expect(() => signRefresh({ sub: 'u' })).toThrow(
      'Missing required environment variable: JWT_REFRESH_SECRET',
    );
  });

  it('access token is rejected by verifyRefresh (different secret)', () => {
    const accessToken = signAccess({ sub: 'u', email: 'a@b.com', role: 'user' });
    expect(() => verifyRefresh(accessToken)).toThrow();
  });
});

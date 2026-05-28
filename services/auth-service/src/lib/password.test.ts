import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.js';

describe('hashPassword', () => {
  it('returns a hashed string different from the plain password', async () => {
    const plain = 'my-secure-password';
    const hashed = await hashPassword(plain);
    expect(hashed).not.toBe(plain);
    expect(typeof hashed).toBe('string');
    expect(hashed.length).toBeGreaterThan(0);
  });

  it('produces a different hash each time for the same password (salted)', async () => {
    const plain = 'my-secure-password';
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2);
  });
});

describe('comparePassword', () => {
  it('returns true when password matches the hash', async () => {
    const plain = 'my-secure-password';
    const hashed = await hashPassword(plain);
    expect(await comparePassword(plain, hashed)).toBe(true);
  });

  it('returns false when password does not match the hash', async () => {
    const plain = 'my-secure-password';
    const hashed = await hashPassword(plain);
    expect(await comparePassword('wrong-password', hashed)).toBe(false);
  });
});

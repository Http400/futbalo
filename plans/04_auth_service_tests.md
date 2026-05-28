# Plan: Add Tests to auth-service

## Problem

The `auth-service` has zero tests despite having Vitest + Supertest installed. This plan adds comprehensive tests at two levels:

1. **Unit tests** for pure lib functions (`lib/jwt.ts`, `lib/password.ts`)
2. **Integration tests** via Supertest for HTTP routes, mocking Prisma via `vi.mock()`

No real database is needed — Prisma is mocked with `vi.mock('../db.js')`.

## Test Files to Create

| File | Type | What it covers |
|------|------|----------------|
| `src/lib/jwt.test.ts` | Unit | signAccess, signRefresh, verifyAccess, verifyRefresh — round-trips, invalid tokens, missing env vars |
| `src/lib/password.test.ts` | Unit | hashPassword, comparePassword |
| `src/services/auth.service.test.ts` | Unit | register/login/refresh business logic with mocked Prisma |
| `src/middleware/auth.test.ts` | Unit | requireAuth — missing token, invalid token, valid token → next() |
| `src/routes/auth.test.ts` | Integration | POST /auth/register, /auth/login, /auth/refresh via Supertest with mocked auth.service |

## Approach

- **Prisma**: mocked via `vi.mock('../db.js')` in service tests; the service itself mocked via `vi.mock('../services/auth.service.js')` in route tests
- **JWT env vars**: set via `vi.stubEnv()` in jwt and middleware tests (`JWT_SECRET`, `JWT_REFRESH_SECRET`)
- **Supertest**: import `app` from `../app.js` directly; no server needed
- **Conventions**: `describe` + `it`, no `test()`, match testing/setup standard

## Standards to Inject

- `testing/setup`

## Implementation Checklist

- [x] Inject standards
- [x] `src/lib/jwt.test.ts`
- [x] `src/lib/password.test.ts`
- [x] `src/services/auth.service.test.ts`
- [x] `src/middleware/auth.test.ts`
- [x] `src/routes/auth.test.ts`
- [x] Run tests and verify all pass — **36/36 passed**

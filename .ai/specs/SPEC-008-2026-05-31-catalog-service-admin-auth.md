# SPEC-008 — Catalog Service Admin Route Protection

## Overview

All write operations in `catalog-service` (POST, PUT, PATCH, DELETE) must be restricted to users authenticated with the `ADMIN` role. GET endpoints remain publicly accessible.

Authentication uses JWTs issued by `auth-service`. The token is verified using the shared `JWT_SECRET`. A new shared package `packages/utils` is introduced to hold the JWT verification logic, making it reusable across services without duplication.

**Affected routes (catalog-service):**

| Method | Path | Protected |
|--------|------|-----------|
| GET | /stages | ❌ public |
| GET | /stages/:id | ❌ public |
| POST | /stages | ✅ ADMIN only |
| PUT | /stages/:id | ✅ ADMIN only |
| DELETE | /stages/:id | ✅ ADMIN only |
| GET | /matches | ❌ public |
| GET | /matches/:id | ❌ public |
| POST | /matches | ✅ ADMIN only |
| PATCH | /matches/:id | ✅ ADMIN only |
| DELETE | /matches/:id | ✅ ADMIN only |

---

## Architecture

```
packages/utils/
├── src/
│   ├── jwt.ts             # JWT verify helpers (shared between services)
│   ├── middleware/
│   │   ├── auth.ts        # requireAuth middleware (shared between services)
│   │   └── requireRole.ts # requireRole(role) middleware (shared between services)
│   └── index.ts           # re-exports
├── package.json
└── tsconfig.json

auth-service/src/
└── middleware/
    └── auth.ts            # REMOVED — replaced by import from @futbalo/utils

catalog-service/src/
└── routes/
    ├── stages.ts          # POST/PUT/DELETE wrapped with requireAuth + requireRole('ADMIN')
    └── matches.ts         # POST/PATCH/DELETE wrapped with requireAuth + requireRole('ADMIN')
```

### Request flow for a protected route

```
Client
  │
  ├─ GET /stages           →  stagesController.getStages  (no middleware)
  │
  └─ POST /stages
       ├─ requireAuth      →  reads Authorization header, verifies JWT, sets res.locals.user
       │                      (imported from @futbalo/utils)
       ├─ requireRole('ADMIN')  →  checks res.locals.user.role === 'ADMIN'
       └─ stagesController.createStage
```

### `packages/utils` — JWT module

Exposes only the verification side of JWT (no signing — signing stays in `auth-service`):

```typescript
// packages/utils/src/jwt.ts
export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

export function verifyAccess(token: string): JwtAccessPayload
```

Uses `jsonwebtoken` and reads `JWT_SECRET` from `process.env`.

### `packages/utils` — `requireAuth` middleware

Moved from `auth-service/src/middleware/auth.ts` into `packages/utils/src/middleware/auth.ts`. Both `auth-service` and `catalog-service` import it from `@futbalo/utils`.

- Reads `Authorization: Bearer <token>` header
- Calls `verifyAccess(token)` from `../jwt.js`
- On success: sets `res.locals.user = payload`, calls `next()`
- On missing token: `401` + `{ code: 'AUTH_001' }`
- On invalid/expired token: `401` + `{ code: 'AUTH_002' }`

**Migration in `auth-service`:** `src/middleware/auth.ts` is deleted; all existing imports are updated to `@futbalo/utils`. The existing test file (`auth.test.ts`) moves to `packages/utils` alongside the implementation.

### `requireRole` middleware

Located at `packages/utils/src/middleware/requireRole.ts` (shared between services):

- Reads `res.locals.user.role`
- If role matches → calls `next()`
- If role does not match → `403` + `{ code: 'AUTH_003', message: 'Forbidden' }`

**Must be used after `requireAuth`** (relies on `res.locals.user` being set).

---

## API Contracts

### Protected route error responses

**401 — No or invalid token** (from `requireAuth`):

```json
{
  "message": "No token provided",
  "code": "AUTH_001",
  "statusCode": 401
}
```

```json
{
  "message": "Invalid or expired token",
  "code": "AUTH_002",
  "statusCode": 401
}
```

**403 — Authenticated but wrong role** (from `requireRole`):

```json
{
  "message": "Forbidden",
  "code": "AUTH_003",
  "statusCode": 403
}
```

### Route protection summary

All existing protected routes require:
```
Authorization: Bearer <access_token>
```
Where the token payload contains `"role": "ADMIN"`.

---

## Configuration

### `catalog-service` — new env vars

```dotenv
# JWT — must match the value used by auth-service
JWT_SECRET="your-jwt-secret"
```

Added to:
- `services/catalog-service/.env.example`
- `services/catalog-service/src/index.ts` startup validation (fail fast if missing)

### `docker-compose.yml` — inject `JWT_SECRET` into catalog-service

The `catalog-service` entry in `docker-compose.yml` must expose `JWT_SECRET` so the shared `@futbalo/utils` middleware can verify tokens at runtime:

```yaml
catalog-service:
  environment:
    PORT: 4001
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    JWT_SECRET: ${JWT_SECRET}   # ← added
```

`JWT_SECRET` is already defined in the root `.env` (used by `auth-service`) — no new secret is introduced, the same value is shared.

### `packages/utils` — env var dependency

`packages/utils/src/jwt.ts` reads `JWT_SECRET` from `process.env` at call time (not at import time), consistent with the pattern in `auth-service/src/lib/jwt.ts`.

---

## Changelog

### 2026-05-31
- Updated: `requireAuth` middleware moved to `packages/utils` (shared); `auth-service` migrates to import from `@futbalo/utils`; `requireRole` stays catalog-service-specific.
- Initial specification: catalog-service admin route protection via shared JWT utils package.

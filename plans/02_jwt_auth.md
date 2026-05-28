# JWT Auth — auth-service

## Problem

The auth-service is a bare Express 5 app with only a `/health` endpoint.
All dependencies are already installed (`jsonwebtoken`, `bcryptjs`, `zod`).
The Prisma `User` model and shared `@futbalo/types` (`AuthTokens`, `LoginRequest`, `LoginResponse`) are already in place.

## Design Decisions

- **Stateless JWTs** — no refresh token DB table; two separate secrets (`JWT_SECRET` / `JWT_REFRESH_SECRET`)
- **Access token**: short-lived (from `JWT_EXPIRES_IN`, default `7d` — should be reduced to `15m` in prod)
- **Refresh token**: long-lived (30d), signed with `JWT_REFRESH_SECRET`
- **Layering**: route → service → Prisma (no raw SQL, always through Prisma ORM)
- **Response format**: `ApiResponse<T>` / `ApiError` from `@futbalo/types` (see `.ai/standards/api/response-format.md`)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create user, hash password, return tokens |
| POST | `/auth/login` | Verify credentials, return tokens |
| POST | `/auth/refresh` | Verify refresh JWT, issue new access JWT |

## Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/jwt.ts` | Create | `signAccess`, `signRefresh`, `verifyAccess`, `verifyRefresh` helpers |
| `src/lib/password.ts` | Create | `hashPassword`, `comparePassword` bcrypt wrappers |
| `src/middleware/auth.ts` | Create | `requireAuth` middleware — verifies access JWT, attaches payload to `res.locals.user` |
| `src/services/auth.service.ts` | Create | Business logic: register, login, refresh |
| `src/routes/auth.ts` | Create | Express Router: POST /register, /login, /refresh with Zod validation |
| `src/app.ts` | Modify | Mount auth router at `/auth` |
| `services/auth-service/.env.example` | Modify | Add `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` |

## Implementation Checklist

- [x] Inject standards (api/response-format, global/typescript-conventions, database/prisma-setup)
- [x] Create `src/lib/jwt.ts`
- [x] Create `src/lib/password.ts`
- [x] Create `src/middleware/auth.ts`
- [x] Create `src/services/auth.service.ts`
- [x] Create `src/routes/auth.ts`
- [x] Update `src/app.ts`
- [x] Update `.env.example` files
- [x] Typecheck + build pass

---

# Controller Refactor

## Problem

All validation, error handling, and response shaping logic lives in `src/routes/auth.ts`. Move it to a dedicated controller so the route file only declares paths.

## Plan

- Create `src/controllers/auth.controller.ts`:
  - Zod schemas
  - `handleAuthError` helper
  - `register`, `login`, `refresh` request handlers (typed `RequestHandler`)
- Rewrite `src/routes/auth.ts` to only import and wire handlers

## Implementation Checklist

- [ ] Create `src/controllers/auth.controller.ts`
- [ ] Rewrite `src/routes/auth.ts` (route declarations only)
- [ ] Typecheck passes

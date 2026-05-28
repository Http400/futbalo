# SPEC-001 — JWT Name Claim

## Overview

Add a `name` field to the JWT access token payload in `auth-service`, and surface it as a top-level field in the Redux `auth` slice in `web-app`.

**Scope:** Data/state only — no UI display changes in this spec.

**Affected packages:**
- `services/auth-service` — JWT signing
- `apps/web-app` — Redux auth slice

---

## Architecture

### Data flow

```
DB: User.name
      │
      ▼
auth-service: signAccess({ sub, email, role, name })
      │  (JWT access token, base64-encoded payload)
      ▼
web-app: authApi (RTK Query) — login / register fulfilled
      │
      ▼
authSlice extraReducer: decode JWT payload → store name
      │
      ▼
Redux store: auth.name (string | null)
```

### JWT decoding on the client

The access token payload is base64url-encoded (no signature verification needed client-side for reading claims). A simple helper extracts the payload:

```ts
function decodeJwtPayload<T>(token: string): T {
  return JSON.parse(atob(token.split('.')[1]));
}
```

This is called inside `authSlice` extraReducers when a `login.matchFulfilled` or `register.matchFulfilled` action arrives.

### No changes to `@futbalo/types`

`AuthTokens` stays as `{ accessToken, refreshToken }`. The `name` is read from the token payload directly — no API contract changes.

---

## API Contracts

### `JwtAccessPayload` (auth-service internal)

**Before:**
```ts
export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: string;
}
```

**After:**
```ts
export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}
```

### `buildTokens` helper (auth-service internal)

**Before:** accepts `{ id, email, role }`  
**After:** accepts `{ id, email, role, name }` — sourced from `user.name` in all call sites (`register`, `login`, `refresh`).

### Redux `AuthState` (web-app)

**Before:**
```ts
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
```

**After:**
```ts
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  name: string | null;
}
```

`name` is populated by decoding the access token payload in the `login.matchFulfilled` and `register.matchFulfilled` extra reducers. It is cleared to `null` on `logout`. The `refresh.matchFulfilled` handler also re-decodes the new access token to keep `name` in sync.

---

## Files to Change

| File | Change |
|------|--------|
| `services/auth-service/src/lib/jwt.ts` | Add `name: string` to `JwtAccessPayload` |
| `services/auth-service/src/services/auth.service.ts` | Pass `name: user.name` in `buildTokens` call (all three functions: `register`, `login`, `refresh`) |
| `apps/web-app/src/store/slices/authSlice.ts` | Add `name` to `AuthState`, update `initialState`, add JWT decode helper, update all `matchFulfilled` handlers |

---

## Changelog

### 2026-05-28
- Initial specification

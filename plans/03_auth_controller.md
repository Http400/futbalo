# Auth Controller Refactor

## Problem

All validation, error handling, and response shaping logic lives in `src/routes/auth.ts`.
The route file should only declare paths — business-level request handling belongs in a controller.

## Plan

- Create `src/controllers/auth.controller.ts`:
  - Zod schemas (register, login, refresh)
  - `handleAuthError` helper
  - `register`, `login`, `refresh` as typed `RequestHandler` functions
- Rewrite `src/routes/auth.ts` to only import and wire handlers (3 lines of routing)

## Implementation Checklist

- [x] Create `src/controllers/auth.controller.ts`
- [x] Rewrite `src/routes/auth.ts` (route declarations only)
- [x] Typecheck passes

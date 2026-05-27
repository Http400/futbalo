# Repository Guidelines

This directory hosts the backend services of the Futbalo monorepo. Each subfolder is its own pnpm workspace (`@futbalo/<name>`), Node ESM, TS strict, Express + Prisma + PostgreSQL. Today only `auth-service/` exists; new services follow its shape. See `@AGENTS.md` at the repo root for repo-wide rules.

## Hard rules

- ESM only (`"type": "module"`). Relative imports must use the `.js` extension from `.ts` sources — see `auth-service/src/index.ts:2`.
- Never edit `auth-service/src/generated/**` (Prisma client output). Regenerate with `pnpm --filter @futbalo/auth-service db:generate`.
- Read env with bracket syntax (`process.env['PORT']`) — `noUncheckedIndexedAccess` makes dot-access fail typecheck.
- `DATABASE_URL` is wired through `@services/auth-service/prisma.config.ts`, not `schema.prisma`. Do not move the datasource URL back into the schema (Prisma 7).
- Shared code via the workspace alias: `"@futbalo/types": "workspace:*"`. No relative reach across `../../packages/`.

## Adding a new service

Mirror `@services/auth-service/`:

1. `package.json` named `@futbalo/<name>`, `"private": true`, `"type": "module"`, scripts `dev`/`build`/`start`/`test`/`lint`/`typecheck`/`clean` matching auth-service.
2. Three tsconfigs extending `@tsconfig.base.json`: root, `tsconfig.build.json` (emit), `tsconfig.test.json` (vitest).
3. Express app exported from `src/app.ts` (no `listen`), bootstrap in `src/index.ts`, Prisma client singleton in `src/db.ts` using the `globalThis` cache pattern.
4. If using Prisma: `prisma/schema.prisma` + sibling `prisma.config.ts`; output client to `src/generated/prisma/` and gitignore it.

## Local conventions

- `build` is `prisma generate && tsc --noEmit && tsc -p tsconfig.build.json` — do not drop `prisma generate`.
- Unused Express args prefixed `_req` (see `src/app.ts:9`).
- Type-only imports inline: `import x, { type T } from '...'`.

## Testing this unit

Vitest in Node environment with `globals: true` (see `@services/auth-service/vitest.config.ts`). HTTP tests use `supertest` against the exported `app` (no `app.listen` in tests). Run one file:

`pnpm --filter @futbalo/auth-service exec vitest run path/to/file.test.ts`

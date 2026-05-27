# Repository Guidelines

Futbalo is a pnpm + Turborepo monorepo: React 19 front-ends (Vite), an Express 5 + Prisma 7 + PostgreSQL auth service, and shared `types` / `ui` packages. Node `>=20.16.0`, pnpm `>=10.0.0`, TypeScript 6 strict mode everywhere.

## Hard rules

- Use `pnpm` only — never `npm` or `yarn`. The lockfile is `pnpm-lock.yaml` and `.npmrc` is intentionally committed (see commit `cabc4fd`).
- Workspace deps go through the alias: `"@futbalo/types": "workspace:*"`, not relative paths.
- Do not edit `services/auth-service/src/generated/**` — Prisma client output, regenerate with `pnpm --filter @futbalo/auth-service db:generate`.
- `DATABASE_URL` lives in env, not in `schema.prisma`; Prisma 7 datasource is wired through `services/auth-service/prisma.config.ts`. Touching this has burned many commits — see `git log -- services/auth-service/prisma.config.ts`.

## Project structure

- `apps/web-app` (port 3000) and `apps/admin-app` (port 3001) — React + Vite SPAs.
- `services/auth-service` (port 4000) — Express + Prisma + PostgreSQL.
- `packages/types` — shared TS types; `packages/ui` — shared MUI-based React components with Storybook (port 6006).
- `nginx/`, `docker-compose.yml`, `.env.example` — VPS deploy stack. Deeper deploy notes in `@README.md` and `@deployment-idea.md`.

## Build, test, and development commands

- `pnpm dev` — run all apps/services in parallel via Turbo.
- `pnpm --filter @futbalo/<name> <script>` — target one workspace (e.g. `dev`, `test`, `build`).
- `pnpm build` / `pnpm test` / `pnpm lint` / `pnpm typecheck` — Turbo runs across the graph.
- `pnpm format` — Prettier write; `pnpm format:check` for CI-style verification.
- `pnpm --filter @futbalo/auth-service db:migrate` — Prisma dev migration; see all `db:*` scripts in `@services/auth-service/package.json`.

## Coding style

2-space indent, single quotes, semicolons, trailing commas `es5`, `printWidth: 100` — enforced by `@.prettierrc`. ESLint flat config in `@eslint.config.mjs` applies `react-hooks` rules to `apps/**` and `packages/ui/**`, and Node globals to `services/**`. TS compiler options (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) come from `@tsconfig.base.json` — do not relax per-package.

## Testing

Vitest across the board. Auth service uses `supertest` for HTTP tests. Run a single file with `pnpm --filter <pkg> exec vitest run path/to/file.test.ts`. App/UI tests run under `jsdom`; service tests under Node. No coverage threshold is enforced today.

## Commits & PRs

Conventional Commits with scope, lowercase subject: `feat(auth-service): ...`, `fix(nginx): ...`, `chore(docker): ...`. PRs target `master` on `Http400/futbalo`. No CI workflows exist yet — run `pnpm lint && pnpm typecheck && pnpm test` locally before pushing.

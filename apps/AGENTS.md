# Repository Guidelines

Scope: front-end SPAs only. `web-app` (port 3000) and `admin-app` (port 3001) are sibling Vite + React 19 + TS-strict apps with an identical layout — keep them symmetrical unless a divergence is justified. See `@AGENTS.md` at the repo root for repo-wide rules (pnpm, workspace aliases, commit style).

## Local rules

- Never import across apps. `web-app` and `admin-app` must not reference each other. Cross-app code belongs in `@futbalo/ui` or `@futbalo/types`.
- Pull shared components/types via workspace aliases only: `import { Button } from '@futbalo/ui'`. No relative paths into `packages/` or sibling apps.
- Do not bypass the build typecheck. The `build` script is `tsc --noEmit && vite build` — if `tsc` fails, fix types; never split the script.
- Keep the two apps' `vite.config.ts`, `tsconfig.json`, and `src/test-setup.ts` in sync in shape; only `server.port` legitimately differs today.

## File layout & naming

- Components: `PascalCase.tsx` directly under `src/`, default export, co-located test as `<Name>.test.tsx`. Reference: `@./web-app/src/App.tsx` + `@./web-app/src/App.test.tsx`.
- Entry stays `src/main.tsx`; preserve the `rootEl` null-check + `StrictMode` wrap from `@./web-app/src/main.tsx`.
- Test bootstrap lives at `src/test-setup.ts` and is registered in `vite.config.ts` under `test.setupFiles`. Add globals there, not per-test.

## Adding a new app

Clone the smaller of the two apps wholesale, rename in `package.json` (`@futbalo/<name>`), pick an unused port in `vite.config.ts`, copy the `Dockerfile` and adjust the `--filter` target. Then add the new package to the repo-root `pnpm-workspace.yaml` if not auto-discovered.

## Testing this unit

`pnpm --filter @futbalo/<app> test` runs Vitest once (jsdom, globals on). Single file: `pnpm --filter @futbalo/<app> exec vitest run src/App.test.tsx`. Watch mode: `test:watch`. Use `@testing-library/react` + role-based queries (see `App.test.tsx`); avoid querying by class or test-id.

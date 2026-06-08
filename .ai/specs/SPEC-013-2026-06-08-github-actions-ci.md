# SPEC-013 — GitHub Actions CI Pipeline

## Overview

A GitHub Actions CI workflow that runs on every push and pull request targeting `master`. It enforces code quality and build correctness across all workspaces in the Turborepo monorepo. The pipeline has three jobs:

1. **lint** — runs ESLint across all packages via `pnpm lint`
2. **typecheck** — runs TypeScript type-checking across all packages via `pnpm typecheck`; runs in parallel with `lint`
3. **build** — runs the Turbo build across all packages via `pnpm build`; only executes if both `lint` and `typecheck` pass

No deploy or release steps are included in this pipeline — this is a quality gate only.

## Architecture

```
trigger: push / pull_request → master
         │
         ├──────────────────────────┐
         ▼                          ▼
    ┌─────────┐               ┌───────────┐
    │  lint   │  pnpm lint    │ typecheck │  pnpm typecheck
    └────┬────┘               └─────┬─────┘
         │                          │
         └──────────┬───────────────┘
                    │ needs: lint, typecheck
                    ▼
               ┌─────────┐
               │  build  │  pnpm build (turbo)
               └─────────┘
```

All three jobs share the same setup steps (checkout → Node → pnpm → install).

## Configuration

### Workflow file

**Path**: `.github/workflows/ci.yml`

### Triggers

```yaml
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
```

### Runtime versions

| Tool | Version |
|------|---------|
| Node.js | `20.16.0` (matches `engines` in `package.json`) |
| pnpm | `10.33.3` (matches `packageManager` in `package.json`) |

### Job definitions

#### `lint`

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.16.0'
    - uses: pnpm/action-setup@v4
      with:
        version: '10.33.3'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Lint
      run: pnpm lint
```

#### `typecheck`

```yaml
typecheck:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.16.0'
    - uses: pnpm/action-setup@v4
      with:
        version: '10.33.3'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Type check
      run: pnpm typecheck
```

#### `build`

```yaml
build:
  runs-on: ubuntu-latest
  needs: [lint, typecheck]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.16.0'
    - uses: pnpm/action-setup@v4
      with:
        version: '10.33.3'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Build
      run: pnpm build
```

### Notes

- `--frozen-lockfile` ensures CI always installs exact versions from `pnpm-lock.yaml` and fails fast if the lockfile is out of date.
- Turbo handles task-graph execution within each job — individual workspace scripts are not called directly.
- No secrets or env vars are required for lint or build. If a service needs env vars at build time (e.g. `VITE_API_BASE_URL`), add them to the `build` job's `env:` block.
- Turbo remote caching is not configured in this spec; add it separately if needed.

## Changelog

### 2026-06-08
- Added `typecheck` job (parallel with `lint`); `build` now depends on both
- Initial specification

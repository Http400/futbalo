# SPEC-014: Runtime API Base URL Configuration

## Overview

Both front-ends (`web-app`, `admin-app`) currently resolve the API base URL at **build time** through Vite's `import.meta.env.VITE_API_BASE_URL`. The value is baked into the compiled bundle, which means:

- The same Docker image cannot be reused across environments — a new build is required per API URL.
- `docker-compose.yml` must pass `VITE_API_BASE_URL` as a build `arg`, and the web-app `Dockerfile` declares an `ARG`/`ENV` purely to thread it into the build.

This spec replaces the build-time variable with **runtime configuration**. A small JSON document is served at `GET /config` by the nginx reverse proxy in production (in `nginx/config-location.conf`) and by a Vite dev-server middleware locally. At startup each front-end fetches this document, dispatches it into a Redux `config` slice, and the RTK Query slices read `apiBaseUrl` from that slice **per request** via a custom `dynamicBaseQuery`.

**Outcome:** one immutable image per app, configured per environment by nginx alone. No `VITE_API_BASE_URL` anywhere.

## User Stories

### Story 1 — DevOps deploys one image to multiple environments

**Persona**: Maya — an operator deploying Futbalo to a VPS. She wants to build images in CI once and point them at the right API by editing only nginx config, never rebuilding the front-end.

**Flow**

1. CI builds `web-app` / `admin-app` images with no `VITE_API_BASE_URL` arg.
2. On the VPS, nginx serves `/config` → `{"apiBaseUrl":"https://api.futbalo.eu"}` from `config-location.conf`.
3. Browser loads the SPA; before rendering, it fetches `/config` and learns the API origin.

```
┌──────────────────────────────────────────────┐
│  Browser → GET https://futbalo.eu/config      │
│  ← 200  {"apiBaseUrl":"https://api.futbalo.eu"}│
│                                                │
│  App boots → RTK Query baseUrl = that value    │
└──────────────────────────────────────────────┘
```

**Change vs. current state**: Today Maya (or CI) must set `VITE_API_BASE_URL` before the build, and a wrong/changed URL means a full rebuild. After this change: the build takes no API arg; the URL lives only in `config-location.conf`, editable + reloadable without touching images.

**Behind the scenes**: `main.tsx` fetches `/config` inline → `store.dispatch(setConfig({ apiBaseUrl }))` → renders. `dynamicBaseQuery` reads `apiBaseUrl` from the `config` slice on each request, so no rebuild and no module singleton.

### Story 2 — Developer runs the app locally with no nginx

**Persona**: Dev — a front-end engineer running `pnpm --filter @futbalo/web-app dev`. There is no nginx in the loop, but the app still expects `/config`.

**Flow**

1. Dev starts Vite (web-app on :3000, admin-app on :3001).
2. A Vite dev-server middleware answers `GET /config` with `{"apiBaseUrl":"/api"}`.
3. App boots, RTK Query base URL becomes `/api`; the existing Vite proxy rewrites `/api` → `http://localhost:4000`.

```
┌───────────────────────────────────────────────┐
│  GET /config  → {"apiBaseUrl":"/api"}  (vite)   │
│  GET /api/auth/login → proxied → :4000/auth/... │
└───────────────────────────────────────────────┘
```

**Change vs. current state**: Today dev relies on `apps/web-app/.env` (`VITE_API_BASE_URL=/api`) being read at build/serve time. After this change: the `.env` var is removed; the same `/config` contract works in dev via middleware, so dev and prod share one code path.

**Behind the scenes**: a tiny Vite plugin registered in both `vite.config.ts` files via `configureServer` intercepts `/config` and returns the dev JSON. The existing `/api` proxy in web-app is unchanged.

| Aspect | Before (build-time) | After (runtime) |
|--------|---------------------|-----------------|
| Source of URL | `import.meta.env.VITE_API_BASE_URL` (build-time) | Redux `config` slice, fed by `GET /config` |
| Image per env | One per URL | One, reusable |
| Dev URL source | `.env` file | Vite `/config` middleware |
| Prod URL source | Docker build arg | `nginx/config-location.conf` |
| Change URL | Rebuild image | Edit nginx config + reload |

## Architecture

### config slice (Redux store, per app)

The runtime config lives in the **Redux store**, not a module singleton. Each front-end has `src/store/slices/configSlice.ts`:

```ts
export interface ConfigState {
  apiBaseUrl: string;
}
// initialState: { apiBaseUrl: '' }
// reducers: setConfig(state, action: PayloadAction<ConfigState>) => action.payload
// selector: selectApiBaseUrl(state) => state.config.apiBaseUrl
```

**Failure behavior (fail-fast):** the app cannot function without an API origin, so `main.tsx` does **not** silently fall back. If the `/config` fetch fails (network error, non-200, or malformed/empty `apiBaseUrl`), it throws and the rejection propagates so the failure is visible in the console rather than rendering a half-working app. No retry loop and no in-app error screen in this iteration (kept minimal; can be added later).

### Dynamic baseQuery (web-app)

Because the base URL now lives in store state, the RTK Query slices use a custom `baseQuery` that reads `config.apiBaseUrl` **at request time** (not at `createApi` evaluation time). Shared in `src/store/api/dynamicBaseQuery.ts`:

```ts
export const dynamicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  (args, api, extraOptions) => {
    const baseUrl = (api.getState() as { config: { apiBaseUrl: string } }).config.apiBaseUrl;
    return fetchBaseQuery({ baseUrl })(args, api, extraOptions);
  };
```

`authApi.ts` and `catalogApi.ts` set `baseQuery: dynamicBaseQuery`. The state is read via a minimal inline type to avoid a `RootState` import cycle (`store.ts` already imports the api slices).

### Boot sequence (`main.tsx`)

`main.tsx` is async but the store and `App` are imported **statically** (no dynamic-import workaround — that was only needed when baseUrl was read at `createApi` time):

1. `fetch('/config')` inline, validate `apiBaseUrl` (fail-fast).
2. `store.dispatch(setConfig({ apiBaseUrl }))`.
3. `createRoot(...).render(<Provider store={store}><App/></Provider>)`.

Since `dynamicBaseQuery` reads the URL per request, dispatching `setConfig` before the first request is sufficient — the slices never need the value at module-evaluation time.

### Dev `/config` middleware

A `configureServer(server)` Vite plugin in each `vite.config.ts` handles `GET /config` → `{"apiBaseUrl":"/api"}`. web-app keeps its existing `/api` → `:4000` proxy. admin-app serves `/config` too so its boot path matches web-app.

### admin-app store

admin-app had no Redux store; this spec adds a minimal config-only store (`store.ts`, `hooks.ts`, `slices/configSlice.ts`) plus the `@reduxjs/toolkit` + `react-redux` dependencies. It holds only the `config` slice for now.

### Production serving

No app-side change for prod beyond the bundle: nginx serves `/config` via `nginx/config-location.conf`, which is `include`d inside each `web-app`/`admin-app` `server { ... }` block in `nginx.conf` (the line `include /etc/nginx/config-location.conf;`). The compose nginx service mounts that file (see Implementation Details).

Current `nginx/config-location.conf` contents (already in the repo):

```nginx
location = /config {
    default_type application/json;
    add_header Cache-Control "no-store";
    return 200 '{"apiBaseUrl":"https://api.futbalo.eu"}';
}
```

## API Contracts

### `GET /config`

Served by nginx (prod) and Vite middleware (dev). No auth, no caching.

**Response 200** (`application/json`, `Cache-Control: no-store`):

```json
{ "apiBaseUrl": "https://api.futbalo.eu" }
```

Dev value: `{ "apiBaseUrl": "/api" }`.

## Implementation Details

### Front-end

> **admin-app note:** admin-app had **no** Redux store and **no** API slices. This spec adds a minimal **config-only** store (plus `@reduxjs/toolkit` + `react-redux` deps) so config lives in Redux consistently with web-app. There are still no API slices to update there.

| File | Change |
|------|--------|
| `apps/{web,admin}-app/src/store/slices/configSlice.ts` | **New.** `ConfigState`, `setConfig`, `selectApiBaseUrl`. |
| `apps/web-app/src/store/api/dynamicBaseQuery.ts` | **New.** `dynamicBaseQuery` reading `config.apiBaseUrl` from state per request. |
| `apps/web-app/src/store/api/authApi.ts` | Replace `fetchBaseQuery({ baseUrl: getApiBaseUrl() })` with `dynamicBaseQuery`. |
| `apps/web-app/src/store/api/catalogApi.ts` | Replace `fetchBaseQuery({ baseUrl: getApiBaseUrl() })` with `dynamicBaseQuery`. |
| `apps/web-app/src/store/store.ts` | Register `config` reducer. |
| `apps/admin-app/src/store/{store.ts,hooks.ts}` | **New.** Minimal config-only store + typed hooks. |
| `apps/admin-app/package.json` | Add `@reduxjs/toolkit` + `react-redux`. |
| `apps/{web,admin}-app/src/main.tsx` | Async: inline `fetch('/config')` (fail-fast) → `dispatch(setConfig)` → **static** store/`App` import → render with `<Provider>`. |
| `apps/{web,admin}-app/src/config/runtimeConfig.ts` | **Deleted.** Replaced by the config slice + dynamic baseQuery. |
| `apps/{web,admin}-app/vite.config.ts` | `configureServer` plugin serving `GET /config` → `{"apiBaseUrl":"/api"}`. web-app keeps existing `/api` proxy. |
| `apps/web-app/.env` | Removed (only held `VITE_API_BASE_URL`). |

### Docker / compose

| File | Change |
|------|--------|
| `apps/web-app/Dockerfile` | Remove `ARG VITE_API_BASE_URL` and `ENV VITE_API_BASE_URL=$VITE_API_BASE_URL`. |
| `apps/admin-app/Dockerfile` | No build-arg present; nothing to remove. |
| `docker-compose.yml` | Remove `args.VITE_API_BASE_URL` from the `web-app` build. Mount `./nginx/config-location.conf:/etc/nginx/config-location.conf:ro` on the `nginx` service so the `include` resolves. |
| `.env.example` / root `.env` | Remove `VITE_API_BASE_URL` references. |

### Tests

`apps/web-app/src/App.test.tsx` builds its own store via `makeStore()`. With config in Redux:

- `makeStore()` includes the `config` reducer with `preloadedState: { config: { apiBaseUrl: '/api' } }` so `dynamicBaseQuery` resolves during tests.
- `test-setup.ts` returns to just `import '@testing-library/jest-dom';` (no module seed needed).
- admin-app `App.test.tsx` renders `<App/>` directly (no store usage), so only the `setRuntimeConfig` seed is removed from its `test-setup.ts`.

### Relevant standards

- `infra/docker-spa-pattern` — updated via `/sync-standards`: drops `VITE_*` build-arg guidance, documents runtime `/config` resolution.
- `infra/docker-monorepo-build`, `testing/setup`, `global/typescript-conventions` — follow as-is.
- Standards live in `.ai/standards/`; index at `.ai/standards/index.yml`.

## Configuration

- **Removed:** `VITE_API_BASE_URL` (build arg, `.env`, `.env.example`, compose `args`, Dockerfile `ARG`/`ENV`).
- **Added (already present):** `GET /config` served from `nginx/config-location.conf`. Edit `apiBaseUrl` there + reload nginx to repoint an environment.

## Implementation Checklist

- [x] Inject standards (`infra/docker-spa-pattern`, `infra/docker-monorepo-build`, `testing/setup`, `global/typescript-conventions`)
- [x] Create `config` slice in web-app + admin-app
- [x] Create web-app `dynamicBaseQuery` reading `config.apiBaseUrl` per request
- [x] Switch web-app `authApi.ts` + `catalogApi.ts` to `dynamicBaseQuery`; register `config` reducer
- [x] Add minimal config-only store (+ redux deps) to admin-app
- [x] Rewrite both `main.tsx`: inline `/config` fetch → `dispatch(setConfig)` → static store/`App` import → render
- [x] Delete `runtimeConfig.ts` in both apps
- [x] Update web-app `App.test.tsx` (`makeStore` preloads config); clean both `test-setup.ts`
- [x] Add `/config` dev middleware to both `vite.config.ts`
- [x] Remove `VITE_API_BASE_URL` from web-app `Dockerfile`
- [x] Remove `VITE_API_BASE_URL` arg from `docker-compose.yml` web-app build
- [x] Mount `config-location.conf` on nginx service in `docker-compose.yml`
- [x] Remove `VITE_API_BASE_URL` from `apps/web-app/.env` (file deleted), `.env.example`, root `.env`
- [x] `/sync-standards` to update `infra/docker-spa-pattern` + `infra/docker-monorepo-build`
- [x] `pnpm --filter @futbalo/web-app build` + `pnpm --filter @futbalo/admin-app build` pass
- [x] `pnpm test` / `pnpm lint` pass

## Changelog

### 2026-06-12
- Revised design: runtime config now lives in a Redux `config` slice instead of a module singleton. Web-app API slices read `apiBaseUrl` per request via a `dynamicBaseQuery`; `main.tsx` fetches `/config` inline, dispatches `setConfig`, and imports the store statically (dynamic-import workaround removed). admin-app gains a minimal config-only store (+ `@reduxjs/toolkit`/`react-redux`). Deleted `runtimeConfig.ts` from both apps.
- Implemented: runtime `/config` resolution in both apps, Vite dev `/config` middleware, removed `VITE_API_BASE_URL` from Dockerfile/compose/env, mounted `config-location.conf` on nginx, synced `infra/docker-spa-pattern` + `infra/docker-monorepo-build` standards. Build/test/lint green.
- Initial specification.

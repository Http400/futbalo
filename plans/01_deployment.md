# Deployment Plan

## Overview

Containerize the futbalo monorepo (2 React frontends + 1 Node/Express backend) and orchestrate them with Docker Compose behind a single nginx reverse proxy. No SSL for now — that's a follow-up step.

## Architecture

```
                        nginx (port 80)
                            │
        ┌───────────────────┼───────────────────────┐
        │                   │                       │
www.futbalo.eu    admin.futbalo.eu     api.futbalo.eu    pgadmin.futbalo.eu
        │                   │               │                    │
    web-app             admin-app      /auth → auth-service    pgadmin:80
  (static files)      (static files)    (port 4000)
```

## Services to build

| Service | Type | Build output | Docker base image |
|---------|------|-------------|------------------|
| `web-app` | React (Vite) | `apps/web-app/dist/` | alpine (data volume at /apps/web-app) |
| `admin-app` | React (Vite) | `apps/admin-app/dist/` | alpine (data volume at /apps/admin-app) |
| `auth-service` | Node/Express | `services/auth-service/dist/` | node:alpine |
| `postgres` | Database | — | postgres:17-alpine |
| `pgadmin` | DB UI | — | dpage/pgadmin4 |
| `nginx` | Reverse proxy | — | nginx:alpine |

## Files to create

```
apps/
  web-app/
    Dockerfile
  admin-app/
    Dockerfile
services/
  auth-service/
    Dockerfile
nginx/
  nginx.conf
docker-compose.yml
.env.example            (root-level, for docker compose env vars)
```

## Dockerfile strategies

### web-app & admin-app (multi-stage)
1. **Builder stage** — node:alpine, install pnpm, copy monorepo, run `pnpm build --filter=@futbalo/web-app` (or admin-app)
2. **Final stage** — alpine, copy `dist/` to `/apps/web-app` (or `/apps/admin-app`) — this container acts as a data volume; nginx mounts from it

The nginx container uses `volumes_from: [web-app, admin-app]` in docker-compose and sets `root /apps/web-app` in its server block (matching the example).

### auth-service (multi-stage)
1. **Builder stage** — node:alpine, install pnpm, copy monorepo, run `pnpm build --filter=@futbalo/auth-service` (includes `prisma generate` + `tsc`)
2. **Runtime stage** — node:alpine, copy `dist/` + production `node_modules` + prisma client; `CMD ["node", "dist/index.js"]`
   - Migration is handled in docker-compose via `command: sh -c "npx prisma migrate deploy && node dist/index.js"`

## nginx.conf (HTTP only for now)

- `www.futbalo.eu` → serves web-app static files from the web-app container
- `admin.futbalo.eu` → serves admin-app static files from the admin-app container
- `api.futbalo.eu` → location `/auth` proxies to `auth-service:4000`
- `pgadmin.futbalo.eu` → proxies to `pgadmin:80`
- Redirect `http://*.futbalo.eu` → no redirect needed without SSL yet; serve on port 80

## docker-compose.yml services

- **postgres**: image `postgres:17-alpine`, volume for persistence, env vars from `.env`
- **pgadmin**: image `dpage/pgadmin4`, depends on postgres
- **auth-service**: built from `docker/auth-service.Dockerfile`, depends on postgres, env from `.env`
- **web-app**: built from `docker/web-app.Dockerfile`
- **admin-app**: built from `docker/admin-app.Dockerfile`
- **nginx**: image `nginx:alpine`, mounts `nginx/nginx.conf`, depends on all app services, exposes port 80

## Environment variables

The root `.env.example` (and `.env` at deploy time) will cover:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `DATABASE_URL` (for auth-service)
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`

## Implementation todos

1. Create `apps/web-app/Dockerfile` (multi-stage: build → nginx static serve)
2. Create `apps/admin-app/Dockerfile` (multi-stage: build → nginx static serve)
3. Create `services/auth-service/Dockerfile` (multi-stage: build → node runtime + prisma migrate)
4. Create `nginx/nginx.conf` (HTTP-only, 4 server blocks)
5. Create `docker-compose.yml` (6 services: postgres, pgadmin, auth-service, web-app, admin-app, nginx)
6. Create root `.env.example` with all required vars

## Open questions / future steps

- SSL: add Certbot/Let's Encrypt or mount certs, switch nginx to port 443
- CI/CD: build and push Docker images from GitHub Actions
- Secrets management: use Docker secrets or a vault instead of `.env` in production

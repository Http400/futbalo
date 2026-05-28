# Docker SPA Static-File Serving Pattern

Frontend apps (SPAs built with Vite) use a two-stage Docker build: a Node builder stage + a bare `alpine` final stage that exposes the dist as a Docker volume served by nginx.

## Dockerfile Shape

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
# ... (see docker-monorepo-build standard for the full builder stage)

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm exec turbo run build --filter="@futbalo/<app-name>..."

FROM alpine:3.21
COPY --from=builder /app/apps/<app-name>/dist /apps/<app-name>
VOLUME ["/apps/<app-name>"]
```

- Final stage is **`alpine:3.21`** (not Node) — the container's only job is to hold the static files.
- Dist is copied to `/apps/<app-name>` (matching the path nginx expects).
- No `CMD` or `EXPOSE` — the container exits immediately; nginx reads the files via `volumes_from`.

## docker-compose wiring

```yaml
<app-name>:
  build:
    context: .
    dockerfile: apps/<app-name>/Dockerfile
    args:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}

nginx:
  image: nginx:alpine
  volumes_from:
    - web-app
    - admin-app
```

- Build args (`VITE_*`) must match the `ARG` names in the Dockerfile.
- nginx uses `volumes_from` — it mounts the volumes from the SPA containers to serve the files.

## Environment Variable Placement

- Vite build-time variables (`VITE_*`) live in `.env.example` at the repo root — **not** in app-level `.env.production` files.
- At build time the value is baked into the JS bundle via Vite's `import.meta.env`.

## Examples

- `apps/web-app/Dockerfile`
- `apps/admin-app/Dockerfile`

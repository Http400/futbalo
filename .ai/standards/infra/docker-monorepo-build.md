# Docker Monorepo Build Structure

All Dockerfiles build from the **repo root** as the Docker context — never from the individual package directory.

## Builder Stage Pattern

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

# Copy ALL workspace manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web-app/package.json ./apps/web-app/
COPY apps/admin-app/package.json ./apps/admin-app/
COPY services/auth-service/package.json ./services/auth-service/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec turbo run build --filter="@futbalo/<name>..."
```

- **Manifest-first copy**: copy all `package.json` files before source so the `pnpm install` layer is cached unless dependencies change.
- **Always use `--frozen-lockfile`** — never allow pnpm to update the lockfile in CI/Docker.
- **Turbo filter with `...`** — the trailing `...` includes all transitive dependencies of the package.

## Build-Time Variables

Pass build-time env vars via `ARG` → `ENV` before the build step:

```dockerfile
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

- For services needing a DB URL at build time (e.g. Prisma generate), supply a dummy default: `ARG DATABASE_URL=postgresql://build:build@localhost:5432/build`
- All `ARG` values must be listed in `docker-compose.yml` under `build.args` and in `.env.example`.

## Final Stage

Two variants — see `docker-spa-pattern` for SPAs:

```dockerfile
# Services (Node runtime)
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /deploy .
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

## Examples

- `services/auth-service/Dockerfile`
- `apps/web-app/Dockerfile`
- `apps/admin-app/Dockerfile`

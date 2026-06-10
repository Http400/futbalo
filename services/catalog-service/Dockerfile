FROM node:22-alpine AS builder
WORKDIR /app

ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=${DATABASE_URL}

RUN corepack enable

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web-app/package.json ./apps/web-app/
COPY apps/admin-app/package.json ./apps/admin-app/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/catalog-service/package.json ./services/catalog-service/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/

# --ignore-scripts: skip postinstall (prisma generate) here — the schema isn't
# copied yet. The Prisma client is generated during the turbo build step below.
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm exec turbo run build --filter="@futbalo/catalog-service..."

RUN cp -r services/catalog-service/src/generated/. services/catalog-service/dist/generated/

RUN pnpm deploy --filter=@futbalo/catalog-service --prod --ignore-scripts /deploy
RUN cp -r services/catalog-service/dist /deploy/dist
RUN cp -r services/catalog-service/prisma /deploy/prisma
RUN cp services/catalog-service/prisma.config.ts /deploy/prisma.config.ts

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /deploy .

EXPOSE 4001
CMD ["node", "dist/index.js"]

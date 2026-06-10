FROM node:22-alpine AS builder
WORKDIR /app

# prisma generate reads prisma.config.ts which requires DATABASE_URL;
# supply a dummy value so the client can be generated without a real DB at build time.
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

RUN pnpm exec turbo run build --filter="@futbalo/auth-service..."

# Copy generated Prisma client alongside compiled JS so runtime imports resolve.
# TypeScript already compiles the .ts files in src/generated into dist/generated,
# creating that directory. We use /. to copy *contents* into the existing dir so
# pre-compiled .js/.wasm files (e.g. index.js) land at the correct path instead
# of being nested one level deeper under dist/generated/generated/.
RUN cp -r services/auth-service/src/generated/. services/auth-service/dist/generated/

# Create a self-contained production deployment (resolves pnpm symlinks into real node_modules)
RUN pnpm deploy --filter=@futbalo/auth-service --prod --ignore-scripts /deploy
RUN cp -r services/auth-service/dist /deploy/dist
RUN cp -r services/auth-service/prisma /deploy/prisma
RUN cp services/auth-service/prisma.config.ts /deploy/prisma.config.ts

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /deploy .

EXPOSE 4000
CMD ["node", "dist/index.js"]

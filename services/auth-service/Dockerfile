FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web-app/package.json ./apps/web-app/
COPY apps/admin-app/package.json ./apps/admin-app/
COPY services/auth-service/package.json ./services/auth-service/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec turbo run build --filter="@futbalo/auth-service..."

# Copy generated Prisma client alongside compiled JS so runtime imports resolve
RUN cp -r services/auth-service/src/generated services/auth-service/dist/generated

# Create a self-contained production deployment (resolves pnpm symlinks into real node_modules)
RUN pnpm deploy --filter=@futbalo/auth-service --prod /deploy
RUN cp -r services/auth-service/dist /deploy/dist
RUN cp -r services/auth-service/prisma /deploy/prisma

FROM node:22-alpine
WORKDIR /app

# Prisma CLI is a devDependency; install it globally so migrate deploy works at startup
RUN npm install -g prisma@7

COPY --from=builder /deploy .

EXPOSE 4000
CMD ["node", "dist/index.js"]

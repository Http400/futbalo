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

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm exec turbo run build --filter="@futbalo/web-app..."

FROM alpine:3.21
COPY --from=builder /app/apps/web-app/dist /apps/web-app
VOLUME ["/apps/web-app"]

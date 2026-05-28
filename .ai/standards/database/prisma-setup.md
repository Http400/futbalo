# Prisma Setup

## Client Singleton

Use `globalThis` to avoid multiple clients in dev (HMR / hot-reload):

```ts
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  const connectionString =
    process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/futbalo_auth';
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## Generated Output

Prisma client is generated to `src/generated/prisma/` (not the default location):

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}
```

**NEVER edit files under `src/generated/`** — regenerate with:
```
pnpm --filter @futbalo/auth-service db:generate
```

## Schema Conventions

- IDs: `@id @default(cuid())`
- Table names: `@@map("snake_case_plural")` (e.g. `@@map("users")`)
- Schema: `@@schema("auth")` — every model and enum must declare its schema
- `createdAt` / `updatedAt` on every model with `@default(now())` and `@updatedAt`

## Database Adapter

Use `@prisma/adapter-pg` (Prisma Postgres adapter) — not the default query engine.

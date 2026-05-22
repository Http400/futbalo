# Futbalo

A pnpm + Turborepo monorepo with React front-ends and a Node.js back-end.

## Structure

```
futbalo/
├── apps/
│   ├── web-app       # React app (Vite, port 3000)
│   └── admin-app     # React admin app (Vite, port 3001)
├── services/
│   └── auth-service  # Express API + Prisma + PostgreSQL (port 4000)
└── packages/
    ├── types         # Shared TypeScript types
    └── ui            # Shared React components
```

## Requirements

- **Node.js** >= 20.16.0
- **pnpm** >= 10.0.0 — install with `npm i -g pnpm`
- **PostgreSQL** — running locally or via Docker

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up the auth service database

```bash
cp services/auth-service/.env.example services/auth-service/.env
```

Edit `services/auth-service/.env` and set your database connection:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/futbalo_auth
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
```

Run migrations:

```bash
pnpm --filter @futbalo/auth-service db:migrate
```

### 3. Run in development

Start all apps and services in parallel:

```bash
pnpm dev
```

Or run individual packages:

```bash
pnpm --filter @futbalo/web-app dev       # http://localhost:3000
pnpm --filter @futbalo/admin-app dev     # http://localhost:3001
pnpm --filter @futbalo/auth-service dev  # http://localhost:4000
```

### 4. Run Storybook

Browse and develop shared UI components in isolation:

```bash
pnpm --filter @futbalo/ui storybook      # http://localhost:6006
```

To build a static Storybook:

```bash
pnpm --filter @futbalo/ui build-storybook
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps and services in watch mode |
| `pnpm build` | Build all packages for production |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Remove all build artifacts and node_modules |

## Auth service database commands

Run these from the repo root or inside `services/auth-service/`:

```bash
pnpm --filter @futbalo/auth-service db:migrate  # Run pending migrations
pnpm --filter @futbalo/auth-service db:push     # Push schema without migration history
pnpm --filter @futbalo/auth-service db:studio   # Open Prisma Studio UI
pnpm --filter @futbalo/auth-service db:generate # Regenerate Prisma client
```

## Health check

Once the auth service is running:

```bash
curl http://localhost:4000/health
# {"status":"ok","service":"auth-service"}
```

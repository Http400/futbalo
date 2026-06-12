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

## AI Skills

Copilot skills live in [`.github/skills/`](/Users/pawel/Code/Mine/futbalo/.github/skills).
Codex reads the same skills through a symlinked mirror at [`.agents/skills`](/Users/pawel/Code/Mine/futbalo/.agents/skills),
so both tools stay aligned without duplicating skill files.

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

## Deploying to production (VPS)

The project ships with Docker Compose. You need **Docker** and **Docker Compose** installed on the VPS.

### 1. Clone the repo

```bash
git clone https://github.com/Http400/futbalo.git
cd futbalo
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill all empty values:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DB=futbalo

# Auth Service
JWT_SECRET=

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@futbalo.eu
PGADMIN_DEFAULT_PASSWORD=
```

### 3. Point your domains to the VPS

Add DNS `A` records for:

| Subdomain | Points to |
|---|---|
| `www.futbalo.eu` | VPS IP |
| `admin.futbalo.eu` | VPS IP |
| `api.futbalo.eu` | VPS IP |
| `pgadmin.futbalo.eu` | VPS IP |

### 4. Build and start

```bash
docker compose up --build -d
```

This will:
- Build all three app images from source
- Start PostgreSQL and run Prisma migrations automatically
- Serve everything behind nginx on port **80**

### 5. Verify

```bash
curl http://api.futbalo.eu/auth/health
# {"status":"ok","service":"auth-service"}
```

### Useful commands

```bash
docker compose logs -f              # Follow logs for all services
docker compose logs -f auth-service # Follow a specific service
docker compose down                 # Stop all services
docker compose down -v              # Stop and delete database volume
docker compose up --build -d        # Rebuild and restart after code changes
```

> **Note:** The current setup runs on HTTP (port 80). SSL support will be added in a future step.

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

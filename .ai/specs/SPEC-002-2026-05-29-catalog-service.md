# SPEC-002 — Catalog Service

## Overview

`catalog-service` is a standalone Express 5 + Prisma + PostgreSQL service (mirroring the structure of `auth-service`) that stores and serves sport reference data. In its initial version it manages **World Cup 2026 football teams**.

Team data is fetched from two external JSON sources on service startup, merged by `fifaCode`, and persisted to PostgreSQL. Subsequent startups perform an **upsert** so existing data is kept up-to-date without duplication. The API is public — no authentication required.

**Data sources (verified):**

| Source | URL |
|--------|-----|
| openfootball | `https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.teams.json` |
| rezarahiminia | `https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.teams.json` |

---

## Architecture

```
catalog-service/
├── prisma/
│   ├── schema.prisma       # Team model, catalog schema
│   └── migrations/
├── src/
│   ├── index.ts            # Entry point — starts server, triggers sync
│   ├── app.ts              # Express app setup, routes
│   ├── db.ts               # Prisma client singleton
│   ├── routes/
│   │   └── teams.ts        # GET /teams, GET /teams/:fifaCode
│   ├── controllers/
│   │   └── teams.ts        # Request handling, response shaping
│   ├── services/
│   │   ├── teams.ts        # DB read logic
│   │   └── sync.ts         # Startup data fetch + upsert logic
│   └── lib/
│       └── fetchTeams.ts   # HTTP fetch helpers for both sources
├── package.json
├── tsconfig.json
└── .env.example
```

**Startup sync flow:**

```
app start
  └─ syncTeams()
       ├─ fetchOpenfootball()   → Source 1 JSON
       ├─ fetchRezarahiminia()  → Source 2 JSON
       ├─ mergeByFifaCode()     → combined list
       └─ prisma.team.upsert()  → persist each team (by fifaCode)
```

The sync runs once at boot. On failure it logs the error and continues — the service should still start even if remote sources are temporarily unreachable (existing DB data remains valid).

---

## Data Models

### Prisma Schema

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
  output        = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  schemas  = ["catalog"]
}

model Team {
  id            String        @id @default(cuid())
  fifaCode      String        @unique
  name          String
  continent     Continent
  confederation Confederation
  flagUrl       String?
  flagIcon      String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("teams")
  @@schema("catalog")
}

enum Continent {
  AFRICA
  ASIA
  EUROPE
  NORTH_AMERICA
  OCEANIA
  SOUTH_AMERICA

  @@schema("catalog")
}

enum Confederation {
  AFC
  CAF
  CONCACAF
  CONMEBOL
  OFC
  UEFA

  @@schema("catalog")
}
```

### Field Mapping from Sources

| DB field | Source 1 (openfootball) | Source 2 (rezarahiminia) |
|---|---|---|
| `fifaCode` | `fifa_code` | `fifa_code` |
| `name` | `name` | `name_en` |
| `continent` | `continent` → mapped to `Continent` enum | — |
| `confederation` | `confed` → mapped to `Confederation` enum | — |
| `flagUrl` | — | `flag` |
| `flagIcon` | `flag_icon` | — |

Merge strategy: iterate Source 1 as the primary list; enrich each entry with matching fields from Source 2 (join on `fifa_code`).

**Enum mapping — Continent:**

| Source value | Enum |
|---|---|
| `"Africa"` | `AFRICA` |
| `"Asia"` | `ASIA` |
| `"Europe"` | `EUROPE` |
| `"North America"` | `NORTH_AMERICA` |
| `"Oceania"` | `OCEANIA` |
| `"South America"` | `SOUTH_AMERICA` |

**Enum mapping — Confederation:**

| Source value | Enum |
|---|---|
| `"AFC"` | `AFC` |
| `"CAF"` | `CAF` |
| `"CONCACAF"` | `CONCACAF` |
| `"CONMEBOL"` | `CONMEBOL` |
| `"OFC"` | `OFC` |
| `"UEFA"` | `UEFA` |

---

## API Contracts

Base path: `/` (no versioning prefix for now, matching auth-service pattern)

### `GET /health`

Standard health check.

**Response `200`:**
```json
{ "status": "ok", "service": "catalog-service" }
```

---

### `GET /teams`

Returns all teams.

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "fifaCode": "MEX",
    "name": "Mexico",
    "continent": "NORTH_AMERICA",
    "confederation": "CONCACAF",
    "flagUrl": "https://flagcdn.com/w80/mx.png",
    "flagIcon": "🇲🇽",
    "createdAt": "2026-05-29T00:00:00.000Z",
    "updatedAt": "2026-05-29T00:00:00.000Z"
  }
]
```

---

### `GET /teams/:fifaCode`

Returns a single team by its FIFA code (e.g. `MEX`, `BRA`).

**Response `200`:** Single team object (same shape as above)

**Response `404`:**
```json
{ "error": "Team not found" }
```

---

## Configuration

`.env` / `.env.example`:

```dotenv
# Server
PORT=4001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/futbalo?schema=catalog"

# Data sources (optional overrides — defaults are the verified URLs)
TEAMS_SOURCE_OPENFOOTBALL="https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.teams.json"
TEAMS_SOURCE_REZARAHIMINIA="https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.teams.json"
```

---

## Changelog

### 2026-05-29 (update)
- Removed `nameFa`, `nameNormalized`, `group`, `iso2` from Team model
- Renamed `confed` → `confederation`
- Changed `continent` and `confederation` from strings to enums (`Continent`, `Confederation`)

### 2026-05-29
- Initial specification: catalog-service with Team entity, dual-source sync, REST API.

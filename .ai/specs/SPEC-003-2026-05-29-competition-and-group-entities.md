# SPEC-003 — Competition and Group Entities (catalog-service)

## Overview

Extends `catalog-service` with two new static reference entities: **Competition** and **Group**.

- A **Competition** represents a football tournament edition (e.g. FIFA World Cup 2026).
- A **Group** belongs to a Competition and represents a stage-group (e.g. Group A, Group B).

Unlike teams (fetched from remote sources on startup), Competition and Group data are **seeded statically** via a Prisma seed script. The seed is idempotent — re-running it upserts without duplication.

---

## Architecture

New files added to `catalog-service/`:

```
catalog-service/
├── prisma/
│   ├── schema.prisma            # + Competition, Group models
│   ├── seed.ts                  # static seed: WC2026 + groups A–L
│   └── migrations/
│       └── <timestamp>_add_competition_group/
├── src/
│   ├── routes/
│   │   ├── teams.ts             # (existing)
│   │   └── competitions.ts      # NEW — competition + group routes
│   ├── controllers/
│   │   ├── teams.controller.ts  # (existing)
│   │   └── competitions.controller.ts  # NEW
│   └── services/
│       ├── teams.ts             # (existing)
│       ├── sync.ts              # (existing)
│       └── competitions.ts      # NEW — DB read logic for competitions/groups
```

Route registration in `src/app.ts`:
```
app.use('/competitions', competitionsRouter)
```

---

## Data Models

### Prisma Schema additions

```prisma
model Competition {
  id        String   @id @default(cuid())
  name      String
  edition   Int
  groups    Group[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([name, edition])
  @@map("competitions")
  @@schema("catalog")
}

model Group {
  id            String      @id @default(cuid())
  competitionId String
  competition   Competition @relation(fields: [competitionId], references: [id])
  name          String      // single letter: "A", "B", ..., "L"
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([competitionId, name])
  @@map("groups")
  @@schema("catalog")
}
```

### Field definitions

| Entity | Field | Type | Notes |
|--------|-------|------|-------|
| Competition | `id` | `String` (cuid) | PK |
| Competition | `name` | `String` | e.g. `"FIFA World Cup"` |
| Competition | `edition` | `Int` | e.g. `2026` |
| Group | `id` | `String` (cuid) | PK |
| Group | `competitionId` | `String` | FK → Competition |
| Group | `name` | `String` | single letter, e.g. `"A"` |

---

## Seed Data

File: `prisma/seed.ts`

The seed is triggered via `pnpm --filter @futbalo/catalog-service db:seed`.

### Competition

```ts
{ name: "FIFA World Cup", edition: 2026 }
```

### Groups (12 total, names A–L)

| name |
|------|
| A |
| B |
| C |
| D |
| E |
| F |
| G |
| H |
| I |
| J |
| K |
| L |

Seed strategy: `upsert` on `{ name, edition }` for Competition; `upsert` on `{ competitionId, name }` for each Group.

---

## API Contracts

Base path: `/competitions`

### `GET /competitions`

Returns all competitions.

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "name": "FIFA World Cup",
    "edition": 2026,
    "createdAt": "2026-05-29T00:00:00.000Z",
    "updatedAt": "2026-05-29T00:00:00.000Z"
  }
]
```

---

### `GET /competitions/:id`

Returns a single competition by its id.

**Response `200`:** Single competition object (same shape as above)

**Response `404`:**
```json
{ "error": "Competition not found" }
```

---

### `GET /competitions/:id/groups`

Returns all groups belonging to a competition.

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "competitionId": "clx...",
    "name": "A",
    "createdAt": "2026-05-29T00:00:00.000Z",
    "updatedAt": "2026-05-29T00:00:00.000Z"
  }
]
```

**Response `404`:** (if competition id does not exist)
```json
{ "error": "Competition not found" }
```

---

### `GET /groups/:id`

Returns a single group by its id.

**Response `200`:** Single group object (same shape as above)

**Response `404`:**
```json
{ "error": "Group not found" }
```

---

## Changelog

### 2026-05-29 (update)
- Removed `code` field from Group; `name` is now the single letter identifier (e.g. `"A"`), unique within a competition.

### 2026-05-29
- Initial specification: Competition and Group entities with static seed and REST API.

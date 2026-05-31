# SPEC-006 — Stage Entity (catalog-service)

## Overview

Extends `catalog-service` with a **Stage** entity representing a knockout/group stage within a Competition (e.g. Group Stage, Round of 16, Final).

Stage data is **statically seeded** via the existing Prisma seed script for FIFA World Cup 2026, and **managed at runtime** via a standard CRUD REST API.

---

## Architecture

New and updated files in `catalog-service/`:

```
catalog-service/
├── prisma/
│   ├── schema.prisma            # + Stage model, Competition.stages relation
│   ├── seed.ts                  # updated — seed 7 WC2026 stages after competition upsert
│   └── migrations/
│       └── <timestamp>_add_stage/
├── src/
│   ├── app.ts                   # updated — register stagesRouter at /stages
│   ├── routes/
│   │   └── stages.ts            # NEW — CRUD routes for Stage
│   ├── controllers/
│   │   └── stages.controller.ts # NEW — request handling, response shaping
│   └── services/
│       └── stages.ts            # NEW — DB read/write logic for Stage
```

Route registration in `src/app.ts`:
```ts
app.use('/stages', stagesRouter)
```

---

## Data Models

### Prisma Schema

```prisma
model Stage {
  id            String      @id @default(cuid())
  code          String
  name          String
  sortOrder     Int
  competitionId String
  competition   Competition @relation(fields: [competitionId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([competitionId, code])
  @@map("stages")
  @@schema("catalog")
}
```

Update `Competition` model to add the inverse relation:

```prisma
model Competition {
  // ... existing fields ...
  groups  Group[]
  stages  Stage[]   // NEW
}
```

### Field Definitions

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | PK |
| `code` | `String` | Short identifier, e.g. `"GS"`, `"R16"`. Unique within a competition. |
| `name` | `String` | Display name, e.g. `"Group Stage"`, `"Final"` |
| `sortOrder` | `Int` | Ascending order for display/sorting |
| `competitionId` | `String` | FK → Competition |

---

## Seed Data

File: `prisma/seed.ts` — updated to upsert stages after the competition upsert.

Seed is triggered via `pnpm --filter @futbalo/catalog-service db:seed`.

The competition is looked up by `{ name: "FIFA World Cup", edition: 2026 }` before seeding stages.

### Stages for FIFA World Cup 2026

| code | name | sortOrder |
|------|------|-----------|
| GS | Group Stage | 1 |
| R32 | Round of 32 | 2 |
| R16 | Round of 16 | 3 |
| QF | Quarter-finals | 4 |
| SF | Semi-finals | 5 |
| TPP | Third Place Playoff | 6 |
| FIN | Final | 7 |

Seed strategy: `upsert` on `{ competitionId, code }` for each Stage.

---

## API Contracts

Base path: `/stages`

### `GET /stages`

Returns all stages, ordered by `sortOrder` ascending.

**Query params (optional):**
- `competitionId` — filter stages by competition

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "code": "GS",
    "name": "Group Stage",
    "sortOrder": 1,
    "competitionId": "clx...",
    "createdAt": "2026-05-31T00:00:00.000Z",
    "updatedAt": "2026-05-31T00:00:00.000Z"
  }
]
```

---

### `GET /stages/:id`

Returns a single stage by its cuid.

**Response `200`:** Single stage object (same shape as above)

**Response `404`:**
```json
{ "error": "Stage not found" }
```

---

### `POST /stages`

Creates a new stage.

**Request body:**
```json
{
  "code": "R32",
  "name": "Round of 32",
  "sortOrder": 2,
  "competitionId": "clx..."
}
```

**Validation:**
- All fields required
- `code` + `competitionId` combination must be unique (return `409` if duplicate)
- `competitionId` must reference an existing Competition (return `404` if not found)

**Response `201`:** Created stage object

**Response `409`:**
```json
{ "error": "Stage with this code already exists for the competition" }
```

---

### `PUT /stages/:id`

Updates an existing stage. All fields optional — only provided fields are updated.

**Request body (all optional):**
```json
{
  "code": "R32",
  "name": "Round of 32",
  "sortOrder": 2,
  "competitionId": "clx..."
}
```

**Response `200`:** Updated stage object

**Response `404`:**
```json
{ "error": "Stage not found" }
```

**Response `409`:**
```json
{ "error": "Stage with this code already exists for the competition" }
```

---

### `DELETE /stages/:id`

Deletes a stage by its cuid.

**Response `204`:** No content

**Response `404`:**
```json
{ "error": "Stage not found" }
```

---

## Changelog

### 2026-05-31
- Initial specification: Stage entity with seed data and CRUD REST API.

# SPEC-004 — Group-Team Relation (catalog-service)

## Overview

Extends `catalog-service` with a **GroupTeam** join table that records which teams participate in which groups for a given competition.

- The relation is many-to-many (`Group` ↔ `Team`) via a `GroupTeam` table, allowing a team to appear in different groups across different competitions in the future.
- Seed data is populated from the existing openfootball source (`worldcup.teams.json`) which contains a `group` field per team.
- The seed is idempotent — re-running upserts without duplication.
- Two existing endpoints are extended: `GET /competitions/:id/groups` now includes teams inline; a new `GET /groups/:id/teams` endpoint is added.

---

## Architecture

Changes within `catalog-service/`:

```
catalog-service/
├── prisma/
│   ├── schema.prisma                # + GroupTeam model + back-relations on Group and Team
│   ├── seed.ts                      # updated — seed GroupTeam records from openfootball
│   └── migrations/
│       └── <timestamp>_add_group_team/
├── src/
│   ├── app.ts                       # updated — register groupsRouter at /groups
│   ├── routes/
│   │   ├── competitions.ts          # updated — groups response now includes teams inline
│   │   └── groups.ts                # NEW — GET /groups/:id + GET /groups/:id/teams
│   ├── controllers/
│   │   ├── competitions.controller.ts  # updated — groups query includes teams
│   │   └── groups.controller.ts     # NEW — getGroup + getGroupTeams handlers
│   └── services/
│       └── competitions.ts          # updated — getGroupById + getGroupTeams query
```

Route registration in `src/app.ts`:
```ts
app.use('/groups', groupsRouter)   // NEW — alongside existing /competitions
```

> **`GET /groups/:id` migration note:** SPEC-003 defines `GET /groups/:id` but placed it in `routes/competitions.ts`. With this spec, that route **moves** into the new `routes/groups.ts` and is removed from `competitions.ts`. This consolidates all group-level routes in one file.

---

## Data Models

### Prisma Schema addition

```prisma
model GroupTeam {
  id      String @id @default(cuid())
  groupId String
  group   Group  @relation(fields: [groupId], references: [id])
  teamId  String
  team    Team   @relation(fields: [teamId], references: [id])

  @@unique([groupId, teamId])
  @@map("group_teams")
  @@schema("catalog")
}
```

> **No `createdAt`/`updatedAt` on GroupTeam** — intentional. This is a pure join table with no audit requirement. It does not follow the timestamp pattern used by Group, Team, and Competition.

### Back-relations added to existing models

```prisma
// inside model Group { ... }
  groupTeams GroupTeam[]

// inside model Team { ... }
  groupTeams GroupTeam[]
```

### Field definitions

| Entity | Field | Type | Notes |
|--------|-------|------|-------|
| GroupTeam | `id` | `String` (cuid) | PK |
| GroupTeam | `groupId` | `String` | FK → Group |
| GroupTeam | `teamId` | `String` | FK → Team |

---

## Seed Strategy

File: `prisma/seed.ts` (update)

### Prerequisite

**Teams must already exist in the database before this seed step runs.** Start the catalog-service at least once (it runs `syncTeams()` on boot) so that `Team` records are populated. Then run:

```sh
pnpm --filter @futbalo/catalog-service db:seed
```

### Seed flow

The existing seed already upserts `Competition` and `Groups A–L`. The update adds a third step:

```
seed.ts
  └─ (existing) upsert Competition "FIFA World Cup 2026"
  └─ (existing) upsert Groups A–L linked to competition
  └─ (new) fetch openfootball teams JSON via fetch()
       for each team entry:
         look up Team by fifaCode in DB
         look up Group by { competitionId, name: team.group }
         upsert GroupTeam { groupId, teamId }
```

**Prisma upsert pattern for GroupTeam:**
```ts
await prisma.groupTeam.upsert({
  where: { groupId_teamId: { groupId, teamId } },
  create: { groupId, teamId },
  update: {},
})
```
(`groupId_teamId` is the compound unique key name Prisma derives from `@@unique([groupId, teamId])`.)

**Fetch in seed:** The seed calls the openfootball URL directly using `fetch()` (Node 18+ built-in). It does **not** reuse `lib/fetchTeams.ts` — the seed only needs the group assignment mapping (`fifa_code` → `group` letter), not the full team merge logic.

**Data source (verified):** `https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.teams.json`

Each entry has:
- `fifa_code` — used to look up the `Team` record
- `group` — single letter (e.g. `"A"`) used to look up the `Group` record

**Edge cases:**
- If a team's `fifaCode` is not found in the DB (service hasn't been started yet), log a warning with the fifaCode and skip — the seed must not fail.
- If a group letter from the JSON doesn't match any seeded group, log a warning and skip.
- The fetch itself failing (network error) should throw and abort the seed with a descriptive error message.

---

## API Contracts

**`GET /competitions/:id/groups` query shape** (in `services/competitions.ts`):
```ts
prisma.group.findMany({
  where: { competitionId: id },
  include: {
    groupTeams: {
      include: { team: true }
    }
  }
})
```
Response serialization maps `groupTeams[].team` → flat `teams[]` array, omitting `createdAt`/`updatedAt` from each team object.

### `GET /competitions/:id/groups` — updated

Now includes a `teams` array on each group object. The inline team shape is a **summary** (omits `createdAt`/`updatedAt`) to keep the response compact. This is intentional — use `GET /groups/:id/teams` for full team objects.

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "competitionId": "clx...",
    "name": "A",
    "createdAt": "2026-05-29T00:00:00.000Z",
    "updatedAt": "2026-05-29T00:00:00.000Z",
    "teams": [
      {
        "id": "clx...",
        "fifaCode": "MEX",
        "name": "Mexico",
        "continent": "NORTH_AMERICA",
        "confederation": "CONCACAF",
        "flagUrl": "https://flagcdn.com/w80/mx.png",
        "flagIcon": "🇲🇽"
      }
    ]
  }
]
```

**Response `404`:** (competition not found — same as before)
```json
{ "error": "Competition not found" }
```

---

### `GET /groups/:id/teams` — new

Returns the full list of teams in a specific group.

**Router:** Registered in `src/app.ts` as `app.use('/groups', groupsRouter)` — a new dedicated router file `src/routes/groups.ts`, separate from the competitions router.

**Path:** `GET /groups/:id/teams`

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

**Response `404`:** (group not found)
```json
{ "error": "Group not found" }
```

**Response `200` when group exists but has no teams yet:** returns an empty array `[]` — not a 404.

---

## Implementation Checklist

- [x] Update Prisma schema (GroupTeam model + back-relations)
- [x] Create migration (`20260529130717_add_group_team`)
- [x] Update seed.ts with GroupTeam seeding
- [x] Add shared types (TeamSummary, GroupWithTeams) to packages/types
- [x] Update competitions service (include teams, add getGroupTeams)
- [x] Update competitions controller (use GroupWithTeams, remove getGroupById)
- [x] Create groups controller (getGroupById + getGroupTeams)
- [x] Create groups router (GET /groups/:id + GET /groups/:id/teams)
- [x] Update competitions router (remove GET /groups/:id)
- [x] Register groupsRouter in app.ts

## Changelog

### 2026-05-29
- Initial specification: GroupTeam join table, seed update from openfootball, updated groups endpoint, new group teams endpoint.

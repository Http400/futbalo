# SPEC-007 — Match Entity

## Overview

Adds a `Match` entity to the `catalog-service`. A match represents a single game in the World Cup 2026 competition, linking together a `Competition`, `Stage`, `Stadium`, two `Team` entries (or placeholders for knockout slots not yet decided), and an optional `Group`.

Match data is seeded from two external JSON sources at service startup (same pattern as teams/stadiums), and can be further managed via a full CRUD REST API.

---

## Architecture

### New files in catalog-service

```
catalog-service/
├── prisma/
│   └── schema.prisma           # Match model + enums + inverse relations
├── src/
│   ├── routes/
│   │   └── matches.ts          # GET /matches, GET /matches/:id, POST, PATCH, DELETE
│   ├── controllers/
│   │   └── matches.ts          # Request handling, response shaping
│   ├── services/
│   │   ├── matches.ts          # DB read/write logic (filtering, CRUD)
│   │   └── syncMatches.ts      # Startup match sync from external sources
│   └── lib/
│       └── fetchMatches.ts     # HTTP fetch helpers for both match sources
```

### Updated files

- `src/index.ts` — call `syncMatches()` after existing syncs
- `src/app.ts` — register `/matches` routes
- `prisma/schema.prisma` — add `Match` model, enums, inverse relations on existing models

### Startup sync flow

```
app start
  └─ syncMatches()
       ├─ fetchOpenfootballMatches()   → Source 1 JSON (worldcup.json)
       ├─ fetchRezarahimiaMatches()    → Source 2 JSON (football.matches.json)
       ├─ mergeMatchData()             → combined list (rezarahiminia as primary, openfootball for round/group names)
       ├─ resolveRelations()           → look up DB IDs for teams, stadiums, groups, stages
       └─ prisma.match.upsert()        → persist each match (upsert by external composite key)
```

**Sync resilience:** Same as team/stadium sync — errors are logged, service continues. Existing DB data remains valid if sources are unreachable.

**Upsert key:** Because sources don't share a stable unique ID, matches are identified by `(competitionId, homeTeamId, awayTeamId, stageId)` or a `sourceId` string derived from the rezarahiminia `id` field stored on the record.

---

## Data Models

### Prisma Schema — new additions

```prisma
model Match {
  id               String           @id @default(cuid())
  sourceId         String?          @unique   // rezarahiminia numeric id, used as upsert key during sync
  competitionId    String
  competition      Competition      @relation(fields: [competitionId], references: [id])
  stageId          String
  stage            Stage            @relation(fields: [stageId], references: [id])
  stadiumId        String
  stadium          Stadium          @relation(fields: [stadiumId], references: [id])
  groupId          String?
  group            Group?           @relation(fields: [groupId], references: [id])
  homeTeamId       String?
  homeTeam         Team?            @relation("homeMatches", fields: [homeTeamId], references: [id])
  awayTeamId       String?
  awayTeam         Team?            @relation("awayMatches", fields: [awayTeamId], references: [id])
  homePlaceholder  String?          // e.g. "Winner Group A" for knockout rounds
  awayPlaceholder  String?
  kickoffAt        DateTime?
  status           MatchStatus      @default(SCHEDULED)
  homeScore        Int?
  awayScore        Int?
  homePenaltyScore Int?
  awayPenaltyScore Int?
  winnerTeamId     String?
  winnerTeam       Team?            @relation("wonMatches", fields: [winnerTeamId], references: [id])
  resultType       MatchResultType?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@map("matches")
  @@schema("catalog")
}

enum MatchStatus {
  SCHEDULED
  LIVE
  FINISHED
  CANCELLED
  POSTPONED

  @@schema("catalog")
}

enum MatchResultType {
  REGULAR_TIME
  EXTRA_TIME
  PENALTIES

  @@schema("catalog")
}
```

### Inverse relations added to existing models

```prisma
// Competition
model Competition {
  // ... existing fields ...
  matches Match[]   // NEW
}

// Stage
model Stage {
  // ... existing fields ...
  matches Match[]   // NEW
}

// Stadium
model Stadium {
  // ... existing fields ...
  matches Match[]   // NEW
}

// Group
model Group {
  // ... existing fields ...
  matches Match[]   // NEW
}

// Team — three named relations
model Team {
  // ... existing fields ...
  homeMatches Match[] @relation("homeMatches")   // NEW
  awayMatches Match[] @relation("awayMatches")   // NEW
  wonMatches  Match[] @relation("wonMatches")    // NEW
}
```

---

## Data Source Mapping

### Sources (verified)

| Source | Raw URL |
|--------|---------|
| openfootball | `https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json` |
| rezarahiminia | `https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.matches.json` |

### Source schemas

**openfootball** (`worldcup.json` — `matches[]`):

```json
{
  "round": "Matchday 1",
  "date": "2026-06-11",
  "time": "13:00 UTC-6",
  "team1": "Mexico",
  "team2": "South Africa",
  "group": "Group A",
  "ground": "Mexico City"
}
```

**rezarahiminia** (`football.matches.json` — array):

```json
{
  "id": "1",
  "home_team_id": "1",
  "away_team_id": "2",
  "home_score": "0",
  "away_score": "0",
  "group": "A",
  "matchday": "1",
  "local_date": "06/11/2026 13:00",
  "stadium_id": "1",
  "finished": "FALSE",
  "time_elapsed": "notstarted",
  "type": "group"
}
```

### Field mapping

| DB field | openfootball | rezarahiminia | Notes |
|---|---|---|---|
| `sourceId` | — | `id` | Stored as-is for upsert key |
| `kickoffAt` | `date` + `time` | `local_date` | Parse into UTC DateTime; prefer openfootball (has UTC offset) |
| `homeTeamId` | `team1` (name) | `home_team_id` (numeric) | Resolve by `Team.name` match from openfootball; rezarahiminia numeric IDs require a pre-built numeric→fifaCode map (sourced from `football.teams.json`) |
| `awayTeamId` | `team2` (name) | `away_team_id` (numeric) | Same resolution as above |
| `stadiumId` | `ground` (city string) | `stadium_id` (numeric) | Resolve by `Stadium.city` or `Stadium.name`; numeric IDs need a pre-built map from `football.stadiums.json` |
| `groupId` | `group` ("Group A") | `group` ("A") | Resolve by `Group.name` within the competition |
| `stageId` | `round` ("Matchday 1", "Round of 32", …) | `type` ("group"/"knockout") + `matchday` | Map `round` string to `Stage.code`; see stage mapping below |
| `homeScore` | — | `home_score` | Parse string→int, null if "0" and not finished |
| `awayScore` | — | `away_score` | Same |
| `status` | — | `finished` + `time_elapsed` | `finished=TRUE` → `FINISHED`; `time_elapsed=notstarted` → `SCHEDULED` |

### Stage resolution

Map openfootball `round` strings to `Stage.code` values (as defined in SPEC-006):

| openfootball `round` | Stage `code` |
|---|---|
| `"Matchday 1"` … `"Matchday 16"` | `"GROUP"` |
| `"Round of 32"` | `"ROUND_OF_32"` |
| `"Round of 16"` | `"ROUND_OF_16"` |
| `"Quarter-final"` | `"QUARTER_FINAL"` |
| `"Semi-final"` | `"SEMI_FINAL"` |
| `"Match for third place"` | `"THIRD_PLACE"` |
| `"Final"` | `"FINAL"` |

### Merge strategy

1. Use **rezarahiminia** as primary list (has numeric IDs stable across runs, and scores)
2. For each rezarahiminia match, find the corresponding openfootball entry by `(home_team, away_team, date)` match
3. Enrich with openfootball fields: exact kickoff time with UTC offset, round string (for stage resolution)
4. Resolve all foreign keys against the DB (teams, stadium, group, stage, competition)
5. Upsert by `sourceId`

---

## API Contracts

Base path: `/matches`

### `GET /matches`

Returns all matches, with optional filtering.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `competitionId` | string | Filter by competition |
| `stageId` | string | Filter by stage |
| `groupId` | string | Filter by group |
| `teamId` | string | Filter matches where team is home or away |
| `status` | `SCHEDULED\|LIVE\|FINISHED\|CANCELLED\|POSTPONED` | Filter by status |

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "sourceId": "1",
    "competitionId": "clx...",
    "stageId": "clx...",
    "stadiumId": "clx...",
    "groupId": "clx...",
    "homeTeamId": "clx...",
    "awayTeamId": "clx...",
    "homePlaceholder": null,
    "awayPlaceholder": null,
    "kickoffAt": "2026-06-11T19:00:00.000Z",
    "status": "SCHEDULED",
    "homeScore": null,
    "awayScore": null,
    "homePenaltyScore": null,
    "awayPenaltyScore": null,
    "winnerTeamId": null,
    "resultType": null,
    "createdAt": "2026-05-31T00:00:00.000Z",
    "updatedAt": "2026-05-31T00:00:00.000Z"
  }
]
```

---

### `GET /matches/:id`

Returns a single match by its cuid.

**Response `200`:** Single match object (same shape as above)

**Response `404`:**
```json
{ "error": "Match not found" }
```

---

### `POST /matches`

Creates a new match manually.

**Request body:**
```json
{
  "competitionId": "clx...",
  "stageId": "clx...",
  "stadiumId": "clx...",
  "groupId": "clx...",
  "homeTeamId": "clx...",
  "awayTeamId": "clx...",
  "homePlaceholder": null,
  "awayPlaceholder": null,
  "kickoffAt": "2026-06-11T19:00:00.000Z",
  "status": "SCHEDULED"
}
```

`competitionId`, `stageId`, `stadiumId` are required. All team fields are optional (for knockout slots not yet decided).

**Response `201`:** Created match object

**Response `400`:**
```json
{ "error": "competitionId, stageId, and stadiumId are required" }
```

---

### `PATCH /matches/:id`

Partially updates a match (e.g. update score, status, resultType after the game).

**Request body:** Any subset of match fields (all optional).

```json
{
  "status": "FINISHED",
  "homeScore": 2,
  "awayScore": 1,
  "resultType": "REGULAR_TIME",
  "winnerTeamId": "clx..."
}
```

**Response `200`:** Updated match object

**Response `404`:**
```json
{ "error": "Match not found" }
```

---

### `DELETE /matches/:id`

Deletes a match.

**Response `204`:** No content

**Response `404`:**
```json
{ "error": "Match not found" }
```

---

## Configuration

No new environment variables required. The sync URLs are hardcoded defaults (same pattern as teams/stadiums):

```dotenv
# Optional overrides (defaults are the verified URLs above)
MATCHES_SOURCE_OPENFOOTBALL="https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json"
MATCHES_SOURCE_REZARAHIMINIA="https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.matches.json"
```

---

## Implementation Checklist

- [x] Inject standards
- [x] Update Prisma schema (Match model + enums + inverse relations)
- [x] Run Prisma migration
- [x] Create `lib/fetchMatches.ts`
- [x] Create `services/syncMatches.ts`
- [x] Update `index.ts` to call syncMatches
- [x] Create `services/matches.ts` (DB layer)
- [x] Create `controllers/matches.controller.ts`
- [x] Create `routes/matches.ts`
- [x] Register `/matches` routes in `app.ts`

---

## Changelog

### 2026-05-31
- Initial specification: Match entity with full CRUD API and dual-source startup sync.

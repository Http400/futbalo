# SPEC-005 — Stadium Entity (catalog-service)

## Overview

Extends `catalog-service` with a **Stadium** entity representing a World Cup 2026 venue.

Stadium data is fetched from two external JSON sources on service startup, merged by stadium name, and persisted to PostgreSQL. The sync follows the same upsert pattern as teams — idempotent on subsequent restarts, non-fatal on source failure.

**Data sources (verified):**

| Source | URL |
|--------|-----|
| openfootball | `https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.stadiums.json` |
| rezarahiminia | `https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.stadiums.json` |

---

## Architecture

**HTTP client:** native `fetch` (Node ≥ 18 built-in) — same as `fetchTeams.ts`. No additional HTTP library required.

**Controller naming:** `*.controller.ts` suffix — consistent with the existing `teams.controller.ts`, `competitions.controller.ts`, `groups.controller.ts` pattern. This convention applies to all controller files.

New and updated files in `catalog-service/`:

```
catalog-service/
├── prisma/
│   ├── schema.prisma            # + Stadium model
│   └── migrations/
│       └── <timestamp>_add_stadium/
├── src/
│   ├── app.ts                   # updated — register stadiumsRouter at /stadiums
│   ├── routes/
│   │   ├── teams.ts             # (existing)
│   │   └── stadiums.ts          # NEW — GET /stadiums, GET /stadiums/:id
│   ├── controllers/
│   │   ├── teams.controller.ts  # (existing)
│   │   └── stadiums.controller.ts  # NEW — request handling, response shaping
│   ├── services/
│   │   ├── teams.ts             # (existing)
│   │   ├── stadiums.ts          # NEW — DB read logic
│   │   └── sync.ts              # updated — also calls syncStadiums()
│   └── lib/
│       ├── fetchTeams.ts        # (existing)
│       └── fetchStadiums.ts     # NEW — HTTP fetch helpers for both stadium sources
```

**Startup sync flow:**

```
app start
  └─ syncTeams()          (existing)
  └─ syncStadiums()       (new)
       ├─ fetchOpenfootballStadiums()   → Source 1 JSON
       ├─ fetchRezarahiminiaStadiums()  → Source 2 JSON
       ├─ mergeByName()                 → combined list (16 stadiums)
       └─ prisma.stadium.upsert()       → persist each stadium (by name)
```

On failure, logs the error and continues — service starts with existing DB data intact.

---

## Data Models

### Prisma Schema

```prisma
model Stadium {
  id          String   @id @default(cuid())
  name        String   @unique
  fifaName    String?
  city        String
  country     String?
  countryCode String
  timezone    String
  capacity    Int
  coords      String?
  region      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("stadiums")
  @@schema("catalog")
}
```

### Field Mapping from Sources

| DB field | Source 1 (openfootball) | Source 2 (rezarahiminia) |
|---|---|---|
| `name` | `name` | — (join key: `name_en`) |
| `fifaName` | — | `fifa_name` |
| `city` | `city` | — |
| `country` | — | `country_en` |
| `countryCode` | `cc` (2-letter ISO, lowercase) | — |
| `timezone` | `timezone` | — |
| `capacity` | `capacity` | `capacity` (same values; Source 1 is authoritative) |
| `coords` | `coords` | — |
| `region` | — | `region` |

**Fields excluded:** `name_fa`, `city_fa`, `country_fa` from Source 2 (not needed).

### TypeScript Interfaces (Raw Source Shapes)

```ts
// Source 1 — openfootball response envelope: { "name": "...", "stadiums": [...] }
// fetchOpenfootballStadiums() must extract response.stadiums from the envelope object.
interface OpenfootballStadiumsResponse {
  name: string;
  stadiums: OpenfootballStadium[];
}

interface OpenfootballStadium {
  city: string;
  timezone: string;
  cc: string;         // 2-letter ISO country code, already lowercase (e.g. "us", "mx", "ca")
  name: string;
  capacity: number;
  coords?: string;    // present in all 16 known stadiums; typed optional for safety
}

// Source 2 — rezarahiminia response envelope: top-level array [...]
interface RezarahiminiaStadium {
  _id: { $oid: string };
  id: string;
  name_en: string;
  name_fa: string;   // excluded from DB
  fifa_name: string;
  city_en: string;
  city_fa: string;   // excluded from DB
  country_en: string;
  country_fa: string; // excluded from DB
  capacity: number;
  region: string;    // "Central" | "Eastern" | "Western"
}
```

### Merge Strategy

Source 1 (openfootball) is the primary list. For each stadium in Source 1, look up a matching entry in Source 2 by comparing Source 1 `name` against Source 2 `name_en`, after normalizing both to lowercase and trimming whitespace.

- `countryCode` is stored as Source 1 `cc` normalized to lowercase via `.toLowerCase()` (source is already lowercase, but normalization is applied for robustness).
- If no Source 2 match is found for a stadium, nullable fields (`fifaName`, `country`, `region`) remain `null`. In practice all 16 Source 1 stadiums match Source 2 entries (including the Arrowhead fallback), but the code must handle the no-match case gracefully.

**Known name mismatch — Arrowhead Stadium:**

| Source 1 `name` | Source 2 `name_en` |
|---|---|
| `"Arrowhead Stadium"` | `"GEHA Field at Arrowhead Stadium"` |

Resolution: if no exact normalized match is found, fall back to checking whether the Source 1 `name` (normalized) is a substring of the Source 2 `name_en` (normalized). This handles this single case without a hardcoded exception.

`mergeByName()` lives inside `sync.ts` — it is an internal helper function called only from `syncStadiums()`.

---

## API Contracts

Base path: `/` (matching existing catalog-service pattern)

### `GET /stadiums`

Returns all stadiums, ordered alphabetically by `name`.

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "name": "Estadio Azteca",
    "fifaName": "Mexico City Stadium",
    "city": "Mexico City",
    "country": "Mexico",
    "countryCode": "mx",
    "timezone": "UTC-6",
    "capacity": 83000,
    "coords": "19°18'11\"N 99°09'02\"W",
    "region": "Central",
    "createdAt": "2026-05-29T00:00:00.000Z",
    "updatedAt": "2026-05-29T00:00:00.000Z"
  }
]
```

---

### `GET /stadiums/:id`

Returns a single stadium by its cuid.

**Response `200`:** Single stadium object (same shape as above)

**Response `404`:**
```json
{ "error": "Stadium not found" }
```

---

## Configuration

No new environment variables. Stadium source URLs are hardcoded as constants in `fetchStadiums.ts`:

```ts
const OPENFOOTBALL_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.stadiums.json';
const REZARAHIMINIA_URL = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/refs/heads/main/football.stadiums.json';
```

---

## Changelog

### 2026-05-29 (update)
- Changed Configuration section: removed env var overrides; URLs are now hardcoded constants in `fetchStadiums.ts`.

### 2026-05-29
- Initial specification: Stadium entity with dual-source sync, REST API.

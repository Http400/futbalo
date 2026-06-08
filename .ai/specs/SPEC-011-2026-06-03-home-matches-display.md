# SPEC-011 — Home Matches Display

## Overview

Adds a match list to the `web-app` home page below the existing `GlobeWrapper`. Matches are fetched from `catalog-service`'s `GET /matches` endpoint (server-side pagination, 20 per page). Because the API returns only foreign-key IDs, the frontend also fetches all teams (`GET /teams`) and all stadiums (`GET /stadiums`) once and joins the data client-side before rendering `MatchCardList` from `@futbalo/ui`.

**Key decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| Data enrichment | Fetch separately + join on frontend | Keeps catalog-service simple; teams/stadiums are small datasets (48 teams, ~16 stadiums) |
| Pagination | Server-side (`page`/`limit` to API) | MatchCardList is given only the current page's items; external MUI `Pagination` drives the page |
| Competition label | Hard-coded `"FIFA World Cup 2026"` | Only one competition exists; avoids an extra API call |
| Status mapping | SCHEDULED→upcoming, LIVE→live, FINISHED/CANCELLED/POSTPONED→finished/upcoming per table | MatchCard uses a 3-value enum |

---

## User Stories

### Story 1 — Visitor browses upcoming matches

**Persona**: Kamil — a casual football fan. Opens the Futbalo site on his phone to check today's matches. Has no account, just wants to see who's playing.

**Step 1 — Landing on home page**

```
┌──────────────────────────────────────────┐
│           [ Globe animation ]            │
│              (full-width)                │
├──────────────────────────────────────────┤
│  Matches                                 │
│  ┌──────────────────────────────────┐    │
│  │ ⏳ Loading...                    │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

> **Behind the scenes**: On mount, `MatchesSection` triggers three RTK Query requests in parallel:
> `GET /matches?page=1&limit=20`, `GET /teams`, `GET /stadiums`.
> All three show their individual loading states until resolved.

**Change vs. current state**: Currently the home page renders only `GlobeWrapper` inside a fixed `<main>`. After this change, `<main>` scrolls and the match list appears below the globe.

---

**Step 2 — Matches loaded**

```
┌──────────────────────────────────────────┐
│           [ Globe animation ]            │
├──────────────────────────────────────────┤
│  Matches                                 │
│  ┌──────────────────────────────────┐    │
│  │ Upcoming · 11 Jun 2026 · 19:00   │    │
│  │ Mexico City · FIFA World Cup 2026│    │
│  │ 🇲🇽 Mexico  ——  🇿🇦 South Africa  │    │
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │ Upcoming · 11 Jun 2026 · 22:00   │    │
│  │  ...                             │    │
│  └──────────────────────────────────┘    │
│  ... (up to 20 cards)                    │
│                                          │
│          ← 1  2  3  4  5 →              │
└──────────────────────────────────────────┘
```

> **Behind the scenes**:
> - Matches, teams and stadiums are all resolved.
> - `mapMatchesToCards(matches, teamsById, stadiumsById)` produces `MatchCardProps[]`.
> - `MatchCardList` receives the current 20 items with `pageSize={20}` (internal pagination hidden).
> - External MUI `Pagination` shows `totalPages` from the API response; user clicking a page number updates `page` state → new `GET /matches?page=N&limit=20` request.

---

### Story 2 — Network error or empty result

**Persona**: Priya — developer testing the app with the catalog-service offline.

**Step 1 — Error state**

```
┌──────────────────────────────────────────┐
│           [ Globe animation ]            │
├──────────────────────────────────────────┤
│  Matches                                 │
│  ┌──────────────────────────────────┐    │
│  │  ⚠ Failed to load matches.       │    │
│  │     Please try again later.      │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

> **Behind the scenes**: RTK Query's `isError` flag is truthy. The error message is displayed instead of the list. Teams/stadiums errors are silently swallowed (they only affect enrichment — if unavailable, team names fall back to ID substrings and flags to empty string).

**Empty state** (catalog-service running but no matches seeded):

```
┌──────────────────────────────────────────┐
│  Matches                                 │
│  ┌──────────────────────────────────┐    │
│  │     No matches found             │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

> **Behind the scenes**: `PaginatedResponse.data` is empty. `MatchCardList`'s `emptyMessage` prop renders the fallback text.

---

## Architecture

### Constraint: No MUI in `web-app`

`web-app` does **not** have `@mui/material` as a direct dependency. All MUI usage is confined to `@futbalo/ui`. This means pagination controls must be surfaced through `@futbalo/ui` — not imported directly in `MatchesSection`.

### Affected files

```
packages/ui/src/components/MatchCardList/
└── MatchCardList.tsx              # UPDATED — add controlled/external pagination mode

apps/web-app/src/
├── store/
│   └── api/
│       └── catalogApi.ts          # EXISTS — RTK Query slice; already has getMatches endpoint
├── components/
│   └── MatchesSection.tsx         # EXISTS — wire page state to API + pass controlled props
```

### Updated files

- `src/App.tsx` — already renders `<MatchesSection />`; currently has commented-out GlobeWrapper wrapper
- `packages/ui/src/components/MatchCardList/MatchCardList.tsx` — add optional controlled pagination props

### Data flow

```
MatchesSection (manages page state: useState<number>(1))
  ├── useGetMatchesQuery({ page, limit: 20 })   → PaginatedResponse<Match>
  ├── useGetTeamsQuery()                         → Team[]
  ├── useGetStadiumsQuery()                      → Stadium[]
  ├── useGetStagesQuery()                        → Stage[]
  ├── mapMatchesToCards(matches, teamsById, stadiumsById, stagesById) → MatchCardProps[]
  └── MatchCardList
        items={cards}
        pageSize={20}                            ← equal to limit; hides internal pagination
        controlledPage={page}                    ← NEW controlled prop
        totalPages={matchesResponse.totalPages}  ← NEW controlled prop
        onPageChange={setPage}                   ← NEW controlled prop
```

When `controlledPage` is provided, `MatchCardList` skips its internal `useState` and slice logic — it renders all passed items as-is and delegates pagination UI to the external `totalPages` / `onPageChange` props.

### `MatchCardList` — controlled mode extension

New optional props added to `MatchCardListProps`:

```ts
export interface MatchCardListProps {
  items: MatchCardProps[];
  pageSize?: number;
  emptyMessage?: string;
  // Controlled (external) pagination — when provided, internal page state is bypassed
  controlledPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}
```

Behaviour:
- If `controlledPage` is `undefined` → existing internal pagination behaviour (no breaking change).
- If `controlledPage` is a number → render `items` as-is (no slicing), render MUI `Pagination` with `count={totalPages}` and `onChange` wired to `onPageChange`.

### `mapMatchesToCards` — join logic

Four data sources: matches, teams, stadiums, **stages** (not in original spec).

```ts
function mapMatchesToCards(
  matches: Match[],
  teamsById: Record<string, Team>,
  stadiumsById: Record<string, Stadium>,
  stagesById: Record<string, Stage>,
): MatchCardProps[] {
  return matches.map((m) => {
    const homeTeam = m.homeTeamId ? teamsById[m.homeTeamId] : undefined;
    const awayTeam = m.awayTeamId ? teamsById[m.awayTeamId] : undefined;
    const stadium = stadiumsById[m.stadiumId];
    const timezone = getStadiumTimezone(stadium);
    const kickoff = m.kickoffAt ? new Date(m.kickoffAt) : null;

    return {
      homeTeam: { name: homeTeam?.name ?? m.homePlaceholder ?? 'TBD', code: homeTeam?.fifaCode ?? '???', flagUrl: homeTeam?.flagUrl ?? '' },
      awayTeam: { name: awayTeam?.name ?? m.awayPlaceholder ?? 'TBD', code: awayTeam?.fifaCode ?? '???', flagUrl: awayTeam?.flagUrl ?? '' },
      date: kickoff ? kickoff.toLocaleDateString('en-GB', { timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD',
      time: kickoff ? kickoff.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }) : '--:--',
      timezone,
      venue: stadium ? `${stadium.name}, ${stadium.city}` : 'TBD',
      competition: stagesById[m.stageId]?.name ?? 'Unknown Stage',
      status: mapStatus(m.status),
    };
  });
}
```

### Timezone mapping

Stadium `timezone` field stores UTC-offset strings (`"UTC-8"`, `"UTC-7"`, etc.). These must be mapped to IANA timezone identifiers for `toLocaleDateString`/`toLocaleTimeString`:

```ts
const TIMEZONE_MAP: Record<string, string> = {
  'UTC-8': 'America/Los_Angeles',
  'UTC-7': 'America/Denver',
  'UTC-6': 'America/Chicago',
  'UTC-5': 'America/New_York',
};
function getStadiumTimezone(stadium: Stadium | undefined): string {
  if (!stadium) return 'UTC';
  return TIMEZONE_MAP[stadium.timezone] ?? 'UTC';
}
```

### Status mapping

| API `MatchStatus` | MatchCard `MatchStatus` |
|---|---|
| `SCHEDULED` | `"upcoming"` |
| `LIVE` | `"live"` |
| `FINISHED` | `"finished"` |
| `CANCELLED` | `"upcoming"` |
| `POSTPONED` | `"upcoming"` |

---

## API Contracts

All endpoints on `catalog-service` (base URL: `VITE_CATALOG_BASE_URL`). No auth required.

### `GET /matches?page={n}&limit=20`

Used by `useGetMatchesQuery`. Returns `PaginatedResponse<Match>` (see SPEC-010).

**Query params used:**

| Param | Value |
|---|---|
| `page` | Current page (1-indexed, from component state) |
| `limit` | `20` (fixed) |

---

### `GET /teams`

Used by `useGetTeamsQuery`. Returns `Team[]` (see SPEC-002).

**Caching:** RTK Query caches this for the duration of the session — no re-fetch on page change.

---

### `GET /stadiums`

Used by `useGetStadiumsQuery`. Returns `Stadium[]` (see SPEC-005).

**Caching:** Same as teams — single fetch, cached.

---

### `GET /stages`

Used by `useGetStagesQuery`. Returns `Stage[]`.

**Caching:** Same as teams/stadiums — single fetch, cached. Used to derive the `competition` label per match card.

---

## UI/UX

### `MatchesSection` structure

No direct MUI imports — pagination is surfaced through `MatchCardList`'s controlled props:

```tsx
const [page, setPage] = useState(1);
const { data: matchesResponse, isLoading, isError } = useGetMatchesQuery({ page, limit: 20 });
const totalPages = matchesResponse?.totalPages ?? 1;

// ...enrich cards...

<section style={{ padding: '24px 16px', maxWidth: 700 }}>
  <h2 style={{ fontSize: '1.5rem', marginBottom: 16, fontWeight: 600 }}>Matches</h2>

  {isLoading && <p style={{ textAlign: 'center', color: '#666', padding: '32px 0' }}>Loading matches…</p>}

  {isError && <p style={{ textAlign: 'center', color: '#d32f2f', padding: '32px 0' }}>
    Failed to load matches. Please try again later.
  </p>}

  {!isLoading && !isError && (
    <MatchCardList
      items={cards}
      pageSize={20}
      emptyMessage="No matches found"
      controlledPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  )}
</section>
```

> **Why `pageSize={20}` still passed**: Keeps the prop consistent in case `controlledPage` is not provided (e.g. in tests with static data). When `controlledPage` is set, `MatchCardList` ignores slicing and uses `totalPages` from the API.

### `MatchCardList` controlled mode rendering

```tsx
// In MatchCardList.tsx — controlled branch:
const isControlled = controlledPage !== undefined;

const displayItems = isControlled ? items : items.slice((page - 1) * pageSize, page * pageSize);
const currentPage = isControlled ? controlledPage : page;
const pageCount = isControlled ? (totalPages ?? 1) : Math.ceil(items.length / pageSize);
function handleChange(_: React.ChangeEvent<unknown>, value: number) {
  isControlled ? onPageChange?.(value) : setPage(value);
}
```

### Loading states

| State | Behaviour |
|---|---|
| Matches loading | Plain `<p>` loading text shown |
| Matches loaded, teams/stadiums/stages still loading | Show cards with `name: "TBD"`, `flagUrl: ""` — lookups degrade gracefully |
| All loaded | Full cards with flags, venue, timezone, stage name |
| Matches error | Plain `<p>` error message shown |
| Teams/stadiums/stages error | Silently degrade — show TBD placeholders |

---

## Configuration

### New environment variable

| Variable | Description | Example |
|---|---|---|
| `VITE_CATALOG_BASE_URL` | Base URL for catalog-service | `https://catalog.futbalo.eu` |

**Add to `.env.example`** (repo root):
```dotenv
# Catalog Service
VITE_CATALOG_BASE_URL=https://catalog.futbalo.eu
```

**Local dev** (`.env.local` in `apps/web-app/` or repo root):
```dotenv
VITE_CATALOG_BASE_URL=http://localhost:4001
```

---

## Changelog

### 2026-06-08
- Corrected Architecture: no direct MUI in `web-app`; pagination must go through `MatchCardList` controlled props.
- Added `MatchCardList` controlled mode extension (`controlledPage`, `totalPages`, `onPageChange`).
- Added stages enrichment (4th data source); updated `mapMatchesToCards` signature.
- Added timezone mapping (`TIMEZONE_MAP`) — stadium stores UTC-offset strings, not IANA identifiers.
- Corrected loading/error states to plain HTML (no MUI `CircularProgress`/`Alert` in `web-app`).
- Documented `GET /stages` endpoint usage.

### 2026-06-03
- Initial specification: home page match list using catalog-service + MatchCardList.

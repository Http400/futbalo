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

### New files in `apps/web-app/src/`

```
apps/web-app/src/
├── store/
│   └── api/
│       └── catalogApi.ts          # NEW — RTK Query slice for catalog-service
├── components/
│   └── MatchesSection.tsx         # NEW — container: fetches + joins + renders list
```

### Updated files

- `src/store/store.ts` — register `catalogApi` reducer + middleware
- `src/App.tsx` — render `<MatchesSection />` below `<GlobeWrapper />`; change `main` from `overflow: hidden` / `position: fixed` to scrollable

### Data flow

```
App.tsx
  └── main (scrollable)
        ├── GlobeWrapper          (existing, height: 100vh)
        └── MatchesSection
              ├── useGetMatchesQuery({ page, limit: 20 })   → PaginatedResponse<Match>
              ├── useGetTeamsQuery()                         → Team[]
              ├── useGetStadiumsQuery()                      → Stadium[]
              ├── mapMatchesToCards(matches, teamsById, stadiumsById) → MatchCardProps[]
              ├── MatchCardList items={cards} pageSize={20}
              └── MUI Pagination count={totalPages} page={page} onChange={setPage}
```

### `mapMatchesToCards` — join logic

```ts
function mapMatchesToCards(
  matches: Match[],
  teamsById: Record<string, Team>,
  stadiumsById: Record<string, Stadium>,
): MatchCardProps[] {
  return matches.map((m) => {
    const homeTeam = m.homeTeamId ? teamsById[m.homeTeamId] : undefined;
    const awayTeam = m.awayTeamId ? teamsById[m.awayTeamId] : undefined;
    const stadium = m.stadiumId ? stadiumsById[m.stadiumId] : undefined;

    const kickoff = m.kickoffAt ? new Date(m.kickoffAt) : null;
    const timezone = stadium?.timezone ?? 'UTC';

    return {
      homeTeam: {
        name: homeTeam?.name ?? m.homePlaceholder ?? 'TBD',
        code: homeTeam?.fifaCode ?? '???',
        flagUrl: homeTeam?.flagUrl ?? '',
      },
      awayTeam: {
        name: awayTeam?.name ?? m.awayPlaceholder ?? 'TBD',
        code: awayTeam?.fifaCode ?? '???',
        flagUrl: awayTeam?.flagUrl ?? '',
      },
      date: kickoff
        ? kickoff.toLocaleDateString('en-GB', { timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric' })
        : 'TBD',
      time: kickoff
        ? kickoff.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
        : '--:--',
      timezone,
      venue: stadium ? `${stadium.name}, ${stadium.city}` : 'TBD',
      competition: 'FIFA World Cup 2026',
      status: mapStatus(m.status),
    };
  });
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

## UI/UX

### Layout change in `App.tsx`

The `<main>` element currently has `overflow: hidden` and `position: fixed` to keep the globe viewport-locked. After this change:

- Remove `position: fixed` and `overflow: hidden`
- The globe section (`GlobeWrapper`) retains `height: 100vh`
- `MatchesSection` follows below, naturally pushing the page height

### `MatchesSection` structure

```
<section style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
  <Typography variant="h5" gutterBottom>Matches</Typography>

  {/* Loading state */}
  {isLoading && <CircularProgress />}

  {/* Error state */}
  {isError && <Alert severity="error">Failed to load matches. Please try again later.</Alert>}

  {/* Content */}
  {!isLoading && !isError && (
    <>
      <MatchCardList items={cards} pageSize={20} emptyMessage="No matches found" />
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, v) => setPage(v)}
          color="primary"
          sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
        />
      )}
    </>
  )}
</section>
```

> **Note:** `MatchCardList` is given `pageSize={20}` (equal to `limit`) so its internal pagination always shows a single page with no internal `Pagination` rendered. Navigation is handled externally.

### Loading states

| State | Behaviour |
|---|---|
| Matches loading | `CircularProgress` shown |
| Matches loaded, teams/stadiums still loading | Show cards with `name: "TBD"`, `flagUrl: ""` — teams/stadiums RTK cache usually resolves quickly |
| All loaded | Full cards with flags, venue, timezone |
| Matches error | `Alert` error message |
| Teams/stadiums error | Silently degrade — show TBD placeholders instead of names/flags |

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

### 2026-06-03
- Initial specification: home page match list using catalog-service + MatchCardList.

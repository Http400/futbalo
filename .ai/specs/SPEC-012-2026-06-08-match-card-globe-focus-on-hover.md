# SPEC-012 — Match Card Hover → Globe Focus

## Overview

When a user hovers over a `MatchCard` in the home page `MatchCardList`, the Globe animates to bring the corresponding stadium's geographic location to the center of view. When the mouse leaves the card, the Globe returns to idle (no `focusPoint`).

**Key decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| Stadium coordinates source | Parse `Stadium.coords: string \| null` from `@futbalo/types` | Avoids DB schema change; coords already fetched for every match |
| State location | `useState` lifted to `App.tsx` | GlobeWrapper and MatchesSection are siblings — no context/store needed for this simple scalar |
| Hover granularity | `onItemHover(index \| null)` on `MatchCardList` | Clean abstraction; MatchCard stays dumb |
| Focus clear on leave | Yes — mouse-leave resets Globe to idle | Per user decision |
| DMS parsing | Frontend utility `parseDmsCoords()` in `MatchesSection` | Self-contained, no new dependency |
| autoRotate | Already `false` before this spec | GlobeWrapper hardcodes `autoRotate={false}`; this spec does not change that |
| momentary null between cards | Acceptable | When moving mouse directly from card A to card B, there is a brief `focusPoint=null` flash; no debouncing needed |

---

## User Stories

### Story 1 — Visitor hovers over a match to see where it's played

**Persona**: Kamil — a casual football fan browsing the home page on desktop. He's curious where Mexico City is on the globe.

**Step 1 — Home page loaded, Globe rotating**

```
┌────────────────────────────────────────────┐
│         [ Globe — auto-idle, no focus ]    │
│                                            │
├────────────────────────────────────────────┤
│  Matches                                   │
│  ┌──────────────────────────────────────┐  │
│  │ Upcoming · 11 Jun · Mexico City      │  │
│  │ 🇲🇽 Mexico  ——  🇿🇦 South Africa      │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ Upcoming · 12 Jun · Los Angeles      │  │
│  │ ...                                  │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

> **Behind the scenes**: `App.tsx` holds `hoveredCoords: null`. `GlobeWrapper` receives `externalFocusPoint={null}` — Globe uses its default `initialView`.

**Change vs. current state**: No change to the idle state. Globe and MatchCardList already co-exist; only hover triggers a new effect.

---

**Step 2 — Kamil hovers over the Mexico City match**

```
┌────────────────────────────────────────────┐
│    [ Globe — animating to Mexico City ]    │
│                                            │
├────────────────────────────────────────────┤
│  Matches                                   │
│  ┌──────────────────────────────────────┐  │
│  │ Upcoming · 11 Jun · Mexico City   ←hover
│  │ 🇲🇽 Mexico  ——  🇿🇦 South Africa      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

> **Behind the scenes**:
> 1. `MatchCardList` fires `onItemHover(0)` (index of hovered card).
> 2. `MatchesSection.handleItemHover(0)` looks up the match's `stadiumId`, finds the `Stadium` in `stadiumsById`, calls `parseDmsCoords(stadium.coords)` → `{ lat: 19.303, lng: -99.151 }`.
> 3. `MatchesSection` calls `onStadiumFocus({ lat: 19.303, lng: -99.151 })`.
> 4. `App.tsx` sets `hoveredCoords = { lat: 19.303, lng: -99.151 }`.
> 5. `GlobeWrapper` receives `externalFocusPoint={{ lat: 19.303, lng: -99.151 }}`, computes the display focus (applies the existing lat-20 / lng+30 offset) and passes it as `focusPoint` to `<Globe>`.
> 6. Globe's built-in animation brings Mexico City to center.

---

**Step 3 — Kamil moves his mouse off the card**

```
┌────────────────────────────────────────────┐
│      [ Globe — returns to idle / no focus ]│
├────────────────────────────────────────────┤
│  Matches                                   │
│  ┌──────────────────────────────────────┐  │
│  │ Upcoming · 11 Jun · Mexico City      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

> **Behind the scenes**: `MatchCardList` fires `onItemHover(null)`. `MatchesSection` calls `onStadiumFocus(null)`. `App.tsx` sets `hoveredCoords = null`. `GlobeWrapper` passes `focusPoint={null}` to Globe.

---

### Story 2 — Edge cases: missing coords or rapid hover

**Persona**: Priya — developer testing the app with partially seeded data (some stadiums have no `coords` value).

**Step 1 — Hovering a match whose stadium has no coords**

```
┌────────────────────────────────────────────┐
│      [ Globe — stays in idle ]             │
└────────────────────────────────────────────┘
```

> **Behind the scenes**: `parseDmsCoords(undefined)` returns `null`. `onStadiumFocus(null)` is called — Globe receives `focusPoint={null}` and stays idle. No error thrown.

**Step 2 — Rapidly hovering multiple cards**

> **Behind the scenes**: Each `mouseenter` fires `onItemHover(index)` immediately. React state updates are batched, so the Globe only animates to the final settled position. No debouncing is needed at this scale — the Globe's own animation is smooth enough.

**Comparison: hover vs. click (current behavior)**

| | Hover (new) | Click (not implemented) |
|---|---|---|
| Trigger | `mouseenter` on MatchCard | N/A |
| Focus | Stadium's coords → Globe `focusPoint` | — |
| Clear | `mouseleave` → `focusPoint = null` | — |
| UI feedback | Globe animation only (no card highlight) | — |

---

## Architecture

### Affected files

```
packages/ui/src/components/MatchCard/
└── MatchCard.tsx              # ADD onMouseEnter/onMouseLeave props

packages/ui/src/components/MatchCardList/
└── MatchCardList.tsx          # ADD onItemHover prop; wire to each MatchCard

apps/web-app/src/
├── App.tsx                    # LIFT hoveredCoords state; wire MatchesSection ↔ GlobeWrapper
├── components/
│   ├── MatchesSection.tsx     # ADD onStadiumFocus prop + parseDmsCoords + handleItemHover
│   └── GlobeWrapper.tsx       # ADD externalFocusPoint prop; use it when set
```

### Data flow

```
App.tsx
  hoveredCoords: { lat, lng } | null   ← useState

  ├── <MatchesSection
  │     onStadiumFocus={setHoveredCoords}
  │   />
  │     └── <MatchCardList
  │           onItemHover={handleItemHover}   ← resolves index → stadiumId → coords
  │         />
  │           └── <MatchCard
  │                 onMouseEnter={() => onItemHover(index)}
  │                 onMouseLeave={() => onItemHover(null)}
  │               />
  │
  └── <GlobeWrapper
        externalFocusPoint={hoveredCoords}
      />
        └── <Globe
              focusPoint={computedFocusPoint}   ← applies lat-20/lng+30 offset when set
            />
```

### `MatchCard` changes

Add two optional callback props (no breaking change — both optional):

```ts
export interface MatchCardProps {
  // ... existing props ...
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
```

Wire to the root `<Card>`:

```tsx
<Card
  variant="outlined"
  sx={{ borderRadius: 3 }}
  onMouseEnter={onMouseEnter}
  onMouseLeave={onMouseLeave}
>
```

### `MatchCardList` changes

Add one optional prop:

```ts
export interface MatchCardListProps {
  // ... existing props ...
  /** Called with the hovered item index, or null when mouse leaves all items. */
  onItemHover?: (index: number | null) => void;
}
```

Wire in the render loop:

```tsx
{displayItems.map((item, index) => (
  <MatchCard
    key={index}
    {...item}
    onMouseEnter={() => onItemHover?.(index)}
    onMouseLeave={() => onItemHover?.(null)}
  />
))}
```

### `MatchesSection` existing context

`MatchesSection.tsx` currently:
- Fetches data via four RTK Query hooks: `useGetMatchesQuery({ page, limit })`, `useGetTeamsQuery()`, `useGetStadiumsQuery()`, `useGetStagesQuery()`
- `matchesResponse` = the result of `useGetMatchesQuery` (shape: `{ data: Match[]; totalPages: number }`)
- `stadiumsById` = a `Record<string, Stadium>` built from `useGetStadiumsQuery()` results: `for (const s of stadiums ?? []) stadiumsById[s.id] = s`
- `Match.stadiumId: string` (required, non-null) and `Stadium.coords: string | null` are both in `@futbalo/types`

### `MatchCardList` existing context

`MatchCardList.tsx` currently:
- `displayItems` = in controlled mode (`controlledPage !== undefined`): all passed `items` (no slicing); in uncontrolled mode: `items.slice((currentPage - 1) * pageSize, currentPage * pageSize)`
- Cards are rendered as `displayItems.map((item, index) => <MatchCard key={index} {...item} />)`

### `GlobeWrapper` existing context

`GlobeWrapper.tsx` currently has:
- `const GLOBE_SIZE = 1500` — fixed canvas size
- `const SEED_POINTS: GlobePoint[]` — 16 hardcoded WC2026 stadium lat/lng points (preserved by this spec)
- `const [selectedId, setSelectedId] = useState<string | null>(null)` — **to be removed by this spec**
- `const getFocusPoint = (id: string | null): GlobePoint | null` — **to be removed by this spec**
- A commented-out button list UI (already dead code — can be deleted along with `selectedId`)
- `autoRotate={false}` — already set; this spec does not change it
- `initialView={{ lat: 10, lng: -72 }}` — preserved

### `App.tsx` existing context

`App.tsx` currently renders exactly:
```tsx
<main style={{ width: '100%', background: '#ffffff', fontFamily: 'sans-serif' }}>
  <MatchesSection />
  <GlobeWrapper />
</main>
```
No other components, providers, or layout elements exist. Safe to add `useState` and thread props through.

### `MatchesSection` changes

New prop:

```ts
interface MatchesSectionProps {
  onStadiumFocus?: (coords: { lat: number; lng: number } | null) => void;
}
```

New utility (inside `MatchesSection.tsx`):

```ts
/**
 * Parses a DMS coordinate string like "19°18'11\"N 99°09'02\"W" into decimal lat/lng.
 * Returns null if the string is absent or doesn't match the expected format.
 */
function parseDmsCoords(coords: string | undefined | null): { lat: number; lng: number } | null {
  if (!coords) return null;
  const match = coords.match(
    /(\d+)°(\d+)'(\d+(?:\.\d+)?)"([NS])\s+(\d+)°(\d+)'(\d+(?:\.\d+)?)"([EW])/
  );
  if (!match) return null;
  const [, latD, latM, latS, latDir, lngD, lngM, lngS, lngDir] = match;
  const lat =
    (parseInt(latD) + parseInt(latM) / 60 + parseFloat(latS) / 3600) *
    (latDir === 'S' ? -1 : 1);
  const lng =
    (parseInt(lngD) + parseInt(lngM) / 60 + parseFloat(lngS) / 3600) *
    (lngDir === 'W' ? -1 : 1);
  return { lat, lng };
}
```

Hover handler (inside `MatchesSection`):

```ts
function handleItemHover(index: number | null) {
  if (index === null) {
    onStadiumFocus?.(null);
    return;
  }
  const match = matchesResponse?.data[index];
  if (!match) return;
  const stadium = stadiumsById[match.stadiumId];
  const coords = parseDmsCoords(stadium?.coords);
  onStadiumFocus?.(coords);  // null if coords unavailable → Globe stays idle
}
```

Add `onItemHover` to the existing `<MatchCardList>` JSX (all other props unchanged):

```tsx
<MatchCardList
  items={cards}
  pageSize={FETCH_LIMIT}
  emptyMessage="No matches found"
  controlledPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  onItemHover={handleItemHover}   {/* NEW */}
/>
```

### `GlobeWrapper` changes

New prop (replaces the now-removed `selectedId` internal state):

```ts
interface GlobeWrapperProps {
  externalFocusPoint?: { lat: number; lng: number } | null;
}
```

Remove `selectedId` state, `getFocusPoint` function, and the commented-out button list. Replace with `externalFocusPoint`-driven focus:

```ts
export const GlobeWrapper = ({ externalFocusPoint }: GlobeWrapperProps) => {
  const focusPoint = externalFocusPoint
    ? { lat: externalFocusPoint.lat - 20, lng: externalFocusPoint.lng + 30 }
    : null;

  // selectedId / getFocusPoint / button UI can be removed (was commented-out already)

  return (
    <div style={{
        position: 'absolute',
        right: `-${GLOBE_SIZE * 0.45}px`,
        bottom: `-${GLOBE_SIZE * 0.55}px`,
    }}>
      <Globe
        points={SEED_POINTS}
        width={GLOBE_SIZE}
        height={GLOBE_SIZE}
        focusPoint={focusPoint}
        fadeSpeed={0}          {/* preserved from existing code */}
        autoRotate={false}     {/* preserved — this spec does not change it */}
        initialView={{ lat: 10, lng: -72 }}
      />
    </div>
  );
};
```

### `App.tsx` changes

```tsx
import { useState } from 'react';

function App() {
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <main style={{ width: '100%', background: '#ffffff', fontFamily: 'sans-serif' }}>
      <MatchesSection onStadiumFocus={setHoveredCoords} />
      <GlobeWrapper externalFocusPoint={hoveredCoords} />
    </main>
  );
}
```

---

## UI/UX

- No visual change to the MatchCard itself on hover (no border highlight, no elevation change). Globe animation is the sole feedback.
- The Globe's existing `focusPoint` animation (smooth rotation toward target) provides the visual transition.
- The lat-20 / lng+30 offset (already in `GlobeWrapper.getFocusPoint`) is preserved so the stadium appears slightly above-center, matching the current visual style.
- When `focusPoint` is `null` (after mouse-leave), the Globe holds its last rotated position — no `focusPoint` prop means no animation target, so the Globe stays still. It does **not** animate back to `initialView`. "Returns to idle" in the user stories means `focusPoint` is cleared, not that the Globe returns to origin.

---

## Changelog

### 2026-06-08
- Initial specification: match card hover → Globe focus via DMS coord parsing and lifted state.

# SPEC-009 — Globe Component in packages/ui

## Overview

Move the interactive 3-D Earth Globe component from the standalone `map_demo` prototype (`../map_demo/src/components/Globe`) into the shared `packages/ui` library so it can be consumed by `apps/web-app` and `apps/admin-app`. Add Storybook stories covering the main usage scenarios.

The Globe renders a WebGL Earth sphere (day/night/clouds/atmosphere via custom GLSL shaders) using Three.js. It supports:
- Displaying lat/lng points that fade out over time
- Auto-rotation (configurable speed)
- Mouse-drag manual rotation
- Animated focus transitions to a given lat/lng
- HTML labels next to each point with iterative overlap-repulsion
- Responsive sizing (fills container or fixed px dimensions)

## Architecture

### Files to create / modify

```
packages/ui/
  src/
    components/
      Globe/
        Globe.tsx          ← moved from map_demo, no logic changes
        shaders.ts         ← moved from map_demo, no changes
        index.ts           ← re-export Globe + types
        Globe.stories.tsx  ← NEW Storybook stories
    index.ts               ← add Globe exports
  package.json             ← add `three` dependency + `@types/three` devDependency
  vite.config.ts           ← externalize `three` from the library build? NO — three is a regular dep (bundled)
```

> **Note on bundling:** `three` is added as a regular `dependency` (not peerDependency). It will be externalized in the Vite library build via `rollupOptions.external` — same pattern used for `react`/`react-dom` — **only if** the consuming app bundles its own copy. Since the decision is to bundle it into the library, `three` should NOT be added to `rollupOptions.external`.

### Component structure

The Globe component is a single React functional component (`Globe.tsx`) using:
- `useRef` for mutable WebGL state (SceneState)
- `useEffect` for scene setup/teardown, resize handling, focusPoint animation, and point injection
- `useCallback` for stable `computeTargetRot`

All Three.js scene state is held in `stateRef` (never in React state) to avoid re-renders during animation.

### Texture loading

Earth textures are fetched at runtime from the Three.js CDN:
```
https://threejs.org/examples/textures/planets/earth_day_4096.jpg
https://threejs.org/examples/textures/planets/earth_night_4096.jpg
https://threejs.org/examples/textures/planets/earth_bump_roughness_clouds_4096.jpg
```

This is acceptable for a demo/internal tool. No local asset bundling is required.

## API Contracts

### GlobePoint

```typescript
export interface GlobePoint {
  /** Latitude in degrees (-90 to 90) */
  lat: number
  /** Longitude in degrees (-180 to 180) */
  lng: number
  /** Unique identifier to track which points have already been rendered */
  id: string
  /** Label text displayed next to the point. Defaults to `id`. */
  label?: string
}
```

### GlobeProps

```typescript
export interface GlobeProps {
  /** Points to display on the globe */
  points?: GlobePoint[]
  /** Fixed width in px. Defaults to 100% of the container. */
  width?: number
  /** Fixed height in px. Defaults to 100% of the container. */
  height?: number
  /** Automatically rotate the globe. Default: true */
  autoRotate?: boolean
  /** Rotation speed in radians per frame. Default: 0.0005 */
  rotationSpeed?: number
  /** How fast points fade out (lifetime units per second). Default: 0.25 */
  fadeSpeed?: number
  /** When set, the globe animates to bring this lat/lng to the center of the view. */
  focusPoint?: { lat: number; lng: number } | null
  /** Initial lat/lng to center on when the globe first loads (no animation). */
  initialView?: { lat: number; lng: number } | null
  /** Allow the user to manually rotate the globe by dragging. Default: true */
  allowManualRotation?: boolean
}
```

### Public exports (src/index.ts additions)

```typescript
export { default as Globe } from './components/Globe'
export type { GlobePoint, GlobeProps } from './components/Globe'
```

## UI/UX — Storybook Stories

File: `Globe.stories.tsx`

| Story name | What it demonstrates |
|---|---|
| `Default` | Globe with no points, auto-rotating, fills a 600×400 container |
| `WithPoints` | Several lat/lng points pre-loaded (e.g., major cities), showing labels |
| `WithFocusPoint` | Globe focused on a specific city on mount via `initialView` |
| `NoAutoRotate` | `autoRotate={false}`, manual drag only |
| `FixedSize` | `width={400}` `height={400}` fixed pixel dimensions |

Stories use `parameters: { layout: 'fullscreen' }` because the globe needs a real DOM size.

## Configuration

No environment variables or feature flags. The only external dependency introduced is `three`.

**package.json changes:**
```json
"dependencies": {
  "three": "^0.184.0"
},
"devDependencies": {
  "@types/three": "^0.184.1"
}
```

**vite.config.ts:** No change needed — `three` is bundled (not added to `external`).

## Changelog

### 2026-06-08
- Added `allowManualRotation?: boolean` prop (default `true`). When `false`, mouse-drag handlers are disabled and cursor changes to `default`. Implemented via a `useRef` mirror to avoid re-registering the one-time setup effect.

### 2026-05-31
- Initial specification: move Globe component from map_demo prototype to packages/ui and add Storybook stories

# SPEC-010 — Matches Pagination

## Overview

Adds **offset-based pagination** to the `GET /matches` endpoint in `catalog-service`. The endpoint currently returns the entire match list in a single response. With ~104 matches for World Cup 2026 this is manageable today, but pagination is added to:

1. Cap response size for mobile / slow-network consumers.
2. Establish a **reusable pagination pattern** for other `catalog-service` list endpoints (teams, stadiums, stages, groups) that can be adopted without re-speccing each one.

The response shape changes from `ApiResponse<Match[]>` to `PaginatedResponse<Match>`, which is already defined in `@futbalo/types`.

---

## Architecture

### Affected files

```
catalog-service/
├── src/
│   ├── lib/
│   │   └── pagination.ts          # NEW — shared parsePagination() + applyPagination() helpers
│   ├── services/
│   │   └── matches.ts             # Updated — getAllMatches accepts PaginationParams, returns paginated result
│   └── controllers/
│       └── matches.controller.ts  # Updated — parse page/limit from query, return PaginatedResponse
```

### Data flow

```
GET /matches?page=2&limit=20
  └─ controller (matches.controller.ts)
       ├─ parsePagination(req.query)   → { page: 2, limit: 20 }
       └─ matchesService.getAllMatches(filters, pagination)
            ├─ prisma.match.count({ where })   → total
            ├─ prisma.match.findMany({ where, skip, take, orderBy })   → data
            └─ return { data, total, page, limit, totalPages }
  └─ res.json(result satisfies PaginatedResponse<Match>)
```

---

## API Contracts

### `GET /matches` — updated

Returns a paginated list of matches. All existing filter params remain unchanged.

**Query params (complete list):**

| Param | Type | Default | Constraints | Description |
|---|---|---|---|---|
| `page` | integer | `1` | `≥ 1` | Page number (1-indexed) |
| `limit` | integer | `20` | `1–100` | Items per page |
| `competitionId` | string | — | — | Filter by competition |
| `stageId` | string | — | — | Filter by stage |
| `groupId` | string | — | — | Filter by group |
| `teamId` | string | — | — | Filter matches where team is home or away |
| `status` | enum | — | See MatchStatus values | Filter by match status |

**Validation rules:**

- If `page` is provided but not a positive integer → `400` with `"page must be a positive integer"`
- If `limit` is provided but not an integer in `[1, 100]` → `400` with `"limit must be an integer between 1 and 100"`
- Non-numeric strings for `page`/`limit` → `400`

**Response `200`:**
```json
{
  "data": [ /* Match[] */ ],
  "total": 104,
  "page": 2,
  "limit": 20,
  "totalPages": 6
}
```

Shape: `PaginatedResponse<Match>` from `@futbalo/types`.

**Edge cases:**

| Scenario | Behaviour |
|---|---|
| `page` beyond last page | Returns `data: []`, `total` and `totalPages` reflect actual counts |
| `limit=100` with 104 matches | First page returns 100, second page returns 4 |
| No matches match filters | `data: []`, `total: 0`, `totalPages: 0` |

---

## Reusable Pagination Pattern

### `src/lib/pagination.ts`

A small helper module that any controller/service pair can adopt.

```ts
import type { PaginationParams, PaginatedResponse } from '@futbalo/types';

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

/**
 * Parse and validate page/limit from Express query params.
 * Returns validated params or an error string.
 */
export function parsePagination(query: Record<string, unknown>):
  | { ok: true; params: PaginationParams }
  | { ok: false; error: string } {
  const rawPage = query['page'];
  const rawLimit = query['limit'];

  const page = rawPage === undefined ? PAGINATION_DEFAULTS.page : Number(rawPage);
  const limit = rawLimit === undefined ? PAGINATION_DEFAULTS.limit : Number(rawLimit);

  if (!Number.isInteger(page) || page < 1) {
    return { ok: false, error: 'page must be a positive integer' };
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > PAGINATION_DEFAULTS.maxLimit) {
    return { ok: false, error: `limit must be an integer between 1 and ${PAGINATION_DEFAULTS.maxLimit}` };
  }

  return { ok: true, params: { page, limit } };
}

/**
 * Build a PaginatedResponse from raw data + total count.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
```

### Service layer pattern

Any service function that returns a list adds an optional `pagination` param:

```ts
export async function getAllMatches(
  filters: MatchFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 },
) {
  const where = buildWhereClause(filters);
  const skip = (pagination.page - 1) * pagination.limit;

  const [total, data] = await Promise.all([
    prisma.match.count({ where }),
    prisma.match.findMany({ where, skip, take: pagination.limit, orderBy: { kickoffAt: 'asc' } }),
  ]);

  return { data, total };
}
```

### Controller layer pattern

```ts
const parsed = parsePagination(req.query);
if (!parsed.ok) {
  res.status(400).json({ message: parsed.error, code: 'CATALOG_400', statusCode: 400 } satisfies ApiError);
  return;
}

const { data, total } = await matchesService.getAllMatches(filters, parsed.params);
res.json(buildPaginatedResponse(data, total, parsed.params) satisfies PaginatedResponse<Match>);
```

### Adopting this pattern in other list endpoints

To add pagination to another endpoint (e.g. `GET /teams`):

1. Import `parsePagination` and `buildPaginatedResponse` from `../lib/pagination.js`.
2. Add `pagination: PaginationParams` param to the service function; use `skip`/`take` in `findMany`, run `count` in parallel.
3. In the controller, call `parsePagination(req.query)` before calling the service.
4. Return `buildPaginatedResponse(data, total, pagination)`.

No changes to `@futbalo/types` are needed — `PaginatedResponse<T>` and `PaginationParams` already exist.

---

## Changelog

### 2026-06-03
- Initial specification: offset-based pagination for GET /matches with reusable helper pattern.

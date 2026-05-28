# API Response Format

All API responses use the shared types from `@futbalo/types`.

## Success Response

```ts
import type { ApiResponse } from '@futbalo/types';

// shape: { data: T, message?: string }
res.json({ data: user } satisfies ApiResponse<User>);
res.json({ data: tokens, message: 'Login successful' } satisfies ApiResponse<AuthTokens>);
```

## Error Response

```ts
import type { ApiError } from '@futbalo/types';

// shape: { message: string, code: string, statusCode: number }
res.status(401).json({
  message: 'Invalid credentials',
  code: 'AUTH_001',
  statusCode: 401,
} satisfies ApiError);
```

## Paginated Response

```ts
import type { PaginatedResponse } from '@futbalo/types';

// shape: { data: T[], total, page, limit, totalPages }
res.json({ data: users, total, page, limit, totalPages } satisfies PaginatedResponse<User>);
```

## Rules

- Never return raw data without the wrapper
- Error codes format: `AREA_NNN` (e.g. `AUTH_001`, `DB_001`, `VAL_001`)
- Health check endpoints are exempt — they use `{ status: 'ok', service: '...' }`

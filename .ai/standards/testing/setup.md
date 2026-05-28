# Testing Setup

## Frontend Apps (`apps/`)

Uses Vitest + `@testing-library/react` with `jsdom` environment.

Config in `vite.config.ts`:
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test-setup.ts'],
},
```

`src/test-setup.ts` must import jest-dom matchers:
```ts
import '@testing-library/jest-dom';
```

Test file pattern: `src/**/*.test.{ts,tsx}`

## Backend Services (`services/`)

Uses Vitest with `node` environment.

Config in `vitest.config.ts`:
```ts
test: {
  environment: 'node',
  globals: true,
},
```

No `setupFiles` needed.

## Test File Conventions

```ts
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('does the thing', () => {
    render(<ComponentName />);
    expect(screen.getByRole('heading', { name: /text/i })).toBeInTheDocument();
  });
});
```

- Use `describe` + `it` (not `test`)
- Use `getByRole` queries preferentially (accessibility-first)
- `@typescript-eslint/no-explicit-any` is disabled in test files — allowed only in tests

## Running Tests

```
pnpm test                                        # all packages
pnpm --filter @futbalo/<name> test               # single package
```

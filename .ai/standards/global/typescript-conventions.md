# TypeScript Conventions

## Environment Variables

Always use bracket notation — never dot notation:

```ts
// ✅ correct
const port = process.env['PORT'] ?? 4000;

// ❌ wrong
const port = process.env.PORT ?? 4000;
```

Always provide a fallback with `??` for optional vars.

## ESM Imports in Services

Backend (services/) uses ESM — always include `.js` extension in relative imports:

```ts
// ✅ correct
import { app } from './app.js';
import { prisma } from './db.js';

// ❌ wrong
import { app } from './app';
```

Frontend apps and packages do NOT need `.js` extensions (Vite handles resolution).

## No `any` in Production Code

`@typescript-eslint/no-explicit-any` is off only in test files. Never use `any` in source code.

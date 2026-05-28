# AuthForm Component — M-size Task

## Problem

Add a reusable `AuthForm` component to `packages/ui` that supports two modes (`signIn` / `signUp`) with built-in validation, tests, and Storybook stories.

## Approach

Follow the existing `Button` component pattern (MUI wrappers, named exports, index barrel, autodocs stories). The component manages its own controlled form state and validation. Types (`SignInData`, `SignUpData`) are defined and exported from the component package.

## Reference Module

`packages/ui/src/components/Button/` — same folder structure:
- `ComponentName.tsx`
- `ComponentName.stories.tsx`
- `index.ts`

## Component API

```ts
export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  name: string;
  password: string;
  // confirmPassword is validated internally but NOT included in onSubmit data
}

export interface AuthFormProps {
  mode: 'signIn' | 'signUp';
  onSubmit: (data: SignInData | SignUpData) => void;
  isLoading?: boolean;
  error?: string;
}
```

## Built-in Validations

- All fields: required
- email: basic format check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- password: min 8 characters
- confirmPassword (signUp only): must match password

## Files to Create / Update

| File | Action |
|------|--------|
| `packages/ui/src/components/AuthForm/AuthForm.tsx` | Create |
| `packages/ui/src/components/AuthForm/AuthForm.test.tsx` | Create |
| `packages/ui/src/components/AuthForm/AuthForm.stories.tsx` | Create |
| `packages/ui/src/components/AuthForm/index.ts` | Create |
| `packages/ui/src/index.ts` | Update (add AuthForm exports) |

## Standards to Inject

- `ui/component-pattern`
- `testing/setup`

## Tasks

1. Inject standards (blocks all others)
2. Create AuthForm.tsx — component with mode switching and validation
3. Create index.ts — barrel export
4. Update src/index.ts — add to package exports
5. Create AuthForm.test.tsx — unit tests
6. Create AuthForm.stories.tsx — Storybook stories
7. Verify standards
8. Build package

## Implementation Checklist

- [x] Inject standards
- [x] Create AuthForm.tsx
- [x] Create AuthForm/index.ts
- [x] Update packages/ui/src/index.ts
- [x] Create AuthForm.test.tsx
- [x] Create AuthForm.stories.tsx
- [x] Verify standards
- [x] Build package

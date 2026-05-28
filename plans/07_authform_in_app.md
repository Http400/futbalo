# Plan: Integrate AuthForm into web-app App.tsx

## Problem

`App.tsx` currently renders a static placeholder (heading + Button) with no auth awareness.
The Redux store already has `authSlice` (`isAuthenticated`, `accessToken`, `refreshToken`) and
`authApi` (`useLoginMutation`, `useRegisterMutation`). The `@futbalo/ui` package already exports
a fully-built `AuthForm`. This task wires them together.

## Approach

Modify `App.tsx` to:
- Select `isAuthenticated` from Redux (`useAppSelector`)
- Hold local `mode: 'signIn' | 'signUp'` state, defaulting to `'signIn'`
- Dispatch `useLoginMutation` on signIn submit and `useRegisterMutation` on signUp submit
- Render `AuthForm` when not authenticated; the main app content when authenticated
- Render a mode toggle link below the form

Update `App.test.tsx` to:
- Wrap renders in Redux `Provider` (store already set up in `main.tsx`)
- Test: unauthenticated → AuthForm is shown
- Test: authenticated → heading is shown, AuthForm is not

---

## Current State

| File | Current state |
|---|---|
| `apps/web-app/src/App.tsx` | Static heading + Button, no Redux usage |
| `apps/web-app/src/App.test.tsx` | Single test — heading visible, no Provider wrap |
| `apps/web-app/src/store/slices/authSlice.ts` | `isAuthenticated`, `logout`, `setTokens` |
| `apps/web-app/src/store/api/authApi.ts` | `useLoginMutation`, `useRegisterMutation` |
| `packages/ui/src/components/AuthForm/AuthForm.tsx` | `AuthForm` with `mode`, `onSubmit`, `isLoading`, `error` props |

---

## Tasks

1. **Inject standards** — `ui/component-pattern`, `testing/setup`
2. **Update `App.tsx`** — auth-aware rendering with AuthForm + mode toggle
3. **Update `App.test.tsx`** — Provider wrapper + new test cases for auth states

---

## Implementation Detail

### `App.tsx` logic

```tsx
const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
const [login, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation();
const [register, { isLoading: isRegisterLoading, error: registerError }] = useRegisterMutation();

function handleSubmit(data: SignInData | SignUpData) {
  if (mode === 'signIn') {
    login(data as SignInData);
  } else {
    register(data as SignUpData);
  }
}
```

- Render when `!isAuthenticated`: `<AuthForm mode={mode} onSubmit={handleSubmit} isLoading={...} error={...} />` + toggle link
- Render when `isAuthenticated`: `<h1>Welcome to Futbalo</h1>`

### `App.test.tsx` cases

- Default render (not authenticated) → form visible (`getByRole('form')` or query by heading "Sign in")
- With pre-loaded authenticated state → heading "Welcome to Futbalo" visible, form absent

---

## Implementation Checklist

- [ ] Inject standards
- [ ] Update `App.tsx`
- [ ] Update `App.test.tsx`

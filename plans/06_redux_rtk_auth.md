# Redux + RTK Query Auth — M-size Task

## Problem

The `web-app` has no global state management. We need to add Redux Toolkit with RTK Query to handle sign-in and sign-up flows, calling the `auth-service` endpoints and persisting the resulting tokens in the store.

## Approach

1. Install `@reduxjs/toolkit` (2.12.0) and `react-redux` (9.3.0) in `apps/web-app`.
2. Add a Vite dev proxy so the frontend can call `/api/*` → `http://localhost:4000` without CORS issues in development.
3. Create a typed Redux store with a single RTK Query API slice for auth + an `authSlice` that stores tokens and `isAuthenticated`.
4. Wrap `main.tsx` with `<Provider>`.

## Auth Service API Contract

Base path (via vite proxy): `/api`

| Method | Path              | Body                              | Success response                            |
|--------|-------------------|-----------------------------------|---------------------------------------------|
| POST   | `/auth/register`  | `{ email, name, password }`       | `ApiResponse<AuthTokens>` (201)             |
| POST   | `/auth/login`     | `{ email, password }`             | `ApiResponse<AuthTokens>` (200)             |
| POST   | `/auth/refresh`   | `{ refreshToken }`                | `ApiResponse<{ accessToken: string }>` (200)|

Types (`AuthTokens`, `ApiResponse`, `ApiError`) come from `@futbalo/types`.

## Reference Module

No analogous module in `web-app` yet (it's a greenfield store). Standard Redux Toolkit patterns apply.

## File Map

| File | Action |
|------|--------|
| `apps/web-app/vite.config.ts` | Update — add `server.proxy` for `/api` |
| `apps/web-app/package.json` | Update — add `@reduxjs/toolkit`, `react-redux` dependencies |
| `apps/web-app/src/store/store.ts` | Create — `configureStore`, export `RootState`, `AppDispatch` |
| `apps/web-app/src/store/hooks.ts` | Create — typed `useAppDispatch`, `useAppSelector` |
| `apps/web-app/src/store/api/authApi.ts` | Create — RTK Query `createApi` with `register`, `login`, `refresh` mutations |
| `apps/web-app/src/store/slices/authSlice.ts` | Create — `AuthState` slice (tokens + `isAuthenticated`), responds to `authApi` fulfilled actions |
| `apps/web-app/src/main.tsx` | Update — wrap tree with `<Provider store={store}>` |

## Store Design

### authApi (RTK Query)

```ts
// baseUrl points at the vite proxy
const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (build) => ({
    register: build.mutation<ApiResponse<AuthTokens>, RegisterRequest>({ ... }),
    login:    build.mutation<ApiResponse<AuthTokens>, LoginRequest>({ ... }),
    refresh:  build.mutation<ApiResponse<{ accessToken: string }>, { refreshToken: string }>({ ... }),
  }),
});
```

`RegisterRequest` is defined locally in `authApi.ts` since `@futbalo/types` exports `LoginRequest` but not a register type:
```ts
interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}
```

### authSlice

```ts
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
```

- Responds to `authApi.endpoints.register.matchFulfilled` and `authApi.endpoints.login.matchFulfilled` to store both tokens and set `isAuthenticated: true`.
- Responds to `authApi.endpoints.refresh.matchFulfilled` to update `accessToken`.
- `logout` action clears all state.

### store.ts

```ts
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Standards to Inject

- `global/typescript-conventions` — env vars, ESM imports
- `api/response-format` — `ApiResponse<T>` / `ApiError` wrappers

## Tasks

1. Inject standards (blocks all others)
2. Install packages — `pnpm --filter @futbalo/web-app add @reduxjs/toolkit react-redux`
3. Update `vite.config.ts` — add `/api` proxy
4. Create `src/store/api/authApi.ts` — RTK Query slice
5. Create `src/store/slices/authSlice.ts` — auth state + extra reducers
6. Create `src/store/store.ts` — configure store
7. Create `src/store/hooks.ts` — typed hooks
8. Update `src/main.tsx` — wrap with `<Provider>`
9. Verify standards
10. Build `web-app`

## Implementation Checklist

- [x] Inject standards
- [x] Install packages
- [x] Update vite.config.ts
- [x] Create authApi.ts
- [x] Create authSlice.ts
- [x] Create store.ts
- [x] Create hooks.ts
- [x] Update main.tsx
- [x] Verify standards
- [x] Build web-app

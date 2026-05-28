import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './store/api/authApi';
import authReducer from './store/slices/authSlice';
import App from './App';

function makeStore(isAuthenticated = false) {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware),
    preloadedState: {
      auth: {
        isAuthenticated,
        accessToken: isAuthenticated ? 'token' : null,
        refreshToken: isAuthenticated ? 'refresh' : null,
        name: isAuthenticated ? 'Test User' : null,
      },
    },
  });
}

function renderWithStore(isAuthenticated = false) {
  return render(
    <Provider store={makeStore(isAuthenticated)}>
      <App />
    </Provider>
  );
}

describe('App', () => {
  it('shows AuthForm when not authenticated', () => {
    renderWithStore(false);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows mode toggle link when not authenticated', () => {
    renderWithStore(false);
    expect(screen.getByRole('button', { name: /don't have an account/i })).toBeInTheDocument();
  });

  it('renders welcome heading when authenticated', () => {
    renderWithStore(true);
    expect(screen.getByRole('heading', { name: /welcome to futbalo/i })).toBeInTheDocument();
  });

  it('does not show AuthForm when authenticated', () => {
    renderWithStore(true);
    expect(screen.queryByRole('heading', { name: /sign in/i })).not.toBeInTheDocument();
  });
});

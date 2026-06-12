import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './store/api/authApi';
import { catalogApi } from './store/api/catalogApi';
import authReducer from './store/slices/authSlice';
import configReducer from './store/slices/configSlice';
import App from './App';

vi.mock('./components/GlobeWrapper', () => ({
  GlobeWrapper: () => <div data-testid="globe-wrapper" />,
}));

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      config: configReducer,
      [authApi.reducerPath]: authApi.reducer,
      [catalogApi.reducerPath]: catalogApi.reducer,
    },
    preloadedState: { config: { apiBaseUrl: '/api' } },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, catalogApi.middleware),
  });
}

function renderApp() {
  return render(
    <Provider store={makeStore()}>
      <App />
    </Provider>
  );
}

describe('App', () => {
  it('renders the globe wrapper', () => {
    renderApp();
    expect(screen.getByTestId('globe-wrapper')).toBeInTheDocument();
  });

  it('renders the matches section heading', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /matches/i })).toBeInTheDocument();
  });

  it('shows loading state while matches are being fetched', () => {
    renderApp();
    expect(screen.getByText(/loading matches/i)).toBeInTheDocument();
  });

  it('does not show the auth form', () => {
    renderApp();
    expect(screen.queryByRole('heading', { name: /sign in/i })).not.toBeInTheDocument();
  });
});

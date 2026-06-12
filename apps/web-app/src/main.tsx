import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { setConfig } from './store/slices/configSlice';
import App from './App';

async function bootstrap() {
  const response = await fetch('/config', { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Failed to load runtime config: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { apiBaseUrl?: unknown };
  if (typeof data.apiBaseUrl !== 'string' || data.apiBaseUrl.length === 0) {
    throw new Error('Runtime config is missing a valid "apiBaseUrl"');
  }

  store.dispatch(setConfig({ apiBaseUrl: data.apiBaseUrl }));

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element not found');

  createRoot(rootEl).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  );
}

void bootstrap();

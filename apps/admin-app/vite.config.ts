import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

function devConfigEndpoint(): Plugin {
  return {
    name: 'dev-config-endpoint',
    configureServer(server) {
      server.middlewares.use('/config', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ apiBaseUrl: '/api' }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devConfigEndpoint()],
  server: {
    port: 3001,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});

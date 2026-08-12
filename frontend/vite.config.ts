/// <reference types="vitest/config" />
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon

// Create a plain object snapshot of env vars to avoid Vite 6 Proxy cloning issues
// in Vitest browser mode (Storybook tests). See:
// https://github.com/storybookjs/storybook/issues/29408
const createEnvSnapshot = () => {
  const entries: string[] = [];
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('VITE_')) {
      const value = JSON.stringify(process.env[key]);
      entries.push(`${key}: ${value}`);
    }
  }
  return `{ ${entries.join(', ')} }`;
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: './',
  // Replace Vite's Proxy-based import.meta.env with a plain object to prevent
  // "Dynamic access of import.meta.env is not supported" errors in Storybook/Vitest browser tests.
  define: {
    'import.meta.env': createEnvSnapshot()
  },
  server: {
    port: 5173
  },
    test: {
      reporters: ['verbose'],
      projects: [{
      extends: true,
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test-setup.ts'],
        exclude: ['**/*.e2e.test.ts', 'node_modules/**'],
        // Run files sequentially — backendConnector integration tests share
        // a single Supabase DB instance and use afterAll to restore state.
        fileParallelism: false,
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
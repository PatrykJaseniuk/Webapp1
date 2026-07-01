import { defineConfig, devices } from '@playwright/test';

// ═══════════════════════════════════════════════════════════
// Playwright E2E Configuration
// ═══════════════════════════════════════════════════════════
//
// Prerequisites:
//   1. supabase start    (from backend/supabase/)
//   2. npm run dev        (starts Vite dev server on :5173)
//   3. Seed a test user via Supabase dashboard or API:
//        email: test@example.com
//        password: password123
//
// Then run: npx playwright test
// ═══════════════════════════════════════════════════════════

export default defineConfig({
  // Single-page e2e tests live next to page components in src/pages/.
  // Multi-page e2e flows go in ./e2e/ — add that dir when needed.
  testDir: './src',
  testMatch: '**/*.e2e.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
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
  testDir: './e2e',
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
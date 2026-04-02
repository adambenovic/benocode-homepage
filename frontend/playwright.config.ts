// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_STATE_FILE = path.join(__dirname, 'e2e/.auth/admin.json');

export default defineConfig({
  testDir: './e2e',
  // Exclude setup scripts from being run as regular tests
  testIgnore: ['**/setup/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    // ── Setup: login and save browser state ────────────────────────────────
    {
      name: 'setup',
      testMatch: /setup\/auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Public pages: no auth required ─────────────────────────────────────
    {
      name: 'public-chromium',
      testDir: './e2e/public',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'public-firefox',
      testDir: './e2e/public',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'public-mobile',
      testDir: './e2e/public',
      use: { ...devices['Mobile Chrome'] },
    },

    // ── Admin: unauthenticated access tests ────────────────────────────────
    {
      name: 'admin-unauth',
      testDir: './e2e/admin',
      testMatch: /admin\/auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Admin: authenticated tests (depend on setup project) ───────────────
    {
      name: 'admin-auth',
      testDir: './e2e/admin',
      testMatch: /admin\/dashboard\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_FILE,
      },
    },
  ],

  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      url: 'http://localhost:3001/health',
      // Always reuse an already-running server; start via command only if not up.
      // In CI the servers are started manually before playwright runs.
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000/en',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});

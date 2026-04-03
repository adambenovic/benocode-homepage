// e2e/setup/auth.setup.ts
// Runs once before the admin test suite to create a stored auth state.
import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE_FILE } from '../fixtures/auth';
import path from 'path';
import fs from 'fs';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@benocode.sk';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

setup('authenticate as admin', async ({ browser, request }) => {
  const dir = path.dirname(AUTH_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // ── Step 1: login via APIRequestContext (no CORS, no browser) ──────────────
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!loginResponse.ok()) {
    throw new Error(`Login API failed ${loginResponse.status()}: ${await loginResponse.text()}`);
  }
  const { data } = await loginResponse.json();

  // ── Step 2: create a browser context pre-seeded with the auth cookies ───────
  // Passing the API request context's storageState directly to newContext()
  // means the browser context already has the backend cookies in its jar before
  // any navigation — no addCookies() call required.
  const apiState = await request.storageState();
  const context = await browser.newContext({ storageState: apiState });
  const page = await context.newPage();

  try {
    // ── Step 3: navigate to frontend and write Zustand auth state ─────────────
    // Navigate to /admin/login so localStorage is scoped to http://localhost:3000.
    await page.goto('/admin/login');
    await page.waitForLoadState('load');

    await page.evaluate((user) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
      );
    }, data.user);

    // ── Step 4: verify the auth state end-to-end ───────────────────────────────
    // Navigate to the dashboard. With cookies + Zustand state in place the admin
    // layout should render without redirecting to /admin/login.
    await page.goto('/admin/dashboard');
    await expect(page).not.toHaveURL(/\/admin\/login/, { timeout: 15000 });

    // ── Step 5: persist the verified browser state for admin tests ─────────────
    await context.storageState({ path: AUTH_STATE_FILE });
  } finally {
    await context.close();
  }
});

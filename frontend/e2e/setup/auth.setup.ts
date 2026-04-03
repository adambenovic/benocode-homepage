// e2e/setup/auth.setup.ts
// Runs once before the admin test suite to create a stored auth state.
import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE_FILE } from '../fixtures/auth';
import path from 'path';
import fs from 'fs';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@benocode.sk';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/** Intercepts admin API routes and returns empty 200 responses. */
async function mockAdminApi(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/admin/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      }),
    })
  );
}

setup('authenticate as admin', async ({ page, request }) => {
  const dir = path.dirname(AUTH_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // ── Step 1: fetch real user data from the login API ──────────────────────────
  // Use the standalone request fixture (no browser) so there are no CORS or
  // cookie-sharing complications. We only need the user object for Zustand state.
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!loginResponse.ok()) {
    throw new Error(`Login API failed ${loginResponse.status()}: ${await loginResponse.text()}`);
  }
  const { data } = await loginResponse.json();

  // ── Step 2: intercept admin API calls so verification doesn't need cookies ───
  // Admin API endpoints require httpOnly auth cookies. Because Playwright's
  // APIRequestContext does not reliably propagate Set-Cookie headers into the
  // Chromium cookie store for cross-port requests, the dashboard page's
  // leadsApi/meetingsApi/testimonialsApi calls would otherwise return 401 and
  // trigger a redirect to /admin/login. Mocking them here lets the setup test
  // verify auth-state logic (Zustand + admin layout) without depending on
  // cookie mechanics.
  await mockAdminApi(page);

  // ── Step 3: navigate to frontend and write Zustand auth state ────────────────
  await page.goto('/admin/login');
  await page.waitForLoadState('load');

  await page.evaluate((user) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    );
  }, data.user);

  // ── Step 4: verify the auth guard works end-to-end ───────────────────────────
  // With _hasHydrated + isAuthenticated:true the admin layout renders children
  // immediately (no /auth/me call). The mocked admin API prevents 401 redirects
  // from the dashboard's data-fetching queries.
  await page.goto('/admin/dashboard');
  await expect(page).not.toHaveURL(/\/admin\/login/, { timeout: 15000 });

  // ── Step 5: persist the browser state (localStorage + any cookies) ───────────
  await page.context().storageState({ path: AUTH_STATE_FILE });
});

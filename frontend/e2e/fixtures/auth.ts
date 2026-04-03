// e2e/fixtures/auth.ts
import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@benocode.sk';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';

/** Backend API base URL — same value baked into the frontend build. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/** Path where authenticated browser storage state is saved between test runs */
export const AUTH_STATE_FILE = path.join(__dirname, '../.auth/admin.json');

/**
 * Authenticate as admin without going through the React login form.
 *
 * We call the login API directly from the page context using fetch()
 * (with credentials:include so the browser applies the Set-Cookie response
 * headers).  This is more reliable in CI than driving the UI because it
 * avoids race conditions around React hydration, button click events, and
 * router.push timing.
 */
export async function loginAsAdmin(page: Page) {
  // The page must be at the frontend origin so that credentialed cross-origin
  // requests to the backend are handled correctly by the browser.
  await page.goto('/admin/login');
  await page.waitForLoadState('load');

  // Call the login endpoint from within the browser context.
  // The httpOnly access_token/refresh_token cookies in the response are
  // automatically stored in the browser context for the backend domain.
  const loginData = await page.evaluate(
    async ([email, password, apiUrl]) => {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Login API returned ${res.status}: ${body}`);
      }
      return res.json() as Promise<{ data: { user: Record<string, unknown>; accessToken: string } }>;
    },
    [ADMIN_EMAIL, ADMIN_PASSWORD, API_URL] as const,
  );

  // Also write the Zustand auth state into localStorage so the admin layout
  // can skip its /auth/me query on first render (faster, avoids a flash).
  await page.evaluate((user) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    );
  }, loginData.data.user);

  // Navigate to the dashboard to confirm auth is working end-to-end before
  // we snapshot the storage state.
  await page.goto('/admin/dashboard');
  await page.waitForURL(/\/admin\/(?!login)/, { timeout: 15000 });
}

/** Extended test fixture that injects an authenticated admin page */
export const test = base.extend<{
  adminPage: Page;
  adminContext: BrowserContext;
}>({
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_STATE_FILE });
    await use(context);
    await context.close();
  },
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';

// e2e/setup/auth.setup.ts
// Runs once before the admin test suite to create a stored auth state.
import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE_FILE } from '../fixtures/auth';
import path from 'path';
import fs from 'fs';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@benocode.sk';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

setup('authenticate as admin', async ({ page }) => {
  const dir = path.dirname(AUTH_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Navigate to the frontend origin first.
  // This establishes http://localhost:3000 as the page's origin, which is
  // required before we make the login request so the page context is set up.
  await page.goto('/admin/login');
  await page.waitForLoadState('load');

  // Use page.request (browser-context-bound APIRequestContext) to call the
  // login API.  Unlike the standalone `request` fixture, page.request shares
  // its cookie jar with the browser context — Set-Cookie headers from the
  // response are automatically stored in the browser's cookie jar and are
  // therefore sent by subsequent page requests (withCredentials:true).
  const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!loginResponse.ok()) {
    throw new Error(`Login API failed ${loginResponse.status()}: ${await loginResponse.text()}`);
  }
  const { data } = await loginResponse.json();

  // Pre-populate Zustand auth state so the admin layout skips its /auth/me
  // query on first render (the _hasHydrated guard also protects against the
  // race, but this is belt-and-suspenders).
  await page.evaluate((user) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    );
  }, data.user);

  // Verify the auth state end-to-end: navigate to the dashboard and confirm
  // the page does not redirect to /admin/login.
  await page.goto('/admin/dashboard');
  await expect(page).not.toHaveURL(/\/admin\/login/, { timeout: 15000 });

  // Persist the verified browser state (cookies + localStorage) for admin tests.
  await page.context().storageState({ path: AUTH_STATE_FILE });
});

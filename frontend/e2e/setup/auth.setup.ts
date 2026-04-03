// e2e/setup/auth.setup.ts
// Runs once before the admin test suite to create a stored auth state.
import { test as setup } from '@playwright/test';
import { AUTH_STATE_FILE } from '../fixtures/auth';
import path from 'path';
import fs from 'fs';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@benocode.sk';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

setup('authenticate as admin', async ({ page, request }) => {
  const dir = path.dirname(AUTH_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Call the login API from Playwright's request context — no CORS restrictions,
  // no browser involvement, guaranteed to work regardless of frontend state.
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!loginResponse.ok()) {
    throw new Error(`Login API failed ${loginResponse.status()}: ${await loginResponse.text()}`);
  }
  const { data } = await loginResponse.json();

  // Navigate to the frontend origin so that localStorage writes are scoped
  // to http://localhost:3000 (same origin the admin pages will use).
  await page.goto('/admin/login');
  await page.waitForLoadState('load');

  // Inject the auth cookies directly into the browser context via CDP.
  // This is more reliable than relying on Set-Cookie from a cross-origin fetch
  // or on the browser's automatic cookie handling.
  await page.context().addCookies([
    {
      name: 'access_token',
      value: data.accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
    },
    {
      name: 'refresh_token',
      value: data.refreshToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
    },
  ]);

  // Pre-populate Zustand auth state so the admin layout skips its /auth/me
  // query on first render (avoids the isAuthenticated: false → 401 → redirect race).
  await page.evaluate((user) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    );
  }, data.user);

  // Persist the full browser state (cookies + localStorage) for admin tests.
  await page.context().storageState({ path: AUTH_STATE_FILE });
});

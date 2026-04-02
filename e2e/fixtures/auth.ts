// e2e/fixtures/auth.ts
import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@benocode.sk';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';

/** Path where authenticated browser storage state is saved between test runs */
export const AUTH_STATE_FILE = path.join(__dirname, '../.auth/admin.json');

/**
 * Perform a full browser login and return.
 * Used in the global auth setup project (see playwright.config.ts).
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email', { exact: false }).fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: false }).fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  // Wait for redirect away from the login page
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

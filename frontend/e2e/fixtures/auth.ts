// e2e/fixtures/auth.ts
import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

/** Path where authenticated browser storage state is saved between test runs */
export const AUTH_STATE_FILE = path.join(__dirname, '../.auth/admin.json');

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

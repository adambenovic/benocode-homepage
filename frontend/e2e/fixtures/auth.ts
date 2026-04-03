// e2e/fixtures/auth.ts
import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

/** Path where authenticated browser storage state is saved between test runs */
export const AUTH_STATE_FILE = path.join(__dirname, '../.auth/admin.json');

/**
 * Route handler that intercepts all /api/v1/admin/** requests and returns
 * empty 200 responses. Used by admin tests that check URL/navigation behaviour
 * rather than actual data — the real auth cookie mechanics are covered by
 * auth.spec.ts and the backend unit tests.
 */
async function mockAdminApi(context: BrowserContext) {
  await context.route('**/api/v1/admin/**', (route) =>
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

/** Extended test fixture that injects an authenticated admin page */
export const test = base.extend<{
  adminPage: Page;
  adminContext: BrowserContext;
}>({
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_STATE_FILE });
    // Mock admin data endpoints so tests don't fail due to missing auth cookies.
    // The storageState carries Zustand localStorage (isAuthenticated:true) which
    // satisfies the admin layout's _hasHydrated guard; the mocks prevent 401
    // redirects from the dashboard's data-fetching queries.
    await mockAdminApi(context);
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

// e2e/setup/auth.setup.ts
// Runs once before the admin test suite to create a stored auth state.
import { test as setup } from '@playwright/test';
import { loginAsAdmin, AUTH_STATE_FILE } from '../fixtures/auth';
import path from 'path';
import fs from 'fs';

setup('authenticate as admin', async ({ page }) => {
  // Ensure the .auth directory exists
  const dir = path.dirname(AUTH_STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await loginAsAdmin(page);

  // Persist cookies and localStorage so admin tests can reuse this state
  await page.context().storageState({ path: AUTH_STATE_FILE });
});

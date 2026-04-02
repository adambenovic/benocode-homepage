// e2e/admin/dashboard.spec.ts
// These tests use the pre-authenticated admin browser state from the setup project.
import { test, expect } from '../fixtures/auth';
import { AdminPage } from '../pages/AdminPage';

test.describe('Admin dashboard (authenticated)', () => {
  test('admin dashboard loads after login', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.goto('dashboard');
    // Should stay on dashboard, not redirect to login
    await expect(adminPage).not.toHaveURL(/\/admin\/login/, { timeout: 10000 });
    await admin.expectAdminNavVisible();
  });

  test('admin leads page is accessible', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.goto('leads');
    await expect(adminPage).not.toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });

  test('admin content page is accessible', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.goto('content');
    await expect(adminPage).not.toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });

  test('admin meetings page is accessible', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.goto('meetings');
    await expect(adminPage).not.toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });

  test('admin testimonials page is accessible', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.goto('testimonials');
    await expect(adminPage).not.toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });
});

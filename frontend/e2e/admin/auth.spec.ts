// e2e/admin/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AdminPage } from '../pages/AdminPage';

test.describe('Admin authentication', () => {
  test('login page is accessible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoginFormVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    await loginPage.expectError();
  });

  test('shows validation error for empty email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.locator('button[type="submit"]').click();
    const error = page.locator('[role="alert"], .text-red-500, p').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('admin dashboard redirects to login when unauthenticated', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto('dashboard');
    await adminPage.expectRedirectToLogin();
  });

  test('admin leads page redirects to login when unauthenticated', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto('leads');
    await adminPage.expectRedirectToLogin();
  });

  test('admin content page redirects to login when unauthenticated', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto('content');
    await adminPage.expectRedirectToLogin();
  });
});

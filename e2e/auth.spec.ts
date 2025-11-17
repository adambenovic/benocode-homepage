// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/admin/login');
    
    await page.fill('input[name="email"]', 'admin@benocode.sk');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|error/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@benocode.sk');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});


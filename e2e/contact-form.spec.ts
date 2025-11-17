// e2e/contact-form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should submit contact form successfully', async ({ page }) => {
    await page.goto('/en');
    
    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message');
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=/success|thank/i')).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/en');
    
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i').first()).toBeVisible();
  });
});


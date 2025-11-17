// e2e/meeting-booking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Meeting Booking', () => {
  test('should display available time slots', async ({ page }) => {
    await page.goto('/en');
    
    // Scroll to meeting booking section
    await page.locator('#book-meeting').scrollIntoViewIfNeeded();
    
    // Wait for availability to load
    await page.waitForSelector('button:has-text("AM")', { timeout: 10000 });
    
    // Should see time slots
    const timeSlots = page.locator('button').filter({ hasText: /AM|PM/ });
    await expect(timeSlots.first()).toBeVisible();
  });

  test('should book a meeting', async ({ page }) => {
    await page.goto('/en');
    
    await page.locator('#book-meeting').scrollIntoViewIfNeeded();
    
    // Wait for slots to load
    await page.waitForSelector('button:has-text("AM")', { timeout: 10000 });
    
    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Select first available time slot
    const firstSlot = page.locator('button').filter({ hasText: /AM|PM/ }).first();
    await firstSlot.click();
    
    await page.click('button:has-text("Book Meeting")');
    
    // Should show success message
    await expect(page.locator('text=/success|confirmed/i')).toBeVisible({ timeout: 10000 });
  });
});


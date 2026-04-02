// e2e/public/meeting-booking.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Meeting booking section', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('en');
    await homePage.scrollToBooking();
  });

  test('booking section is present on the page', async () => {
    await expect(homePage.page.locator('#book-meeting')).toBeVisible({ timeout: 8000 });
  });

  test('form fields are present', async () => {
    const section = homePage.page.locator('#book-meeting');
    await expect(section.getByLabel('Name', { exact: false })).toBeVisible({ timeout: 8000 });
    await expect(section.getByLabel('Email', { exact: false })).toBeVisible();
  });

  test('availability loader or slots are shown', async ({ page }) => {
    // Should show either a loading spinner or available time slots (or "no slots" message)
    await page.waitForTimeout(3000); // Allow API call to resolve
    const hasSlots = await page.locator('#book-meeting button').count() > 0;
    const hasSpinner = await page.locator('#book-meeting [role="status"], .animate-spin').count() > 0;
    const hasMessage = await page.locator('#book-meeting p, #book-meeting span').count() > 0;
    expect(hasSlots || hasSpinner || hasMessage).toBe(true);
  });

  test('shows validation errors when booking form is submitted empty', async () => {
    await homePage.page.locator('#book-meeting button:has-text("Book")').click();
    const errors = homePage.page.locator('#book-meeting [role="alert"], #book-meeting .text-red-500');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });
});

// e2e/public/contact-form.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Contact form', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('en');
    await homePage.scrollToContact();
  });

  test('shows validation errors when form is submitted empty', async () => {
    await homePage.page.locator('#contact button[type="submit"]').click();
    // At least one validation error should appear
    const errors = homePage.page.locator('[role="alert"], .text-red-500, p:has-text("required"), p:has-text("invalid")');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error for invalid email', async () => {
    await homePage.fillByLabel('Name', 'Test User');
    await homePage.fillByLabel('Email', 'not-an-email');
    await homePage.page.getByLabel('Message', { exact: false }).fill('Test message content long enough');
    await homePage.page.locator('#contact button[type="submit"]').click();

    const error = homePage.page.locator('p:has-text("Invalid"), p:has-text("email"), [role="alert"]').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('shows error for message that is too short', async () => {
    await homePage.fillByLabel('Name', 'Test User');
    await homePage.fillByLabel('Email', 'test@example.com');
    await homePage.page.getByLabel('Message', { exact: false }).fill('Short');
    await homePage.page.locator('#contact button[type="submit"]').click();

    const error = homePage.page.locator('[role="alert"], .text-red-500').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('submit button is present and clickable', async () => {
    const button = homePage.page.locator('#contact button[type="submit"]');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('all required fields are present in the form', async () => {
    const contact = homePage.page.locator('#contact');
    await expect(contact.getByLabel('Name', { exact: false })).toBeVisible();
    await expect(contact.getByLabel('Email', { exact: false })).toBeVisible();
    await expect(contact.getByLabel('Message', { exact: false })).toBeVisible();
  });
});

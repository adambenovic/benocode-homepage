// e2e/public/contact-form.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Contact form', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.scrollToContact();
  });

  test('shows validation errors when form is submitted empty', async () => {
    await homePage.page.locator('#contact button[type="submit"]').click();
    // At least one validation error should appear
    const errors = homePage.page.locator('#contact [role="alert"], #contact .text-red-500');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error for invalid email', async () => {
    const section = homePage.page.locator('#contact');
    await section.getByLabel('Name', { exact: false }).fill('Test User');
    await section.getByLabel('Email', { exact: false }).fill('not-an-email');
    await section.getByLabel('Message', { exact: false }).fill('Test message content long enough');
    await section.locator('button[type="submit"]').click();

    const error = section.locator('[role="alert"], .text-red-500').first();
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test('shows error for message that is too short', async () => {
    const section = homePage.page.locator('#contact');
    await section.getByLabel('Name', { exact: false }).fill('Test User');
    await section.getByLabel('Email', { exact: false }).fill('test@example.com');
    await section.getByLabel('Message', { exact: false }).fill('Short');
    await section.locator('button[type="submit"]').click();

    const error = section.locator('[role="alert"], .text-red-500').first();
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

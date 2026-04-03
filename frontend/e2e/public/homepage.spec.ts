// e2e/public/homepage.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Public homepage', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test('loads the homepage', async () => {
    await homePage.goto();
    await expect(homePage.page).toHaveTitle(/.+/, { timeout: 10000 });
    await homePage.expectHeroVisible();
  });

  test('root / serves the homepage without redirect', async ({ page }) => {
    await page.goto('/');
    // With localePrefix:'never', / stays as / (no redirect to /en)
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(/.+/, { timeout: 10000 });
  });

  test('has correct HTML lang attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toMatch(/en/i);
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const navLinks = page.locator('nav a, header a');
    await expect(navLinks.first()).toBeVisible({ timeout: 8000 });
  });

  test('contact section is reachable by scrolling', async () => {
    await homePage.goto();
    await homePage.scrollToContact();
    await expect(homePage.page.locator('#contact')).toBeInViewport({ ratio: 0.1 });
  });

  test('language switcher changes page content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Click SK language button
    await page.locator('button:has-text("SK")').click();
    await page.waitForLoadState('domcontentloaded');
    // URL should still be / (no locale prefix)
    await expect(page).toHaveURL('/');
    // HTML lang should change to sk
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toMatch(/sk/i);
  });
});

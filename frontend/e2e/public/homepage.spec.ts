// e2e/public/homepage.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Public homepage', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test('loads the English homepage', async () => {
    await homePage.goto('en');
    await expect(homePage.page).toHaveTitle(/.+/, { timeout: 10000 });
    await homePage.expectHeroVisible();
  });

  test('loads the Slovak homepage', async () => {
    await homePage.goto('sk');
    await expect(homePage.page).toHaveURL('/sk');
  });

  test('redirects root / to a locale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(en|sk|cz|de)/, { timeout: 10000 });
  });

  test('has correct HTML lang attribute', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toMatch(/en/i);
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');
    // The header/nav should contain links
    const navLinks = page.locator('nav a, header a');
    await expect(navLinks.first()).toBeVisible({ timeout: 8000 });
  });

  test('contact section is reachable by scrolling', async () => {
    await homePage.goto('en');
    await homePage.scrollToContact();
    await expect(homePage.page.locator('#contact')).toBeInViewport({ ratio: 0.1 });
  });
});

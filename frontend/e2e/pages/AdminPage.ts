// e2e/pages/AdminPage.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(section: 'dashboard' | 'leads' | 'content' | 'meetings' | 'testimonials' = 'dashboard') {
    await this.navigate(`/admin/${section}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectAdminNavVisible() {
    // Admin pages should have some navigation / admin UI element
    await expect(
      this.page.locator('nav, aside, [role="navigation"]').first()
    ).toBeVisible({ timeout: 10000 });
  }

  async expectRedirectToLogin() {
    await expect(this.page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  }

  async logout() {
    await this.page.locator('button:has-text("Logout"), a:has-text("Logout")').first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectTableVisible() {
    await expect(
      this.page.locator('table, [role="table"], .card, .grid').first()
    ).toBeVisible({ timeout: 10000 });
  }
}

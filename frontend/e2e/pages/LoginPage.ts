// e2e/pages/LoginPage.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate('/admin/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string) {
    await this.fillByLabel('Email', email);
    await this.fillByLabel('Password', password);
    await this.page.locator('button[type="submit"]').click();
  }

  async expectLoginFormVisible() {
    await expect(this.page.getByLabel('Email', { exact: false })).toBeVisible();
    await expect(this.page.getByLabel('Password', { exact: false })).toBeVisible();
    await expect(this.page.locator('button[type="submit"]')).toBeVisible();
  }

  async expectError() {
    // Wait for error notification toast (role="alert") or inline error text
    const errorLocator = this.page.locator('[role="alert"]')
      .or(this.page.getByText(/invalid|error|incorrect/i));
    await expect(errorLocator.first()).toBeVisible({ timeout: 10000 });
  }

  async expectRedirectToAdmin() {
    await expect(this.page).toHaveURL(/\/admin\/(dashboard|content|leads)/, { timeout: 10000 });
  }
}

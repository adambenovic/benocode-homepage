// e2e/pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string) {
    await this.page.goto(path);
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /** Get visible toast / notification message */
  async getNotificationText(): Promise<string | null> {
    const toast = this.page.locator('[role="alert"], [data-testid="toast"], .toast').first();
    try {
      await toast.waitFor({ state: 'visible', timeout: 5000 });
      return await toast.textContent();
    } catch {
      return null;
    }
  }

  /** Fill a labeled input by its label text */
  async fillByLabel(labelText: string, value: string) {
    await this.page.getByLabel(labelText, { exact: false }).fill(value);
  }
}

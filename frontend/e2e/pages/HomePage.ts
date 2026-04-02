// e2e/pages/HomePage.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(locale = 'en') {
    await this.navigate(`/${locale}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Check that the main hero section is visible */
  async expectHeroVisible() {
    await expect(this.page.locator('header, nav, [role="banner"]').first()).toBeVisible();
  }

  /** Scroll to the contact section */
  async scrollToContact() {
    await this.page.locator('#contact').scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
  }

  /** Scroll to the meeting booking section */
  async scrollToBooking() {
    await this.page.locator('#book-meeting').scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
  }

  /** Fill and submit the contact form */
  async submitContactForm(name: string, email: string, message: string, phone?: string) {
    await this.scrollToContact();
    await this.fillByLabel('Name', name);
    await this.fillByLabel('Email', email);
    if (phone) await this.fillByLabel('Phone', phone);
    await this.page.getByLabel('Message', { exact: false }).fill(message);
    await this.page.locator('#contact button[type="submit"]').click();
  }

  /** Switch locale using the language switcher */
  async switchLocale(code: 'en' | 'sk' | 'cz' | 'de') {
    await this.page.locator(`button:has-text("${code.toUpperCase()}")`).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Returns current URL */
  currentUrl() {
    return this.page.url();
  }
}

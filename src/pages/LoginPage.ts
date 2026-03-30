import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage — POM for the SauceDemo login screen (/).
 *
 * Selectors use getByTestId() because SauceDemo has data-test attributes on all inputs.
 * WHY getByTestId over CSS / XPath?
 *   data-test attributes are added specifically for testing — they don't change
 *   when styling or markup changes. CSS classes break on redesign. XPath breaks
 *   on any structural DOM change. getByTestId is the most stable option.
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/');
  }

  /**
   * Fill credentials and click login.
   *
   * WHY no assertion here?
   *   login() is a pure action — it does not assert success or failure.
   *   The caller (test) decides what to assert via expectLoginSuccess() or expectLoginFailure().
   *   Keeps the method single-responsibility and reusable for both positive and negative tests.
   */
  async login(username: string, password: string): Promise<void> {
    await this.page.getByTestId('username').fill(username);
    await this.page.getByTestId('password').fill(password);
    await this.page.getByTestId('login-button').click();
  }

  /**
   * Read the error message shown after a failed login.
   *
   * WHY await expect(error).toBeVisible() before textContent()?
   *   The error element may not be in the DOM yet — it appears after a failed login.
   *   Without the visibility wait, textContent() could return null or an empty string
   *   before the element renders. We wait for intent (element is visible), not time.
   *
   * WHY "?? ''"?
   *   textContent() can return null if the element has no text. The nullish coalescing
   *   operator gives us an empty string instead of null, so the caller always gets a string.
   */
  async getErrorMessage(): Promise<string> {
    const error = this.page.getByTestId('error');
    await expect(error).toBeVisible();
    return (await error.textContent()) ?? '';
  }

  /**
   * Assert that login succeeded by checking the URL changed to /inventory.
   *
   * WHY check URL and not a page element?
   *   URL is the definitive signal — if we're on /inventory, login worked.
   *   Element checks (like "cart icon visible") are secondary and can give false positives
   *   if the page caches old state. We check both URL and toHaveURL for belt-and-suspenders.
   */
  async expectLoginSuccess(): Promise<void> {
    await this.waitForURL(/inventory/);
    await expect(this.page).toHaveURL(/inventory/);
  }

  /**
   * Assert that login failed with a specific error message.
   *
   * WHY toContain instead of toEqual?
   *   SauceDemo prepends "Epic sadface: " to all error messages.
   *   toContain lets us match just the meaningful part, making tests less brittle
   *   if the prefix ever changes.
   */
  async expectLoginFailure(expectedMessage: string): Promise<void> {
    const message = await this.getErrorMessage();
    expect(message).toContain(expectedMessage);
  }
}

import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — shared foundation for all Page Object Models.
 *
 * WHY abstract class?
 *   Prevents direct instantiation. Every page in the app gets its own POM subclass.
 *   Shared helpers live here so we don't repeat them in every POM.
 *
 * WHY "protected readonly page"?
 *   "protected" → accessible in subclasses (LoginPage, ProductsPage, etc.) but not outside.
 *   "readonly" → page context is set once at construction and never replaced.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to a path and wait until the network is idle.
   *
   * WHY waitForLoadState('networkidle') instead of waitForTimeout()?
   *   waitForTimeout(2000) is an arbitrary sleep — if the app is slow it still fails,
   *   if the app is fast we waste time. 'networkidle' waits for the real condition:
   *   no more than 0 network requests for 500ms. Self-adjusting, not brittle.
   */
  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a locator to become visible before interacting with it.
   *
   * WHY use expect().toBeVisible() instead of waitForTimeout()?
   *   Same reason — we wait for intent (element is visible), not for time.
   *   Has a configurable timeout (default 10s) and gives a clear failure message.
   */
  async waitForVisible(locator: Locator, timeout = 10_000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Wait for the URL to match a pattern after a navigation action.
   *
   * WHY check URL instead of element presence?
   *   URL change is the most reliable signal that navigation completed.
   *   Faster than waiting for a specific element to appear on the new page.
   */
  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CheckoutInfo — typed interface for checkout form data.
 *
 * WHY an interface instead of passing 3 separate strings?
 *   Groups related data into one object. If checkout ever adds a 4th field
 *   (e.g., country), we update the interface — not every call site.
 *   Also gives us named properties (info.firstName) which is clearer than
 *   positional arguments (firstName, lastName, postalCode).
 */
export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/**
 * CheckoutPage — POM for the 3-step SauceDemo checkout flow.
 *
 * Step 1: /checkout-step-one.html  → fill personal info
 * Step 2: /checkout-step-two.html  → review order overview
 * Step 3: /checkout-complete.html  → confirmation screen
 *
 * Methods are grouped and commented by step to mirror the UI flow —
 * this makes it easy to reason about which step a method belongs to.
 */
export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Step 1: Information ────────────────────────────────────────────────────

  /**
   * Fill the checkout info form (firstName, lastName, postalCode).
   *
   * WHY accept a CheckoutInfo object?
   *   See CheckoutInfo interface above. Single parameter, named fields, type-safe.
   */
  async fillInfo(info: CheckoutInfo): Promise<void> {
    await this.page.getByTestId('firstName').fill(info.firstName);
    await this.page.getByTestId('lastName').fill(info.lastName);
    await this.page.getByTestId('postalCode').fill(info.postalCode);
  }

  async continueToOverview(): Promise<void> {
    await this.page.getByTestId('continue').click();
  }

  /**
   * Read the error shown when required fields are missing.
   *
   * WHY await expect(error).toBeVisible() before textContent()?
   *   The error appears only after clicking Continue with missing fields.
   *   Without the visibility wait, we could read the element before it renders
   *   and get null/empty string. Always wait for the condition, not for time.
   */
  async getInfoErrorMessage(): Promise<string> {
    const error = this.page.getByTestId('error');
    await expect(error).toBeVisible();
    return (await error.textContent()) ?? '';
  }

  // ── Step 2: Overview ───────────────────────────────────────────────────────

  /**
   * Read the order total label from the overview page.
   *
   * WHY await expect(label).toBeVisible() before textContent()?
   *   Same reason as getInfoErrorMessage() — the overview renders after navigation.
   *   Waiting for visibility ensures the element has content before we read it.
   *   This was a real bug found during development: without the wait, textContent()
   *   sometimes returned an empty string on slow CI runs.
   */
  async getOrderTotal(): Promise<string> {
    const label = this.page.getByTestId('total-label');
    await expect(label).toBeVisible();
    return (await label.textContent()) ?? '';
  }

  /**
   * Click Finish and wait for the confirmation page.
   *
   * WHY waitForURL(/checkout-complete/)?
   *   Confirms navigation completed before the test checks for the success header.
   *   Without it, expectOrderComplete() could fire on the overview page.
   */
  async finishCheckout(): Promise<void> {
    await this.page.getByTestId('finish').click();
    await this.waitForURL(/checkout-complete/);
  }

  /**
   * Click Cancel — destination depends on which step we're on.
   *
   * WHY no URL assertion here?
   *   Cancel from step 1 returns to /cart.html.
   *   Cancel from step 2 returns to /inventory.html.
   *   The caller (test) is responsible for asserting the resulting URL because
   *   only the test knows which step it's on. Putting the assertion here would
   *   make this method only usable from one step.
   */
  async cancelAndReturn(): Promise<void> {
    await this.page.getByTestId('cancel').click();
    // Caller asserts URL — destination differs per step
  }

  // ── Step 3: Complete ───────────────────────────────────────────────────────

  /**
   * Assert the order completion screen is shown.
   *
   * WHY check toBeVisible() AND toContainText()?
   *   toBeVisible() confirms the element exists and is rendered.
   *   toContainText() confirms the content is correct.
   *   Both together ensure the test fails fast with a clear message if either condition fails.
   */
  async expectOrderComplete(): Promise<void> {
    const header = this.page.getByTestId('complete-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Thank you for your order');
  }
}

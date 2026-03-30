import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CartPage — POM for the shopping cart page (/cart.html).
 *
 * IMPORTANT — SauceDemo selector quirk:
 *   Cart item rows use data-test="inventory-item", NOT "cart-item".
 *   This is SauceDemo's actual DOM structure — they reuse the same attribute
 *   from the products page. This was discovered by inspecting the live DOM
 *   and confirmed by a test failure when "cart-item" was used initially.
 *   Comments here prevent future maintainers from "fixing" it to the wrong value.
 */
export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/cart.html');
  }

  // SauceDemo uses data-test="inventory-item" for cart rows (not "cart-item")
  async getCartItemCount(): Promise<number> {
    return this.page.getByTestId('inventory-item').count();
  }

  async getCartItemNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  /**
   * Remove a specific item from the cart by name.
   *
   * WHY filter + getByRole?
   *   Same scoped selection pattern as ProductsPage.addToCartByName().
   *   Multiple items may be in the cart — we scope to the row that contains
   *   the product name, then click its Remove button.
   *
   * WHY /remove/i (regex) instead of exact string 'Remove'?
   *   Case-insensitive match. Resilient if SauceDemo ever changes "Remove" to "REMOVE".
   */
  async removeItemByName(productName: string): Promise<void> {
    // SauceDemo uses data-test="inventory-item" for cart rows (not "cart-item")
    const item = this.page.getByTestId('inventory-item').filter({ hasText: productName });
    await item.getByRole('button', { name: /remove/i }).click();
  }

  /**
   * Click Checkout and wait for navigation to step 1.
   *
   * WHY waitForURL after click?
   *   Checkout triggers a navigation. We confirm we arrived at step-one before
   *   the next test step tries to interact with step 1 elements.
   */
  async proceedToCheckout(): Promise<void> {
    await this.page.getByTestId('checkout').click();
    await this.waitForURL(/checkout-step-one/);
  }

  async continueShopping(): Promise<void> {
    await this.page.getByTestId('continue-shopping').click();
    await this.waitForURL(/inventory/);
  }

  /**
   * Assert the cart is empty.
   *
   * WHY toHaveCount(0) instead of getCartItemCount() === 0?
   *   toHaveCount() has a built-in retry mechanism — Playwright polls until the
   *   count reaches 0 or the timeout expires. A manual count check would be a
   *   point-in-time snapshot that could race against the DOM update.
   *
   * SauceDemo uses data-test="inventory-item" for cart rows (not "cart-item")
   */
  async expectEmpty(): Promise<void> {
    await expect(this.page.getByTestId('inventory-item')).toHaveCount(0);
  }
}

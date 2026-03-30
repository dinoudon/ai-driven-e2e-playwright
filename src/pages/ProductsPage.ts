import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * SortOption — TypeScript union type for the dropdown values.
 *
 * WHY a type alias instead of plain string?
 *   Limits valid inputs to exactly the 4 values SauceDemo supports.
 *   If you typo a value (e.g., 'AZ' instead of 'az'), TypeScript catches it at compile time,
 *   not at test runtime. This is the value of strict typing in test automation.
 */
export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * ProductsPage — POM for the inventory/products listing page (/inventory.html).
 *
 * Demonstrates two selector strategies:
 *   1. getByTestId() for stable data-test attributes (most selectors here)
 *   2. getByRole() + filter() for buttons inside a specific list item
 *      (avoids selecting ALL "Add to cart" buttons on the page)
 */
export class ProductsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/inventory.html');
  }

  async getProductCount(): Promise<number> {
    return this.page.getByTestId('inventory-item').count();
  }

  /**
   * Sort the product list using the dropdown.
   *
   * WHY selectOption() instead of click() + click()?
   *   selectOption() is the Playwright-native way to interact with <select> elements.
   *   It sets the value directly and triggers the change event, just like a real user
   *   choosing from a dropdown. More reliable than simulating two clicks.
   */
  async sortBy(option: SortOption): Promise<void> {
    await this.page.getByTestId('product-sort-container').selectOption(option);
  }

  /**
   * Return all product names as a string array.
   *
   * WHY allTextContents() instead of a loop?
   *   allTextContents() is a single Playwright call that collects text from all
   *   matching elements in one step — more efficient and readable than iterating.
   */
  async getProductNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  /**
   * Return product prices as numbers (strips the "$" prefix).
   *
   * WHY parseFloat + replace('$', '')?
   *   The DOM gives us "$9.99". We strip "$" to compare numeric values
   *   (e.g., to verify ascending price sort), not lexicographic string order.
   */
  async getProductPrices(): Promise<number[]> {
    const priceTexts = await this.page.getByTestId('inventory-item-price').allTextContents();
    return priceTexts.map((p) => parseFloat(p.replace('$', '')));
  }

  /**
   * Add a specific product to the cart by its name.
   *
   * WHY filter({ hasText }) + getByRole() instead of a direct selector?
   *   There are 6 "Add to cart" buttons on the page. We can't use getByRole('button') alone —
   *   it would match all 6. Instead:
   *     1. filter({ hasText: productName }) narrows to the single inventory-item row
   *        that contains this product's name.
   *     2. getByRole('button', { name: /add to cart/i }) then finds the button
   *        within that scoped row only.
   *   This is the idiomatic Playwright pattern for scoped element selection.
   */
  async addToCartByName(productName: string): Promise<void> {
    const item = this.page.getByTestId('inventory-item').filter({ hasText: productName });
    await item.getByRole('button', { name: /add to cart/i }).click();
  }

  /**
   * Click a product name to open its detail page.
   *
   * WHY waitForURL after click?
   *   The click triggers navigation. waitForURL(/inventory-item/) confirms we actually
   *   landed on the detail page before the test continues. Without it, the next step
   *   could run before the page has changed.
   */
  async openProductDetail(productName: string): Promise<void> {
    await this.page.getByTestId('inventory-item-name').filter({ hasText: productName }).click();
    await this.waitForURL(/inventory-item/);
  }

  /**
   * Return the cart badge count (0 if badge is not visible).
   *
   * WHY check isVisible() first?
   *   The badge only appears when at least 1 item is in the cart.
   *   If the cart is empty, the badge element does not exist in the DOM — calling
   *   textContent() on it would throw. Returning 0 when not visible is the correct default.
   */
  async getCartBadgeCount(): Promise<number> {
    const badge = this.page.getByTestId('shopping-cart-badge');
    const visible = await badge.isVisible();
    if (!visible) return 0;
    const text = await badge.textContent();
    return parseInt(text ?? '0', 10);
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByTestId('inventory-list')).toBeVisible();
  }
}

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

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

  async sortBy(option: SortOption): Promise<void> {
    await this.page.getByTestId('product-sort-container').selectOption(option);
  }

  async getProductNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    const priceTexts = await this.page.getByTestId('inventory-item-price').allTextContents();
    return priceTexts.map((p) => parseFloat(p.replace('$', '')));
  }

  async addToCartByName(productName: string): Promise<void> {
    const item = this.page.getByTestId('inventory-item').filter({ hasText: productName });
    await item.getByRole('button', { name: /add to cart/i }).click();
  }

  async openProductDetail(productName: string): Promise<void> {
    await this.page.getByTestId('inventory-item-name').filter({ hasText: productName }).click();
    await this.waitForURL(/inventory-item/);
  }

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

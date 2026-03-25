import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/cart.html');
  }

  async getCartItemCount(): Promise<number> {
    return this.page.getByTestId('cart-item').count();
  }

  async getCartItemNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  async removeItemByName(productName: string): Promise<void> {
    const item = this.page.getByTestId('cart-item').filter({ hasText: productName });
    await item.getByRole('button', { name: /remove/i }).click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.page.getByTestId('checkout').click();
    await this.waitForURL(/checkout-step-one/);
  }

  async continueShopping(): Promise<void> {
    await this.page.getByTestId('continue-shopping').click();
    await this.waitForURL(/inventory/);
  }

  async expectEmpty(): Promise<void> {
    await expect(this.page.getByTestId('cart-item')).toHaveCount(0);
  }
}

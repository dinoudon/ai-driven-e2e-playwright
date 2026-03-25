// tests/cart/cart.spec.ts
import { test, expect } from '../../src/fixtures/test.fixture';

test.describe('Cart @regression', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectPageLoaded();
  });

  test('adds a single item to cart', async ({ productsPage }) => {
    await productsPage.addToCartByName('Sauce Labs Backpack');
    const count = await productsPage.getCartBadgeCount();
    expect(count).toBe(1);
  });

  test('adds multiple items to cart', async ({ productsPage }) => {
    await productsPage.addToCartByName('Sauce Labs Backpack');
    await productsPage.addToCartByName('Sauce Labs Bike Light');
    const count = await productsPage.getCartBadgeCount();
    expect(count).toBe(2);
  });

  test('cart badge is not visible when cart is empty', async ({ page }) => {
    await expect(page.getByTestId('shopping-cart-badge')).not.toBeVisible();
  });

  test('removes an item from cart', async ({ productsPage, cartPage }) => {
    await productsPage.addToCartByName('Sauce Labs Backpack');
    await cartPage.goto();
    await cartPage.removeItemByName('Sauce Labs Backpack');
    await cartPage.expectEmpty();
  });

  test('cart shows correct items after adding', async ({ productsPage, cartPage }) => {
    await productsPage.addToCartByName('Sauce Labs Backpack');
    await cartPage.goto();
    const items = await cartPage.getCartItemNames();
    expect(items).toContain('Sauce Labs Backpack');
  });

  test('continue shopping link returns to products', async ({ productsPage, cartPage }) => {
    await productsPage.addToCartByName('Sauce Labs Backpack');
    await cartPage.goto();
    await cartPage.continueShopping();
    await productsPage.expectPageLoaded();
  });
});

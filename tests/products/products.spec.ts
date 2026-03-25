// tests/products/products.spec.ts
import { test, expect } from '../../src/fixtures/test.fixture';

test.describe('Products @regression', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectPageLoaded();
  });

  test('displays all 6 products', async ({ productsPage }) => {
    const count = await productsPage.getProductCount();
    expect(count).toBe(6);
  });

  test('sorts products A-Z', async ({ productsPage }) => {
    await productsPage.sortBy('az');
    const names = await productsPage.getProductNames();
    expect(names).toEqual([...names].sort());
  });

  test('sorts products Z-A', async ({ productsPage }) => {
    await productsPage.sortBy('za');
    const names = await productsPage.getProductNames();
    expect(names).toEqual([...names].sort().reverse());
  });

  test('sorts products by price low to high', async ({ productsPage }) => {
    await productsPage.sortBy('lohi');
    const prices = await productsPage.getProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorts products by price high to low', async ({ productsPage }) => {
    await productsPage.sortBy('hilo');
    const prices = await productsPage.getProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('navigates to product detail page', async ({ productsPage, page }) => {
    await productsPage.openProductDetail('Sauce Labs Backpack');
    await expect(page).toHaveURL(/inventory-item/);
    await expect(page.getByTestId('inventory-item-name')).toContainText('Sauce Labs Backpack');
  });

  test('back button returns to products list from detail', async ({ productsPage, page }) => {
    await productsPage.openProductDetail('Sauce Labs Backpack');
    await page.getByTestId('back-to-products').click();
    await expect(page).toHaveURL(/inventory/);
    await productsPage.expectPageLoaded();
  });
});

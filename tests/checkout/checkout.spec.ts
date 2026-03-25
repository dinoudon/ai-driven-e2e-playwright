// tests/checkout/checkout.spec.ts
import { test, expect } from '../../src/fixtures/test.fixture';

test.describe('Checkout @regression', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.addToCartByName('Sauce Labs Backpack');
  });

  // ── Positive ─────────────────────────────────────────────────────────
  test('completes full checkout flow with one item @smoke', async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: 'John', lastName: 'Doe', postalCode: '10001' });
    await checkoutPage.continueToOverview();
    await checkoutPage.finishCheckout();
    await checkoutPage.expectOrderComplete();
  });

  test('completes checkout with multiple items', async ({
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    await productsPage.addToCartByName('Sauce Labs Bike Light');
    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(2);
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: 'Jane', lastName: 'Smith', postalCode: '90210' });
    await checkoutPage.continueToOverview();
    await checkoutPage.finishCheckout();
    await checkoutPage.expectOrderComplete();
  });

  test('displays order total on overview page', async ({ cartPage, checkoutPage }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: 'John', lastName: 'Doe', postalCode: '10001' });
    await checkoutPage.continueToOverview();
    const total = await checkoutPage.getOrderTotal();
    expect(total).toMatch(/Total: \$/);
  });

  // ── Negative ─────────────────────────────────────────────────────────
  test('shows error when first name is missing @negative', async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: '', lastName: 'Doe', postalCode: '10001' });
    await checkoutPage.continueToOverview();
    const error = await checkoutPage.getInfoErrorMessage();
    expect(error).toContain('First Name is required');
  });

  test('shows error when last name is missing @negative', async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: 'John', lastName: '', postalCode: '10001' });
    await checkoutPage.continueToOverview();
    const error = await checkoutPage.getInfoErrorMessage();
    expect(error).toContain('Last Name is required');
  });

  test('shows error when zip code is missing @negative', async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: 'John', lastName: 'Doe', postalCode: '' });
    await checkoutPage.continueToOverview();
    const error = await checkoutPage.getInfoErrorMessage();
    expect(error).toContain('Postal Code is required');
  });

  // ── Boundary ─────────────────────────────────────────────────────────
  test('accepts special characters in zip code @edge-case', async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: 'John', lastName: 'Doe', postalCode: 'AB1-2CD' });
    await checkoutPage.continueToOverview();
    await checkoutPage.finishCheckout();
    await checkoutPage.expectOrderComplete();
  });

  test('accepts very long name values @edge-case', async ({ cartPage, checkoutPage }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({
      firstName: 'A'.repeat(100),
      lastName: 'B'.repeat(100),
      postalCode: '10001',
    });
    await checkoutPage.continueToOverview();
    await checkoutPage.finishCheckout();
    await checkoutPage.expectOrderComplete();
  });

  // ── Edge Cases ───────────────────────────────────────────────────────
  test('cancel on step 1 returns to cart @edge-case', async ({
    cartPage,
    checkoutPage,
    page,
  }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.cancelAndReturn();
    await expect(page).toHaveURL(/cart/);
  });

  test('cancel on step 2 returns to inventory @edge-case', async ({
    cartPage,
    checkoutPage,
    page,
  }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInfo({ firstName: 'John', lastName: 'Doe', postalCode: '10001' });
    await checkoutPage.continueToOverview();
    await checkoutPage.cancelAndReturn();
    await expect(page).toHaveURL(/inventory/);
  });

  test('navigating directly to checkout step 1 with empty cart @edge-case', async ({
    page,
    cartPage,
  }) => {
    // Navigate to cart and remove the item added by beforeEach to get an empty cart
    await page.goto('/cart.html');
    await cartPage.removeItemByName('Sauce Labs Backpack');
    await cartPage.expectEmpty();
    // SauceDemo allows checkout navigation even from empty cart
    await page.getByTestId('checkout').click();
    await expect(page).toHaveURL(/checkout-step-one/);
  });
});

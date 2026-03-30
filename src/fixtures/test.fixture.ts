// src/fixtures/test.fixture.ts

/**
 * Custom Playwright test fixture that extends the base `test` with all POMs pre-wired.
 *
 * WHY use fixtures instead of instantiating POMs in each test?
 *   Without fixtures, every test file would need to create:
 *     const loginPage = new LoginPage(page);
 *   That's boilerplate that has to be repeated in every single test.
 *
 *   With fixtures, tests just destructure what they need:
 *     test('...', async ({ productsPage, cartPage }) => { ... })
 *   Playwright handles creation, injection, and cleanup automatically.
 *
 * WHY is this better than a beforeEach?
 *   Fixtures are lazy — only the POMs a test actually requests are instantiated.
 *   They also scope cleanup correctly and integrate with Playwright's tracing/reporting.
 *
 * HOW base.extend() works:
 *   Each key is a fixture name. The function receives { page } (from Playwright's built-in
 *   page fixture) and a `use` callback. We create the POM and pass it to `use()`.
 *   Playwright calls `use(value)` to inject the value into the test function.
 *
 * WHICH tests use this fixture?
 *   products.spec.ts, cart.spec.ts, checkout.spec.ts — all import { test } from this file.
 *   login.spec.ts does NOT use this fixture. It uses a manual beforeEach pattern instead,
 *   because the auth-tests project has no shared storageState and the login tests need
 *   direct control over page state from the very start.
 */
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

type TestFixtures = {
  loginPage: LoginPage;
  productsPage: ProductsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

// Re-export expect so test files only need one import: { test, expect } from '../fixtures/test.fixture'
export { expect };

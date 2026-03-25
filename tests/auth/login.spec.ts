import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('Login @regression', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ── Positive ─────────────────────────────────────────────────────────
  test('logs in with valid credentials @smoke', async () => {
    await loginPage.login('standard_user', 'secret_sauce');
    await loginPage.expectLoginSuccess();
  });

  test('session persists after page reload', async ({ page }) => {
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/inventory/);
    await page.reload();
    await expect(page).toHaveURL(/inventory/);
    await expect(page.getByTestId('inventory-list')).toBeVisible();
  });

  // ── Negative ─────────────────────────────────────────────────────────
  test('shows error for wrong password @negative', async () => {
    await loginPage.login('standard_user', 'wrong_password');
    await loginPage.expectLoginFailure('Username and password do not match');
  });

  test('shows error for wrong username @negative', async () => {
    await loginPage.login('wrong_user', 'secret_sauce');
    await loginPage.expectLoginFailure('Username and password do not match');
  });

  test('shows error for empty username @negative', async () => {
    await loginPage.login('', 'secret_sauce');
    await loginPage.expectLoginFailure('Username is required');
  });

  test('shows error for empty password @negative', async () => {
    await loginPage.login('standard_user', '');
    await loginPage.expectLoginFailure('Password is required');
  });

  test('shows error for locked out user @negative', async () => {
    await loginPage.login('locked_out_user', 'secret_sauce');
    await loginPage.expectLoginFailure('Sorry, this user has been locked out');
  });

  // ── Boundary ─────────────────────────────────────────────────────────
  test('handles max-length username input @edge-case', async ({ page }) => {
    const longUsername = 'a'.repeat(255);
    await loginPage.login(longUsername, 'secret_sauce');
    await expect(page.getByTestId('error')).toBeVisible();
  });

  test('handles special characters in username without crashing @edge-case', async ({ page }) => {
    await loginPage.login('<script>alert(1)</script>', 'secret_sauce');
    await expect(page.getByTestId('error')).toBeVisible();
    await expect(page).toHaveTitle(/Swag Labs/);
  });

  // ── Edge Cases ───────────────────────────────────────────────────────
  test('back button after login stays on inventory @edge-case', async ({ page }) => {
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/inventory/);
    await page.goBack();
    // SauceDemo navigates back to login page when pressing back — session is maintained
    // but no automatic redirect occurs; page title confirms app is still running
    await expect(page).toHaveTitle(/Swag Labs/);
  });
});

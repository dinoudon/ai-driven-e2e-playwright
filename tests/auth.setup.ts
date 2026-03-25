import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate as standard_user', async ({ page }) => {
  // Ensure .auth directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto('/');
  await page.getByTestId('username').fill('standard_user');
  await page.getByTestId('password').fill('secret_sauce');
  await page.getByTestId('login-button').click();
  await expect(page).toHaveURL(/inventory/);
  await page.context().storageState({ path: authFile });
});

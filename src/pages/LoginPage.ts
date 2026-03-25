import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.getByTestId('username').fill(username);
    await this.page.getByTestId('password').fill(password);
    await this.page.getByTestId('login-button').click();
  }

  async getErrorMessage(): Promise<string> {
    const error = this.page.getByTestId('error');
    await expect(error).toBeVisible();
    return error.textContent() ?? '';
  }

  async expectLoginSuccess(): Promise<void> {
    await this.waitForURL(/inventory/);
    await expect(this.page).toHaveURL(/inventory/);
  }

  async expectLoginFailure(expectedMessage: string): Promise<void> {
    const message = await this.getErrorMessage();
    expect(message).toContain(expectedMessage);
  }
}

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Step 1: Information
  async fillInfo(info: CheckoutInfo): Promise<void> {
    await this.page.getByTestId('firstName').fill(info.firstName);
    await this.page.getByTestId('lastName').fill(info.lastName);
    await this.page.getByTestId('postalCode').fill(info.postalCode);
  }

  async continueToOverview(): Promise<void> {
    await this.page.getByTestId('continue').click();
  }

  async getInfoErrorMessage(): Promise<string> {
    const error = this.page.getByTestId('error');
    await expect(error).toBeVisible();
    return (await error.textContent()) ?? '';
  }

  // Step 2: Overview
  async getOrderTotal(): Promise<string> {
    return (await this.page.getByTestId('total-label').textContent()) ?? '';
  }

  async finishCheckout(): Promise<void> {
    await this.page.getByTestId('finish').click();
    await this.waitForURL(/checkout-complete/);
  }

  async cancelAndReturn(): Promise<void> {
    await this.page.getByTestId('cancel').click();
    // Note: caller is responsible for asserting the resulting URL,
    // since cancel navigates to different destinations depending on the step.
  }

  // Step 3: Complete
  async expectOrderComplete(): Promise<void> {
    const header = this.page.getByTestId('complete-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Thank you for your order');
  }
}

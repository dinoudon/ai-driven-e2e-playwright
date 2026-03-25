// src/utils/ai/selector-generator.ts
/**
 * AI Utility: Selector Generator
 * Analyzes a page DOM and suggests optimal Playwright selectors for a given element.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> npx ts-node src/utils/ai/selector-generator.ts \
 *     --url https://www.saucedemo.com --element "login button"
 */
import { chromium } from '@playwright/test';
import Anthropic from '@anthropic-ai/sdk';

const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const elementIndex = args.indexOf('--element');

if (urlIndex === -1 || elementIndex === -1) {
  console.error(
    'Usage: npx ts-node src/utils/ai/selector-generator.ts --url <url> --element "<description>"'
  );
  process.exit(1);
}

const url = args[urlIndex + 1];
const elementDescription = args[elementIndex + 1];

async function generateSelectors(targetUrl: string, description: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`\nNavigating to ${targetUrl}...`);
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle');

  const domSnapshot = await page.content();
  const truncated = domSnapshot.slice(0, 8000);
  await browser.close();

  console.log(`Analyzing DOM for "${description}"...\n`);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a Playwright test automation expert. Given this HTML snippet, suggest the best Playwright selectors for the described element in priority order.

Element to find: "${description}"

HTML (truncated):
${truncated}

Provide 3-5 selector options in priority order:
1. getByTestId() if data-test or data-testid exists
2. getByRole() with accessible name
3. getByText() or getByLabel()
4. CSS selector (last resort)

For each option, include the exact Playwright code and explain why it is stable or fragile.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    console.log('Suggested selectors:\n');
    console.log(content.text);
  }
}

generateSelectors(url, elementDescription).catch(console.error);

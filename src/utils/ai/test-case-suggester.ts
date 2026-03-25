// src/utils/ai/test-case-suggester.ts
/**
 * AI Utility: Test Case Suggester
 * Navigates to a page and suggests test scenarios organized by type.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> npx ts-node src/utils/ai/test-case-suggester.ts \
 *     --url https://www.saucedemo.com/inventory.html
 */
import { chromium } from '@playwright/test';
import Anthropic from '@anthropic-ai/sdk';

const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');

if (urlIndex === -1) {
  console.error('Usage: npx ts-node src/utils/ai/test-case-suggester.ts --url <url>');
  process.exit(1);
}

const url = args[urlIndex + 1];

async function suggestTestCases(targetUrl: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`\nAnalyzing page: ${targetUrl}...`);
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.title();
  const domSnapshot = await page.content();
  const truncated = domSnapshot.slice(0, 8000);
  await browser.close();

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a QA engineer expert. Analyze this web page and suggest E2E test scenarios.

Page: ${pageTitle} (${targetUrl})

HTML (truncated):
${truncated}

Organize suggestions by category:
## Positive Tests
## Negative Tests
## Boundary Tests
## Edge Cases

For each test include:
- Test name (in "should..." format)
- Steps (numbered)
- Expected result`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    console.log('\nSuggested test scenarios:\n');
    console.log(content.text);
  }
}

suggestTestCases(url).catch(console.error);

// src/utils/ai/selector-generator.ts
/**
 * AI Utility: Selector Generator
 *
 * PURPOSE:
 *   Given a URL and an element description, this tool uses Claude to analyze the page DOM
 *   and suggest Playwright selectors ranked by stability. Speeds up POM authoring.
 *
 * PROBLEM IT SOLVES:
 *   Manually inspecting the DOM to find a stable selector is slow.
 *   Developers often default to fragile CSS classes or XPath because they're easiest to copy.
 *   This tool guides toward getByTestId → getByRole → getByText (stability priority order).
 *
 * IMPORTANT — this is a standalone CLI tool, NOT imported by any test file.
 *   Tests run 100% without it. It's a developer productivity aid, not test infrastructure.
 *   This separation is intentional: AI helps developers write better tests,
 *   but the tests themselves don't depend on AI being available.
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
  // Step 1: Use Playwright (headless Chromium) to load the real page and capture its DOM.
  // WHY load the real page instead of hardcoding HTML?
  //   JavaScript-rendered content won't be in the static HTML. Loading the live page
  //   ensures we capture the actual DOM after JS execution — the same DOM Playwright
  //   tests will interact with.
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`\nNavigating to ${targetUrl}...`);
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle'); // Wait for all JS to finish rendering

  // Step 2: Extract the DOM snapshot and truncate it.
  // WHY truncate to 8000 chars?
  //   Claude API has a token limit per request. Full SPA HTML can be 100k+ chars.
  //   The first 8000 chars captures the main content area which is usually sufficient
  //   for identifying element attributes. A real production tool would be smarter
  //   about which part of the DOM to extract, but this works well for SauceDemo.
  const domSnapshot = await page.content();
  const truncated = domSnapshot.slice(0, 8000);
  await browser.close();

  console.log(`Analyzing DOM for "${description}"...\n`);

  // Step 3: Send DOM + element description to Claude API.
  // WHY claude-sonnet-4-6?
  //   Fast enough for CLI usage (response in ~2-3s), smart enough to understand
  //   Playwright selector APIs and explain stability trade-offs.
  const client = new Anthropic();
  // API key is automatically read from the ANTHROPIC_API_KEY environment variable.
  // new Anthropic() with no arguments uses the SDK's default key lookup.

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        // The prompt teaches Claude the priority order we want:
        //   getByTestId (most stable) > getByRole > getByText > CSS (least stable)
        // Claude returns selectors ranked by this priority with explanations.
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

  // Step 4: Print Claude's response to the terminal.
  const content = response.content[0];
  if (content.type === 'text') {
    console.log('Suggested selectors:\n');
    console.log(content.text);
  }
}

generateSelectors(url, elementDescription).catch(console.error);

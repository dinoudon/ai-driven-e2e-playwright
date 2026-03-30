// src/utils/ai/test-case-suggester.ts
/**
 * AI Utility: Test Case Suggester
 *
 * PURPOSE:
 *   Navigate to a page and generate categorized test scenarios using Claude.
 *   Covers positive, negative, boundary, and edge case tests.
 *
 * PROBLEM IT SOLVES:
 *   Starting test design from a blank page is slow and it's easy to miss scenarios.
 *   This tool produces a structured test plan in ~5 seconds, which a QA engineer
 *   then reviews, prunes, and implements. AI accelerates the thinking, not the coding.
 *
 * IMPORTANT — standalone CLI tool, NOT imported by any test file.
 *   Same separation principle as selector-generator: AI helps design, tests run independently.
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
  // Step 1: Load the page with real Playwright (captures JS-rendered DOM).
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`\nAnalyzing page: ${targetUrl}...`);
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle');

  // Step 2: Capture page title + DOM for Claude's context.
  // Page title gives Claude high-level context ("Swag Labs" → e-commerce app).
  // DOM gives Claude the specific elements and interactions available on this page.
  const pageTitle = await page.title();
  const domSnapshot = await page.content();
  const truncated = domSnapshot.slice(0, 8000); // Truncate to stay within token limits
  await browser.close();

  // Step 3: Ask Claude to generate categorized test scenarios.
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048, // More tokens than selector-generator — test plans are longer
    messages: [
      {
        role: 'user',
        // The prompt enforces a structured output format with 4 categories.
        // WHY these 4 categories?
        //   Positive: happy path — the feature works as expected
        //   Negative: error handling — what happens when input is wrong
        //   Boundary: edge values — empty, maximum, minimum
        //   Edge Cases: unusual but valid scenarios — special chars, concurrent actions, etc.
        // This maps directly to how QA engineers document test cases in real teams.
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

  // Step 4: Print suggestions — developer reviews and implements the ones that matter.
  const content = response.content[0];
  if (content.type === 'text') {
    console.log('\nSuggested test scenarios:\n');
    console.log(content.text);
  }
}

suggestTestCases(url).catch(console.error);

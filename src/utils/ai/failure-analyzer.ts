// src/utils/ai/failure-analyzer.ts
/**
 * AI Utility: Failure Analyzer
 *
 * PURPOSE:
 *   Analyze a test failure — error message + optional screenshot — and return:
 *   root cause, flaky vs. real bug classification, suggested fix, and prevention advice.
 *
 * PROBLEM IT SOLVES:
 *   CI test failures require context to diagnose: what was on screen, what error occurred,
 *   is it an app bug or a flaky test? Manually triaging each failure takes 5-15 minutes.
 *   This tool reduces that to ~30 seconds.
 *
 * KEY FEATURE — multimodal input:
 *   If a screenshot is provided, it's sent to Claude as a base64-encoded image alongside
 *   the error text. Claude can then "see" what the browser showed at the time of failure.
 *   This is the Claude API's vision capability — combining text + image in one request.
 *
 * IMPORTANT — standalone CLI tool, NOT imported by any test file.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> npx ts-node src/utils/ai/failure-analyzer.ts \
 *     --error "Locator not found" [--screenshot ./path/to/screenshot.png] [--trace ./trace.zip]
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const errorIndex = args.indexOf('--error');
const screenshotIndex = args.indexOf('--screenshot');
const traceIndex = args.indexOf('--trace');

if (errorIndex === -1) {
  console.error(
    'Usage: npx ts-node src/utils/ai/failure-analyzer.ts --error "<message>" [--screenshot <path>] [--trace <path>]'
  );
  process.exit(1);
}

const errorMessage = args[errorIndex + 1];
const screenshotPath = screenshotIndex !== -1 ? args[screenshotIndex + 1] : null;
const tracePath = traceIndex !== -1 ? args[traceIndex + 1] : null;

async function analyzeFailure(error: string, screenshotFile: string | null, traceFile: string | null): Promise<void> {
  console.log('\nAnalyzing test failure...\n');

  const client = new Anthropic();

  // Step 1: Build the message content array.
  // WHY an array instead of a plain string?
  //   Claude's API supports "multimodal" messages — content can be text, images, or both.
  //   We build the array conditionally: image first (if provided), then the text prompt.
  //   Claude processes them together: "given this screenshot, analyze this error".
  const messageContent: Anthropic.MessageParam['content'] = [];

  // Step 2: If a screenshot exists, read it and encode as base64 for the API.
  // WHY base64?
  //   The Claude API doesn't accept file paths — it accepts raw image data.
  //   base64 encodes binary image data as a string that can be sent in JSON.
  if (screenshotFile && fs.existsSync(screenshotFile)) {
    const imageData = fs.readFileSync(path.resolve(screenshotFile));
    const base64Image = imageData.toString('base64');
    messageContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: base64Image,
      },
    });
  }

  // Step 3: Add the text prompt with the error message (and trace reference if provided).
  // WHY is trace just a "reference" and not sent as a file?
  //   Playwright trace files (.zip) are binary and large — not suitable for API upload.
  //   We mention the trace path so Claude knows it exists and can suggest opening it
  //   in Playwright's trace viewer (npx playwright show-trace <path>).
  messageContent.push({
    type: 'text',
    text: `You are a Playwright automation expert. Analyze this test failure.

Error message:
${error}${traceFile ? `\n\nTrace file path (for reference): ${traceFile}` : ''}

Provide:
1. **Root Cause** — most likely reason for this failure
2. **Flaky vs Real Bug** — is this likely a flaky test or a real application bug?
3. **Suggested Fix** — specific Playwright code change to resolve it
4. **Prevention** — how to prevent this class of failure in future tests`,
  });

  // Step 4: Send to Claude — single request with text + optional image.
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: messageContent }],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    console.log('Failure Analysis:\n');
    console.log(content.text);
  }
}

analyzeFailure(errorMessage, screenshotPath, tracePath).catch(console.error);

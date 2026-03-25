// src/utils/ai/failure-analyzer.ts
/**
 * AI Utility: Failure Analyzer
 * Analyzes a test failure and suggests root cause and fix.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> npx ts-node src/utils/ai/failure-analyzer.ts \
 *     --error "Locator not found" [--screenshot ./path/to/screenshot.png]
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
  const messageContent: Anthropic.MessageParam['content'] = [];

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

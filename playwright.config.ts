import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Run all tests in all files in parallel.
  // WHY fullyParallel: true?
  //   Playwright can run independent tests concurrently — much faster than sequential.
  //   Each test gets its own browser context so they don't share state.
  fullyParallel: true,

  // Fail the CI build if any test has test.only() left in the code.
  // WHY? test.only() is a debugging tool — if it gets committed, only that one test runs in CI.
  // This catches that mistake automatically.
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI, but not locally.
  // WHY retry on CI but not locally?
  //   Network/timing issues are more common on shared CI machines.
  //   Locally, we want immediate feedback when a test fails — no retries.
  retries: process.env.CI ? 2 : 0,

  // Limit parallelism on CI to avoid resource contention.
  // WHY 2 workers on CI but unlimited locally?
  //   CI machines have limited CPU/memory. 2 workers prevents OOM while still
  //   being faster than sequential. Locally, Playwright uses 50% of CPUs by default.
  workers: process.env.CI ? 2 : undefined,

  // Three reporters:
  //   list       → real-time pass/fail output in the terminal
  //   html       → Playwright's built-in HTML report (saved to playwright-report/)
  //   allure     → Allure JSON results (saved to allure-results/, deployed to GitHub Pages)
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { detail: true, outputFolder: 'allure-results' }],
  ],

  use: {
    baseURL: 'https://www.saucedemo.com',

    // WHY testIdAttribute: 'data-test'?
    //   SauceDemo uses data-test="..." (not data-testid which is the Playwright default).
    //   Setting this globally means getByTestId('username') → [data-test="username"]
    //   without needing to override it per test.
    testIdAttribute: 'data-test',

    // Capture traces and videos only on the first retry to keep artifact size manageable.
    // WHY on-first-retry instead of always?
    //   Traces are large. We only need them when a test flaked or failed — not on every pass.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    actionTimeout: 15_000,     // Max time for any single action (click, fill, etc.)
    navigationTimeout: 30_000, // Max time for page.goto() or waitForURL()
  },

  expect: {
    timeout: 10_000, // Max time for any expect() assertion (e.g., toBeVisible, toHaveURL)
  },

  projects: [
    // ── Setup Project ──────────────────────────────────────────────────────────
    // Runs auth.setup.ts ONCE at the start: logs in as standard_user,
    // saves cookies/session to .auth/user.json.
    // WHY run setup first?
    //   The 3 browser projects (chromium, firefox, webkit) declare dependencies: ['setup'].
    //   They inject the saved storageState, so each test starts pre-logged-in —
    //   no login step repeated in every test, much faster and less brittle.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // ── Auth Tests Project ─────────────────────────────────────────────────────
    // Runs login.spec.ts directly, WITHOUT injecting storageState.
    // WHY separate from the browser projects?
    //   Login tests test the login form itself — they must NOT start pre-logged-in.
    //   If they used storageState they'd skip the login step entirely and the tests
    //   would be meaningless. No dependency on setup either.
    {
      name: 'auth-tests',
      testMatch: /tests\/auth\/.*\.spec\.ts/,
    },

    // ── Chromium Feature Tests ─────────────────────────────────────────────────
    // Runs all non-auth tests on Desktop Chrome, starting pre-logged-in.
    {
      name: 'chromium',
      testIgnore: /tests\/auth\/.*/,       // Skip login tests (handled by auth-tests project)
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',   // Inject saved auth state — tests start logged in
      },
      dependencies: ['setup'],             // Wait for setup project to finish first
    },

    // ── Firefox Feature Tests ──────────────────────────────────────────────────
    {
      name: 'firefox',
      testIgnore: /tests\/auth\/.*/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── WebKit Feature Tests ───────────────────────────────────────────────────
    // WHY WebKit? It's the engine behind Safari on macOS and iOS.
    // Cross-browser coverage that includes WebKit ensures mobile Safari compatibility
    // without needing a real macOS machine — Playwright bundles its own WebKit build.
    {
      name: 'webkit',
      testIgnore: /tests\/auth\/.*/,
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});

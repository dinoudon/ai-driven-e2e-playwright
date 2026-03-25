# AI-Driven E2E Playwright

![E2E Tests](https://github.com/<YOUR_USERNAME>/ai-driven-e2e-playwright/actions/workflows/e2e.yml/badge.svg)
[![Allure Report](https://img.shields.io/badge/Allure-Report-orange)](https://<YOUR_USERNAME>.github.io/ai-driven-e2e-playwright/)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Playwright](https://img.shields.io/badge/Playwright-1.50-green)

End-to-end test automation suite demonstrating AI-driven testing practices using Playwright and TypeScript. Tests target [SauceDemo](https://www.saucedemo.com) with deep coverage on critical flows and Claude API-powered AI utilities for enhanced developer productivity.

## Key Features

- **Page Object Model** — Clean POM architecture, zero `waitForTimeout()` calls, zero XPath selectors
- **AI Utilities** — 3 standalone CLI tools powered by Claude API: selector generation, test case suggestions, failure analysis
- **Multi-browser** — Tests run on Chromium, Firefox, and WebKit
- **Comprehensive coverage** — Positive, negative, boundary, and edge case scenarios
- **CI/CD** — GitHub Actions with Allure report deployed to GitHub Pages
- **Test tagging** — `@smoke`, `@regression`, `@negative`, `@edge-case`

## Quick Start

```bash
# Install dependencies and browsers
npm install && npx playwright install

# Run all tests
npx playwright test

# Generate and open Allure report
npm run report
```

## Project Architecture

```
src/
├── pages/          # Page Object Models
│   ├── BasePage.ts         # Shared navigation and wait helpers
│   ├── LoginPage.ts
│   ├── ProductsPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
├── fixtures/
│   └── test.fixture.ts     # Extended test with all POMs pre-wired
└── utils/ai/               # AI productivity utilities
    ├── selector-generator.ts
    ├── test-case-suggester.ts
    └── failure-analyzer.ts
tests/
├── auth/           # Login/logout — deep coverage (positive, negative, boundary, edge)
├── products/       # Product browsing — standard coverage
├── cart/           # Cart management — standard coverage
└── checkout/       # Checkout flow — deep coverage (positive, negative, boundary, edge)
```

## AI Integration

Three standalone CLI utilities powered by the [Claude API](https://www.anthropic.com). Tests run perfectly without them — they exist to make test authoring and maintenance faster.

> Requires `ANTHROPIC_API_KEY` in your environment.

### Selector Generator
Analyzes a page's DOM and suggests the most stable Playwright selectors for a given element:
```bash
ANTHROPIC_API_KEY=<key> npx ts-node src/utils/ai/selector-generator.ts \
  --url https://www.saucedemo.com \
  --element "login button"
```

### Test Case Suggester
Navigates to a page and generates categorized test scenarios (positive/negative/boundary/edge):
```bash
ANTHROPIC_API_KEY=<key> npx ts-node src/utils/ai/test-case-suggester.ts \
  --url https://www.saucedemo.com/inventory.html
```

### Failure Analyzer
Analyzes a test failure error message and optionally a screenshot to identify root cause:
```bash
ANTHROPIC_API_KEY=<key> npx ts-node src/utils/ai/failure-analyzer.ts \
  --error "Locator not found: getByTestId('login-button')" \
  --screenshot ./test-results/screenshot.png
```

## Test Coverage

| Feature | Coverage | Scenarios |
|---------|----------|-----------|
| **Login** | Deep | Valid login `@smoke`, session persistence, wrong credentials, empty fields, locked user, max-length input, XSS attempt, back-button behavior |
| **Products** | Standard | All 6 products display, A-Z/Z-A/price sorting, product detail, back navigation |
| **Cart** | Standard | Add/remove items, badge count, continue shopping |
| **Checkout** | Deep | Full flow `@smoke`, multi-item, missing fields `@negative`, special chars in zip, long names, cancel navigation, empty cart edge case |

## CI/CD

Tests run automatically on every push and PR. The Allure report is deployed to GitHub Pages on main branch pushes.

[View Live Allure Report](https://<YOUR_USERNAME>.github.io/ai-driven-e2e-playwright/)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Test framework | [Playwright](https://playwright.dev) ^1.50.0 |
| Language | TypeScript ^5.3.0 |
| AI integration | [Claude API](https://www.anthropic.com) via @anthropic-ai/sdk |
| CI/CD | GitHub Actions |
| Reporting | [Allure](https://allurereport.org) ^3.0 |
| Target app | [SauceDemo](https://www.saucedemo.com) |
| Browsers | Chromium, Firefox, WebKit |

/**
 * Playwright Configuration
 *
 * Mobile-First E2E Testing Setup
 *
 * Configuration:
 * - Device: iPhone 12 (375x812)
 * - Browser: WebKit (Safari)
 * - Base URL: http://localhost:3000
 * - Authentication: Enabled via setup project
 *
 * Projects:
 * 1. setup - Authenticates test user (runs first)
 * 2. mobile - All mobile E2E tests (uses authenticated state)
 *
 * Usage:
 * - Run all tests: npx playwright test
 * - Run mobile only: npx playwright test --project=mobile
 * - Run with UI: npx playwright test --ui
 * - Debug mode: npx playwright test --debug
 *
 * Author: Agent 3 - Mobile Testing & Performance Specialist
 * Date: 2026-02-18
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',

  // Timeout per test (30 seconds)
  timeout: 30000,

  // Run tests in parallel (disabled for now - sequential is more stable)
  fullyParallel: false,

  // Fail CI if you accidentally leave test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Single worker (no parallel execution)
  workers: 1,

  // Reporter: list for terminal output
  reporter: 'list',

  // Shared settings for all projects
  use: {
    // Base URL for all page.goto() calls
    baseURL: 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on retry
    video: 'retain-on-failure',
  },

  // Projects configuration
  projects: [
    // Setup project - runs authentication before tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
    },

    // Mobile tests project
    {
      name: 'mobile',
      testMatch: /mobile\/.*\.spec\.ts$/,
      use: {
        // Use iPhone 12 device preset
        ...devices['iPhone 12'],

        // Load authenticated state from setup
        storageState: 'tests/mobile/.auth/user.json',
      },
      // Depend on setup project (runs after authentication)
      dependencies: ['setup'],
    },
  ],

  // Dev server configuration (optional)
  // Uncomment to auto-start dev server before tests
  /*
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  */
});

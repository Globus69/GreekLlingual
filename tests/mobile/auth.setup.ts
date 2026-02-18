/**
 * Playwright Authentication Setup
 *
 * Purpose: Authenticate E2E tests to access protected mobile pages
 *
 * This setup script:
 * 1. Navigates to /login-pin
 * 2. Enters test user PIN (3741 - Anna Meier)
 * 3. Saves authenticated session to storageState
 *
 * The storageState is then used by all mobile E2E tests
 * to bypass authentication and test protected features.
 *
 * Test User: Anna Meier
 * PIN: 3741
 * Role: student
 * Level: A1
 *
 * Author: Agent 3 - Mobile Testing & Performance Specialist
 * Date: 2026-02-18
 */

import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'tests/mobile/.auth/user.json';

setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication...');

  // Navigate to login page
  await page.goto('http://localhost:3000/login-pin');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  console.log('📍 On login page, entering PIN...');

  // Find PIN input field (tel type for numeric keyboard)
  const pinInput = page.locator('input[type="tel"]');

  // Wait for input to be visible
  await pinInput.waitFor({ state: 'visible', timeout: 5000 });

  // Fill test PIN (3741 - Anna Meier)
  await pinInput.fill('3741');

  console.log('✅ PIN entered');

  // Find and click submit button
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  console.log('📤 Login submitted, waiting for redirect...');

  // Wait for redirect to mobile dashboard
  // This confirms authentication was successful
  await page.waitForURL('**/m', { timeout: 10000 });

  console.log('✅ Successfully authenticated - redirected to /m');

  // Verify we're actually on the dashboard (not redirected back to login)
  await expect(page).toHaveURL(/\/m$/);

  // Save authenticated state to file
  await page.context().storageState({
    path: AUTH_FILE
  });

  console.log(`💾 Authentication state saved to ${AUTH_FILE}`);
  console.log('✅ Authentication setup complete');
});

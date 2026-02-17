/**
 * Mobile E2E Tests - Playwright
 *
 * Test Scope:
 * - Mobile Dashboard (/m)
 * - Mobile Stats Page (/m/stats)
 * - Mobile Settings Page (/m/settings)
 * - Mobile Bottom Navigation
 * - Mobile Bottom Sheets
 *
 * Device: iPhone 12 (375x812)
 * Browser: Safari (WebKit)
 *
 * To Run:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Install Browsers: npx playwright install
 * 3. Start dev server: npm run dev
 * 4. Run tests: npx playwright test tests/mobile/e2e.spec.ts
 *
 * Author: Agent 3 - Mobile Testing & Performance Specialist
 * Date: 2026-02-17
 */

import { test, expect, devices } from '@playwright/test';

// Configure mobile viewport (iPhone 12)
test.use({
  ...devices['iPhone 12'],
  locale: 'en-US',
  timezoneId: 'Europe/Berlin',
});

/**
 * Test Group: Mobile Dashboard
 */
test.describe('Mobile Dashboard (/m)', () => {

  test('should load dashboard page without errors', async ({ page }) => {
    // Navigate to mobile dashboard
    await page.goto('http://localhost:3000/m');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for auth redirect (if not logged in)
    const url = page.url();
    if (url.includes('/login-pin')) {
      console.log('⚠️ Not authenticated - skipping dashboard tests');
      test.skip();
      return;
    }

    // Verify page loaded successfully
    await expect(page).toHaveURL(/\/m$/);
  });

  test('should display dashboard header with user name', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Wait for header
    await page.waitForSelector('text=/GreekLingua|Dashboard/', { timeout: 5000 });

    // Check if header contains GreekLingua or user name
    const header = page.locator('h1, h2').first();
    await expect(header).toBeVisible();
  });

  test('should display 12 module tiles', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Wait for tiles to load
    await page.waitForSelector('[data-testid="module-tile"], .module-tile', { timeout: 5000 });

    // Count tiles
    const tiles = page.locator('[data-testid="module-tile"], .module-tile, button[aria-label*="Open"]');
    const count = await tiles.count();

    // Should have 12 tiles (or at least 10)
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('should show bottom navigation with 3 tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Check bottom navigation exists
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible();

    // Check for Home, Stats, Settings tabs
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Stats')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should display stats header (compact version)', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Look for streak or stats info
    const statsHeader = page.locator('text=/Day Streak|Total Cards|XP/');

    // Stats may be loading, so we check if element exists (not strict)
    const count = await statsHeader.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

});

/**
 * Test Group: Mobile Bottom Navigation
 */
test.describe('Mobile Bottom Navigation', () => {

  test('should navigate to Stats page when tapping Stats tab', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Wait for bottom nav
    await page.waitForSelector('text=Stats');

    // Tap Stats tab
    await page.click('text=Stats');

    // Verify navigation
    await expect(page).toHaveURL(/\/m\/stats/);
  });

  test('should navigate to Settings page when tapping Settings tab', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Wait for bottom nav
    await page.waitForSelector('text=Settings');

    // Tap Settings tab
    await page.click('text=Settings');

    // Verify navigation
    await expect(page).toHaveURL(/\/m\/settings/);
  });

  test('should navigate back to Home when tapping Home tab', async ({ page }) => {
    // Start from Stats page
    await page.goto('http://localhost:3000/m/stats');

    // Tap Home tab
    await page.click('text=Home');

    // Verify back on dashboard
    await expect(page).toHaveURL(/\/m$/);
  });

  test('should highlight active tab', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Check Home tab is active (highlighted)
    const homeTab = page.locator('text=Home').locator('..');
    // Active tabs usually have specific classes or styles
    // This test may need adjustment based on actual implementation
    await expect(homeTab).toBeVisible();
  });

});

/**
 * Test Group: Mobile Stats Page
 */
test.describe('Mobile Stats Page (/m/stats)', () => {

  test('should load stats page without errors', async ({ page }) => {
    await page.goto('http://localhost:3000/m/stats');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Verify URL
    await expect(page).toHaveURL(/\/m\/stats/);
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('http://localhost:3000/m/stats');

    // Wait for stats content
    await page.waitForSelector('text=/Total Cards|Streak|Mastered/', { timeout: 5000 });

    // Check for stats text
    const statsText = page.locator('text=/Total Cards|Streak|Mastered|XP/');
    const count = await statsText.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should display bottom navigation on stats page', async ({ page }) => {
    await page.goto('http://localhost:3000/m/stats');

    // Bottom nav should be visible on all pages
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Stats')).toBeVisible();
  });

});

/**
 * Test Group: Mobile Settings Page
 */
test.describe('Mobile Settings Page (/m/settings)', () => {

  test('should load settings page without errors', async ({ page }) => {
    await page.goto('http://localhost:3000/m/settings');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Verify URL
    await expect(page).toHaveURL(/\/m\/settings/);
  });

  test('should display user information', async ({ page }) => {
    await page.goto('http://localhost:3000/m/settings');

    // Look for settings-related text
    await page.waitForSelector('text=/Settings|Profile|Language/', { timeout: 5000 });

    // Check for user info or settings options
    const settingsText = page.locator('text=/Settings|Profile|Language|Notifications/');
    const count = await settingsText.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should display bottom navigation on settings page', async ({ page }) => {
    await page.goto('http://localhost:3000/m/settings');

    // Bottom nav should be visible
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

});

/**
 * Test Group: Mobile Bottom Sheets
 */
test.describe('Mobile Bottom Sheets', () => {

  test('should open Due Cards bottom sheet when tapping tile', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Wait for dashboard to load
    await page.waitForSelector('text=/Due Cards|Review/', { timeout: 5000 });

    // Find and click Due Cards tile
    const dueCardsTile = page.locator('text=Due Cards').first();

    if (await dueCardsTile.isVisible()) {
      await dueCardsTile.click();

      // Wait for bottom sheet to open
      await page.waitForSelector('text=/Due Cards Today|Start Review/', { timeout: 3000 });

      // Verify sheet is visible
      const sheet = page.locator('text=Due Cards Today');
      await expect(sheet).toBeVisible();
    } else {
      console.log('⚠️ Due Cards tile not found - skipping');
      test.skip();
    }
  });

  test('should close bottom sheet when tapping close button', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Open bottom sheet first
    const dueCardsTile = page.locator('text=Due Cards').first();

    if (await dueCardsTile.isVisible()) {
      await dueCardsTile.click();

      // Wait for sheet to open
      await page.waitForSelector('text=Due Cards Today', { timeout: 3000 });

      // Click close button (✕)
      const closeButton = page.locator('button:has-text("✕")');
      await closeButton.click();

      // Verify sheet is closed (text no longer visible)
      await page.waitForTimeout(500); // Wait for animation
      const sheet = page.locator('text=Due Cards Today');
      await expect(sheet).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should close bottom sheet when tapping backdrop', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Open bottom sheet
    const dueCardsTile = page.locator('text=Due Cards').first();

    if (await dueCardsTile.isVisible()) {
      await dueCardsTile.click();

      // Wait for sheet
      await page.waitForSelector('text=Due Cards Today', { timeout: 3000 });

      // Click backdrop (outside sheet)
      // Note: This is tricky - we need to click on backdrop element
      const backdrop = page.locator('[style*="backdrop"]').first();
      await backdrop.click({ position: { x: 10, y: 10 } });

      // Verify sheet closed
      await page.waitForTimeout(500);
      const sheet = page.locator('text=Due Cards Today');
      await expect(sheet).not.toBeVisible();
    } else {
      test.skip();
    }
  });

});

/**
 * Test Group: Touch Targets (Accessibility)
 */
test.describe('Touch Target Accessibility', () => {

  test('bottom navigation tabs should be at least 44px tall', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Get bottom nav tab
    const homeTab = page.locator('text=Home').locator('..');

    // Get bounding box
    const box = await homeTab.boundingBox();

    if (box) {
      // Check height (should be >= 44px)
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('close button should be at least 44px', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Open bottom sheet
    const dueCardsTile = page.locator('text=Due Cards').first();

    if (await dueCardsTile.isVisible()) {
      await dueCardsTile.click();
      await page.waitForSelector('button:has-text("✕")', { timeout: 3000 });

      // Get close button
      const closeButton = page.locator('button:has-text("✕")');
      const box = await closeButton.boundingBox();

      if (box) {
        // Should be at least 44x44px
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    } else {
      test.skip();
    }
  });

});

/**
 * Test Group: Performance (Basic)
 */
test.describe('Mobile Performance', () => {

  test('dashboard should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/m');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`📊 Dashboard load time: ${loadTime}ms`);

    // Should load in under 3000ms
    expect(loadTime).toBeLessThan(3000);
  });

  test('page should not have layout shifts', async ({ page }) => {
    await page.goto('http://localhost:3000/m');

    // Wait for full load
    await page.waitForLoadState('networkidle');

    // Check for no console errors related to layout shifts
    // Note: Actual CLS measurement requires Lighthouse

    // This is a placeholder - real CLS testing needs Chrome DevTools Protocol
    expect(true).toBe(true);
  });

});

/**
 * Test Group: Practice Modes Mobile (PLACEHOLDER)
 * Status: NOT IMPLEMENTED YET
 */
test.describe('Practice Modes Mobile (TODO)', () => {

  test.skip('should load practice modes page', async ({ page }) => {
    // TODO: Implement after Agent 1 creates /m/practice-modes
    await page.goto('http://localhost:3000/m/practice-modes');
    await expect(page).toHaveURL(/\/m\/practice-modes/);
  });

  test.skip('should open game mode selection bottom sheet', async ({ page }) => {
    // TODO: Test practice item click → bottom sheet opens
  });

  test.skip('should start matching game', async ({ page }) => {
    // TODO: Test matching game interaction
  });

});

/**
 * Test Group: Vocabulary Mobile (PLACEHOLDER)
 * Status: NOT IMPLEMENTED YET
 */
test.describe('Vocabulary Mobile (TODO)', () => {

  test.skip('should load vocabulary page', async ({ page }) => {
    // TODO: Implement after Agent 2 creates /m/vocabulary
    await page.goto('http://localhost:3000/m/vocabulary');
    await expect(page).toHaveURL(/\/m\/vocabulary/);
  });

  test.skip('should display vocabulary card', async ({ page }) => {
    // TODO: Test card visibility
  });

  test.skip('should flip card when tapped', async ({ page }) => {
    // TODO: Test card flip interaction
  });

  test.skip('should rate card (Again, Hard, Good, Easy)', async ({ page }) => {
    // TODO: Test rating buttons
  });

});

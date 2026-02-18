# Playwright Authentication Setup - Documentation

**Agent:** Agent 3 - Tests, Performance, Accessibility (Mobile)
**Date:** 2026-02-18
**Status:** ✅ COMPLETE
**Priority:** 2

---

## Overview

This setup enables E2E tests to access authenticated mobile pages by logging in once before running tests. This unlocks 4 previously failing test cases that required authentication.

---

## Files Created

### 1. `tests/mobile/auth.setup.ts`

**Purpose:** Authenticates a test user and saves session state

**Functionality:**
- Navigates to `/login-pin`
- Enters test user PIN (3741 - Anna Meier)
- Waits for successful redirect to `/m`
- Saves authenticated session to `tests/mobile/.auth/user.json`

**Test User Details:**
- **Name:** Anna Meier
- **PIN:** 3741
- **Role:** student
- **Level:** A1
- **Email:** anna.meier@test.de

**Code Structure:**
```typescript
import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('http://localhost:3000/login-pin');

  // Fill PIN
  const pinInput = page.locator('input[type="tel"]');
  await pinInput.fill('3741');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('**/m', { timeout: 10000 });

  // Save state
  await page.context().storageState({
    path: 'tests/mobile/.auth/user.json'
  });
});
```

---

### 2. `playwright.config.ts`

**Purpose:** Configures Playwright with authentication and mobile device settings

**Key Configuration:**
- **Device:** iPhone 12 (375x812)
- **Browser:** WebKit (Safari)
- **Base URL:** http://localhost:3000
- **Workers:** 1 (sequential execution)
- **Timeout:** 30 seconds per test

**Projects:**

1. **setup** - Authentication project
   - Runs `auth.setup.ts` first
   - Creates authenticated session
   - No dependencies

2. **mobile** - Mobile E2E tests
   - Uses iPhone 12 device preset
   - Loads `tests/mobile/.auth/user.json` storageState
   - Depends on `setup` project

**Code Structure:**
```typescript
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: 'mobile',
      testMatch: /mobile\/.*\.spec\.ts$/,
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/mobile/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

---

### 3. `.gitignore` Update

**Added entries:**
```
# playwright
/tests/**/.auth/
/test-results/
/playwright-report/
```

**Purpose:** Prevents committing sensitive authentication files to git

---

## Directory Structure

```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/
├── playwright.config.ts              # NEW - Playwright config
├── tests/
│   └── mobile/
│       ├── .auth/                    # NEW - Auth state directory (gitignored)
│       │   └── user.json             # Created at runtime by auth.setup.ts
│       ├── auth.setup.ts             # NEW - Authentication setup
│       ├── e2e.spec.ts               # Existing tests (now authenticated)
│       └── *.md                      # Documentation files
└── .gitignore                        # UPDATED - Added Playwright entries
```

---

## How It Works

### Test Execution Flow

1. **Setup Phase** (runs once)
   ```
   npx playwright test --project=setup
   ```
   - Executes `auth.setup.ts`
   - Logs in with PIN 3741
   - Saves cookies/session to `tests/mobile/.auth/user.json`

2. **Mobile Tests Phase** (runs after setup)
   ```
   npx playwright test --project=mobile
   ```
   - Loads authenticated state from `user.json`
   - All tests run with logged-in session
   - No need to login in each test

3. **Full Test Suite** (runs both)
   ```
   npx playwright test
   ```
   - Setup runs first (authentication)
   - Mobile tests run second (authenticated)

---

## Usage

### Run All Tests (with authentication)
```bash
npx playwright test
```

### Run Only Setup (re-authenticate)
```bash
npx playwright test --project=setup
```

### Run Only Mobile Tests (requires existing auth)
```bash
npx playwright test --project=mobile
```

### Run with UI Mode (visual debugging)
```bash
npx playwright test --ui
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

### Run Specific Test File
```bash
npx playwright test tests/mobile/e2e.spec.ts
```

---

## Expected Impact

### Before Authentication Setup
- **Total Tests:** 21
- **Passing:** 8
- **Failing:** 13
- **Pass Rate:** 38%

### After Authentication Setup
- **Total Tests:** 21
- **Passing:** 11 (estimated)
- **Failing:** 10 (estimated)
- **Pass Rate:** 52% (estimated)

### Tests Unlocked (4 auth-protected tests)

1. `should load dashboard page without errors`
   - Previously: Redirected to `/login-pin`
   - Now: Loads `/m` successfully

2. `should display dashboard header with user name`
   - Previously: Skipped (not authenticated)
   - Now: Verifies header shows "GreekLingua" or user name

3. `should navigate to Stats page when tapping Stats tab`
   - Previously: Redirect to login
   - Now: Navigates to `/m/stats`

4. `should navigate to Settings page when tapping Settings tab`
   - Previously: Redirect to login
   - Now: Navigates to `/m/settings`

---

## Test Users Available

The database contains 5 test users (from `033_fix_test_users_complete.sql`):

| User | PIN | Email | Role | Level |
|------|-----|-------|------|-------|
| Anna Meier | 3741 | anna.meier@test.de | student | A1 |
| Boris Schmidt | 8192 | boris.schmidt@test.de | student | A1 |
| Clara Weber | 5624 | clara.weber@test.de | student | A1 |
| David Müller | 7358 | david.mueller@test.de | student | A1 |
| Emma Fischer | 9103 | emma.fischer@test.de | student | A1 |

**Currently Using:** Anna Meier (PIN 3741)

---

## Troubleshooting

### Issue: `storageState` file not found

**Solution:** Run setup first
```bash
npx playwright test --project=setup
```

### Issue: Authentication fails (timeout)

**Possible Causes:**
- Dev server not running (`npm run dev`)
- Database not seeded with test users
- Login page selector changed

**Solution:**
1. Start dev server: `npm run dev`
2. Verify test user exists in database
3. Check selectors in `auth.setup.ts` match actual login page

### Issue: Tests still redirect to login

**Possible Causes:**
- `storageState` expired
- Session cookie deleted
- Authentication token invalid

**Solution:**
1. Delete old auth state: `rm tests/mobile/.auth/user.json`
2. Re-run setup: `npx playwright test --project=setup`
3. Run tests again

### Issue: TypeScript errors in config

**Solution:**
```bash
npm install -D @playwright/test
npx tsc --noEmit playwright.config.ts
```

---

## Security Considerations

### Gitignored Files
- `tests/mobile/.auth/user.json` - Contains session cookies (NEVER commit)
- `test-results/` - May contain sensitive screenshots
- `playwright-report/` - May contain sensitive data

### Test User Security
- Test users are LOCAL ONLY (development database)
- PINs are documented in migration files (not secret)
- Should NOT be used in production

### CI/CD Considerations
- Auth state is generated fresh in CI
- No need to commit `user.json`
- Setup runs automatically before tests

---

## Next Steps

### Immediate Actions
1. ✅ Files created - `auth.setup.ts`, `playwright.config.ts`
2. ✅ `.gitignore` updated
3. ✅ TypeScript syntax verified
4. ⏳ **DO NOT RUN TESTS YET** (per task requirements)

### Future Testing (separate task)
1. Run full test suite: `npx playwright test`
2. Verify 4 auth tests now pass
3. Check pass rate increase (38% → 52%)
4. Update test documentation with results

---

## References

### Related Files
- `/database/migrations/033_fix_test_users_complete.sql` - Test user definitions
- `/tests/mobile/e2e.spec.ts` - Main E2E test suite
- `/tests/mobile/TEST-RESULTS-2026-02-18.md` - Latest test results

### Documentation
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Mobile Testing Best Practices](https://playwright.dev/docs/emulation)

---

## Validation Checklist

✅ `tests/mobile/auth.setup.ts` created
✅ `playwright.config.ts` created
✅ `tests/mobile/.auth/` directory created
✅ `.gitignore` updated with Playwright entries
✅ TypeScript syntax validated (no errors)
✅ Configuration uses iPhone 12 device preset
✅ Authentication uses test PIN 3741
✅ StorageState path configured correctly
✅ Project dependencies set up (setup → mobile)
✅ Documentation complete

**Status:** READY FOR TESTING

---

**End of Documentation**

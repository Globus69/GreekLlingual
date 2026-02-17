# 🔒 Security Tests - Manual Testing Guide

## ⚠️ Known Issues (Non-Blocking)
- **Infinite recursion in users table RLS policy** - This error occurs during login but doesn't prevent functionality
- **Dev server already running** - Port 3000 is in use, app accessible

---

## 🧪 Manual Test Procedures

### Test 1: Honeypot PIN Detection (Client-Side)

**Test PIN**: `0000` (honeypot)

**Steps**:
1. Open http://localhost:3000/login-pin in browser
2. Open Browser DevTools (F12) → Console tab
3. Enter PIN: `0000`
4. Click "Anmelden"

**Expected Console Logs**:
```
🍯 Honeypot-PIN detected: 0000
📱 Telegram alert sent: {...}
```

**Expected UI**:
- Error popup: "⚠️ Sicherheitswarnung - Ungültiger PIN"
- No actual login attempt
- Popup disappears after 2 seconds

**Test Result**: ⬜ Pass / ⬜ Fail
**Notes**: _____________________

---

### Test 2: Progressive Delays

**Steps**:
1. Open http://localhost:3000/login-pin
2. Enter invalid PIN: `9876`
3. Note the time before clicking "Anmelden"
4. Note the time when error appears
5. Repeat 5 times, measuring delays

**Expected Delays**:
- Attempt 1: ~0ms (instant)
- Attempt 2: ~1 second
- Attempt 3: ~2 seconds
- Attempt 4: ~5 seconds
- Attempt 5: ~10 seconds

**Actual Timings**:
- Attempt 1: _____ ms
- Attempt 2: _____ ms
- Attempt 3: _____ ms
- Attempt 4: _____ ms
- Attempt 5: _____ ms

**Test Result**: ⬜ Pass / ⬜ Fail

---

### Test 3: Account Lockout (SQL-Based)

**Prerequisites**: Have Supabase SQL Editor open

**Step 1: Reset Test Account**
```sql
-- Find a test student account
SELECT id, name, pin_4digit, failed_attempts, locked_until
FROM users
WHERE role = 'student' AND pin_4digit IS NOT NULL
LIMIT 5;

-- Pick one and reset it (replace YOUR_PIN)
UPDATE users
SET failed_attempts = 0, locked_until = NULL
WHERE pin_4digit = 'YOUR_PIN';
```

**Step 2: Record 5 Failed Attempts**
```sql
-- Run this 5 times (replace YOUR_PIN each time)
SELECT * FROM record_failed_login_attempt('YOUR_PIN');
```

**Expected Output (Attempt 1-4)**:
```json
{
  "success": true,
  "locked": false,
  "attempts": 1,
  "remaining": 4,
  "message": "4 attempts remaining"
}
```

**Expected Output (Attempt 5)**:
```json
{
  "success": true,
  "locked": true,
  "attempts": 5,
  "locked_until": "2026-02-14T11:45:00.000Z",
  "message": "Account locked for 15 minutes"
}
```

**Step 3: Verify Lockout**
```sql
SELECT * FROM check_account_lockout_status('YOUR_PIN');
```

**Expected**:
```json
{
  "found": true,
  "locked": true,
  "locked_until": "2026-02-14T11:45:00.000Z",
  "attempts": 5,
  "message": "Account is locked"
}
```

**Step 4: Cleanup**
```sql
UPDATE users
SET failed_attempts = 0, locked_until = NULL
WHERE pin_4digit = 'YOUR_PIN';
```

**Test Result**: ⬜ Pass / ⬜ Fail

---

### Test 4: Verify PIN RPC Function

**Test Valid PIN**:
```sql
-- Replace YOUR_PIN with actual student PIN
SELECT * FROM verify_user_4digit_pin(
  p_pin := 'YOUR_PIN',
  p_ip_address := '127.0.0.1',
  p_user_agent := 'Manual Test'
);
```

**Expected**: Returns user data (user_id, user_name, user_email, etc.)

**Test Invalid PIN**:
```sql
SELECT * FROM verify_user_4digit_pin(
  p_pin := '9999',
  p_ip_address := '127.0.0.1',
  p_user_agent := 'Manual Test'
);
```

**Expected**: Returns `error: 'Invalid PIN'`

**Test Honeypot PIN** (if honeypot_pins table exists):
```sql
-- First, check if honeypot_pins table exists and has 0000
SELECT * FROM honeypot_pins WHERE pin = '0000';

-- If exists, test it
SELECT * FROM verify_user_4digit_pin(
  p_pin := '0000',
  p_ip_address := '192.168.1.100',
  p_user_agent := 'Suspicious Test'
);
```

**Expected**: Returns `error: 'IP banned'` and creates entries in:
- `honeypot_log` table
- `banned_ips` table (banned_until = NOW() + 24 hours)

**Verify Ban**:
```sql
SELECT * FROM banned_ips WHERE ip_address = '192.168.1.100';
SELECT * FROM honeypot_log ORDER BY created_at DESC LIMIT 1;
```

**Test Result**: ⬜ Pass / ⬜ Fail

---

### Test 5: Rate Limiting (Redis)

**Note**: This test requires the dev server to be running and accessible.

**Method 1: Browser Automation (Recommended)**
1. Open http://localhost:3000/login-pin
2. Open Browser DevTools → Network tab
3. Enter invalid PIN `9876`
4. Click "Anmelden" **10 times rapidly** (as fast as possible)
5. Watch Network tab for rate limit responses

**Expected**:
- First 10 requests: Return normally (even if PIN is wrong)
- After 10 requests: May start getting delayed or rejected

**Method 2: cURL (Advanced)**
```bash
# Send 15 requests rapidly
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/login-pin \
    -H "Content-Type: application/json" \
    -d '{"pin":"9876"}' \
    -w "\nStatus: %{http_code}\n" \
    -s | head -1
  echo "---"
done
```

**Expected**: After 10 requests, rate limit should trigger (may see 429 status or delays).

**Test Result**: ⬜ Pass / ⬜ Fail

---

### Test 6: Honeypot Tables Structure

**Check if honeypot tables exist**:
```sql
-- Check honeypot_pins table
SELECT * FROM honeypot_pins LIMIT 10;

-- Check honeypot_log table
SELECT * FROM honeypot_log ORDER BY created_at DESC LIMIT 10;

-- Check banned_ips table
SELECT * FROM banned_ips WHERE banned_until > NOW();
```

**Expected Tables**:
1. `honeypot_pins` - Contains predefined honeypot PINs (0000, 1111, 1234, etc.)
2. `honeypot_log` - Logs all honeypot attempts with IP, PIN, timestamp
3. `banned_ips` - Active IP bans with reason and expiry

**Test Result**: ⬜ Pass / ⬜ Fail

---

## 🐛 Known Database Issues

### Issue 1: Infinite Recursion in Users Table RLS Policy

**Error Message**:
```
infinite recursion detected in policy for relation "users"
```

**Impact**:
- Occurs when querying users table directly
- Does NOT prevent login functionality
- Login via `verify_user_4digit_pin` works fine

**Workaround**:
- Use RPC functions (`verify_user_4digit_pin`, `verify_user_pin`) instead of direct table queries
- OR temporarily disable RLS for testing:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  -- Run tests
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ```

---

## 📊 Test Results

| Test | Feature | Status | Notes |
|------|---------|--------|-------|
| 1 | Honeypot (Client) | ⬜ | |
| 2 | Progressive Delays | ⬜ | |
| 3 | Account Lockout | ⬜ | |
| 4 | Verify PIN RPC | ⬜ | |
| 5 | Rate Limiting | ⬜ | |
| 6 | Honeypot Tables | ⬜ | |

---

## ✅ Quick Test Checklist

- [ ] Open http://localhost:3000/login-pin
- [ ] Test honeypot PIN `0000` → Check console logs
- [ ] Test invalid PIN `9876` × 5 → Measure delays
- [ ] Run SQL: `record_failed_login_attempt` × 5 → Check lockout
- [ ] Run SQL: `verify_user_4digit_pin` with valid/invalid PINs
- [ ] Test rate limit: 15 rapid login attempts
- [ ] Check honeypot tables exist in Supabase

---

## 🔍 Security Recommendations

### Recommendations After Testing:

1. **Fix RLS Policy**: Resolve infinite recursion in users table policy
   - Current RLS policies may have circular dependencies
   - Recommend reviewing all policies on users table

2. **Honeypot API Route**:
   - `/api/honeypot-alert` returns 404 (HTML page)
   - Verify route is built and deployed correctly

3. **Rate Limiting**:
   - Test with real Redis connection to verify sliding window
   - Monitor Redis key expiration (should be 1 minute)

4. **Telegram Alerts**:
   - Verify Supabase Edge Function `send-telegram` is deployed
   - Test alert delivery when honeypot PIN is entered

5. **IP Ban Persistence**:
   - Ensure banned_ips table is checked on every request
   - Test that banned IPs can't login even with correct PINs

---

**Last Updated**: 2026-02-14
**Tested By**: _____________________
**All Tests Passed**: ⬜ Yes / ⬜ No (___/6)

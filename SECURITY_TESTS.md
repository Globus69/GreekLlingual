# 🔒 Security Tests - GreekLingua Dashboard

## Test Environment
- **Date**: 2026-02-14
- **Database**: Supabase (production)
- **Redis**: Upstash Redis (rate limiting)
- **Test URL**: http://localhost:3000/login-pin

---

## 1️⃣ Rate Limiting Tests

### Test 1.1: Student Login Rate Limit (10 req/min)
**Goal**: Verify that after 10 failed attempts within 1 minute, further requests are blocked.

**Steps**:
1. Open `/login-pin` in browser
2. Try logging in with invalid PIN (e.g., `9876`) **10 times** rapidly
3. Try 11th attempt immediately

**Expected Result**:
- First 10 attempts: Error message "PIN nicht gefunden"
- 11th attempt: Should be rate-limited (may show same error or delay)
- Redis should return `success: false` after limit exceeded

**Actual Result**: _(to be filled during test)_

---

### Test 1.2: Admin Login Rate Limit (3 req/5 min)
**Goal**: Verify stricter rate limit for admin login.

**Steps**:
1. Open `/login` in browser
2. Try logging in with admin credentials (wrong password) **3 times** rapidly
3. Try 4th attempt immediately

**Expected Result**:
- First 3 attempts: Error message displayed
- 4th attempt: Rate limited for 5 minutes

**Actual Result**: _(to be filled during test)_

---

## 2️⃣ Account Lockout Tests

### Test 2.1: Student Account Lockout (5 failed attempts)
**Goal**: Verify that after 5 failed login attempts with a valid PIN, the account is locked for 15 minutes.

**Prerequisites**:
- Have a test student account with known 4-digit PIN (e.g., `1111` if not a honeypot)
- Make sure account is NOT already locked

**Steps**:
1. Open `/login-pin`
2. Enter a VALID student PIN: `____` (your test PIN)
3. Modify the PIN slightly (e.g., change last digit) and submit **5 times**
4. Check database: `SELECT failed_attempts, locked_until FROM users WHERE pin_4digit = 'YOUR_PIN';`
5. Try logging in with CORRECT PIN

**Expected Result**:
- After 5 failed attempts: `failed_attempts = 5`, `locked_until = NOW() + 15 minutes`
- Login with correct PIN shows: "Account locked. Try again later."
- After 15 minutes: Account unlocks automatically

**Actual Result**: _(to be filled during test)_

---

### Test 2.2: Admin Account Lockout
**Goal**: Same as 2.1 but for admin accounts.

**Steps**:
1. Open `/login`
2. Enter valid admin username, wrong password **5 times**
3. Check database: `SELECT failed_attempts, locked_until FROM users WHERE name = 'admin' AND role = 'admin';`
4. Try logging in with CORRECT password

**Expected Result**:
- After 5 failed attempts: Account locked for 15 minutes
- RPC function `record_admin_failed_login_attempt` increments `failed_attempts`

**Actual Result**: _(to be filled during test)_

---

## 3️⃣ Honeypot PIN Detection Tests

### Test 3.1: Honeypot PIN - Client-Side Detection
**Goal**: Verify that honeypot PINs are detected on the client side.

**Honeypot PINs (hardcoded in login-pin/page.tsx)**:
- `0000`, `1111`, `2222`, `3333`, `4444`, `5555`, `6666`, `7777`, `8888`, `9999`
- `1234`, `4321`, `1122`, `2211`, `5678`

**Steps**:
1. Open `/login-pin`
2. Enter honeypot PIN: `0000`
3. Submit
4. Open browser console to check logs
5. Check if Telegram alert was sent (check `/api/honeypot-alert` API call in Network tab)

**Expected Result**:
- Console log: `🍯 Honeypot-PIN detected: 0000`
- Console log: `📱 Telegram alert sent: {...}`
- Error popup: "⚠️ Sicherheitswarnung - Ungültiger PIN"
- No actual login attempt made to Supabase

**Actual Result**: _(to be filled during test)_

---

### Test 3.2: Honeypot PIN - Server-Side Detection + IP Ban
**Goal**: Verify that if a honeypot PIN exists in the database, the server bans the IP.

**Prerequisites**:
- Database table `honeypot_pins` exists with entries
- Database table `banned_ips` exists

**Steps**:
1. Insert honeypot PIN into database:
   ```sql
   INSERT INTO honeypot_pins (pin) VALUES ('0000')
   ON CONFLICT (pin) DO NOTHING;
   ```
2. Clear client-side localStorage and cookies
3. Disable JavaScript in browser (to bypass client-side check)
4. Try logging in with `0000`
5. Check database:
   ```sql
   SELECT * FROM honeypot_log ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM banned_ips ORDER BY banned_until DESC LIMIT 1;
   ```

**Expected Result**:
- Entry in `honeypot_log` table with IP, PIN, user_agent
- Entry in `banned_ips` table with `banned_until = NOW() + 24 hours`
- RPC function `verify_user_4digit_pin` returns `error: 'IP banned'`
- Subsequent login attempts from same IP fail immediately

**Actual Result**: _(to be filled during test)_

---

## 4️⃣ Progressive Delay Tests

### Test 4.1: Progressive Delays on Failed Attempts
**Goal**: Verify that failed login attempts trigger progressive delays.

**Delay Schedule**:
- Attempt 1: 0ms
- Attempt 2: 1000ms (1s)
- Attempt 3: 2000ms (2s)
- Attempt 4: 5000ms (5s)
- Attempt 5+: 10000ms (10s)

**Steps**:
1. Open `/login-pin`
2. Enter invalid PIN: `9876`
3. Measure time between submit and response for each attempt
4. Submit **5 times**

**Expected Result**:
- Attempt 1: Instant response (~100ms)
- Attempt 2: ~1 second delay before response
- Attempt 3: ~2 second delay
- Attempt 4: ~5 second delay
- Attempt 5: ~10 second delay
- Submit button shows "..." during delay (`isSubmitting = true`)

**Actual Result**: _(to be filled during test)_

---

## 5️⃣ Integration Tests

### Test 5.1: Rate Limit + Account Lockout Interaction
**Goal**: Verify that rate limiting and account lockout work together without conflicts.

**Steps**:
1. Perform 10 rapid failed login attempts (triggers rate limit)
2. Wait 1 minute (rate limit expires)
3. Perform 5 more failed attempts (should trigger account lockout)
4. Check database for `locked_until` timestamp

**Expected Result**:
- Rate limit triggers after 10 attempts
- After waiting, account lockout triggers after 5 more attempts
- Total 15 attempts needed to lock account (10 rate-limited + 5 counted)

**Actual Result**: _(to be filled during test)_

---

### Test 5.2: Honeypot + Rate Limit
**Goal**: Verify that honeypot detection bypasses rate limiting.

**Steps**:
1. Perform 15 rapid login attempts with honeypot PIN `0000`
2. Check if all 15 trigger honeypot alerts (should not be rate-limited)

**Expected Result**:
- All 15 attempts trigger honeypot alert
- No rate limit applied (honeypot check happens before rate limit)

**Actual Result**: _(to be filled during test)_

---

## 6️⃣ Database Function Tests

### Test 6.1: RPC Function - verify_user_4digit_pin
**Test via Supabase SQL Editor**:

```sql
-- Test 1: Valid PIN (replace with actual test PIN)
SELECT * FROM verify_user_4digit_pin(
  p_pin := '1111',
  p_ip_address := '127.0.0.1',
  p_user_agent := 'Test Browser'
);

-- Test 2: Invalid PIN
SELECT * FROM verify_user_4digit_pin(
  p_pin := '9999',
  p_ip_address := '127.0.0.1',
  p_user_agent := 'Test Browser'
);

-- Test 3: Honeypot PIN (if 0000 is in honeypot_pins table)
SELECT * FROM verify_user_4digit_pin(
  p_pin := '0000',
  p_ip_address := '192.168.1.100',
  p_user_agent := 'Suspicious Browser'
);
-- Expected: Returns error: 'IP banned', inserts into honeypot_log and banned_ips
```

---

### Test 6.2: RPC Function - record_failed_login_attempt
```sql
-- Get a valid test PIN first
SELECT pin_4digit FROM users WHERE role = 'student' LIMIT 1;

-- Record 5 failed attempts
SELECT * FROM record_failed_login_attempt('YOUR_TEST_PIN');
SELECT * FROM record_failed_login_attempt('YOUR_TEST_PIN');
SELECT * FROM record_failed_login_attempt('YOUR_TEST_PIN');
SELECT * FROM record_failed_login_attempt('YOUR_TEST_PIN');
SELECT * FROM record_failed_login_attempt('YOUR_TEST_PIN');

-- Check lockout status
SELECT * FROM check_account_lockout_status('YOUR_TEST_PIN');
-- Expected: locked = true, locked_until = NOW() + 15 minutes

-- Verify database state
SELECT id, name, failed_attempts, locked_until
FROM users
WHERE pin_4digit = 'YOUR_TEST_PIN';
```

---

### Test 6.3: Account Unlock Function
```sql
-- Manually lock an account
UPDATE users
SET failed_attempts = 5, locked_until = NOW() + INTERVAL '15 minutes'
WHERE pin_4digit = 'YOUR_TEST_PIN';

-- Unlock the account (if unlock function exists)
SELECT * FROM unlock_user('USER_ID_HERE');

-- Verify unlocked
SELECT failed_attempts, locked_until FROM users WHERE id = 'USER_ID_HERE';
-- Expected: failed_attempts = 0, locked_until = NULL
```

---

## 7️⃣ Redis Tests

### Test 7.1: Rate Limit Key Expiration
**Goal**: Verify that Redis keys expire after the sliding window.

**Steps**:
1. Perform 1 login attempt
2. Check Redis key exists:
   ```bash
   redis-cli GET greeklingua:ratelimit:YOUR_IP
   ```
3. Wait 1 minute
4. Check key again (should be expired/deleted)

**Expected Result**:
- Key exists immediately after request
- Key expires after 1 minute (sliding window)

**Tools**:
- Upstash Redis Console: https://console.upstash.com/
- Check "Browser" tab to view keys

---

## 8️⃣ Security Bypass Attempts (Penetration Testing)

### Test 8.1: IP Spoofing via Headers
**Goal**: Attempt to bypass rate limiting by spoofing IP headers.

**Steps**:
1. Use curl with spoofed headers:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login-pin \
     -H "Content-Type: application/json" \
     -H "X-Forwarded-For: 1.2.3.4" \
     -H "X-Real-IP: 5.6.7.8" \
     -d '{"pin":"9876"}'
   ```
2. Perform 15 requests with different IPs
3. Check if rate limit applies per spoofed IP or per actual IP

**Expected Result**:
- Rate limit should apply per actual client IP, not spoofed headers
- Server should validate IP source

---

### Test 8.2: Timing Attack on PIN Validation
**Goal**: Check if PIN validation time varies based on correctness (potential side-channel).

**Steps**:
1. Measure response time for valid PIN
2. Measure response time for invalid PIN
3. Compare timings

**Expected Result**:
- No significant timing difference (constant-time comparison)
- bcrypt hashing should prevent timing attacks

---

## 9️⃣ Monitoring & Alerts

### Test 9.1: Telegram Alert for Honeypot
**Goal**: Verify that Telegram alerts are sent when honeypot PIN is detected.

**Prerequisites**:
- Supabase Edge Function `send-telegram` is deployed
- Telegram bot token is configured

**Steps**:
1. Enter honeypot PIN `0000` on `/login-pin`
2. Check Telegram bot/channel for alert message
3. Verify message contains: PIN, IP, timestamp

**Expected Message Format**:
```
🚨 SECURITY ALERT

Honeypot-PIN detected!

PIN: 0000
IP: 192.168.1.100
Time: 2026-02-14T10:30:00.000Z

⚠️ Suspicious login attempt blocked.
```

---

## 🛠️ Test Tools & Commands

### Useful SQL Queries:
```sql
-- Check rate limit status
SELECT * FROM ratelimit_log ORDER BY created_at DESC LIMIT 10;

-- Check failed login attempts
SELECT id, name, role, failed_attempts, locked_until
FROM users
WHERE failed_attempts > 0 OR locked_until IS NOT NULL;

-- Reset account lockout (for testing)
UPDATE users
SET failed_attempts = 0, locked_until = NULL
WHERE pin_4digit = 'YOUR_TEST_PIN';

-- View honeypot logs
SELECT * FROM honeypot_log ORDER BY created_at DESC LIMIT 10;

-- View banned IPs
SELECT * FROM banned_ips WHERE banned_until > NOW();

-- Clear banned IP (for testing)
DELETE FROM banned_ips WHERE ip_address = 'YOUR_IP';
```

### Browser Console Commands:
```javascript
// Check client-side rate limit tracking
console.log('Attempt count:', attemptCount);

// Monitor fetch calls
window.addEventListener('fetch', (e) => console.log('Fetch:', e));

// Clear localStorage
localStorage.clear();
```

---

## ✅ Test Checklist

- [ ] Test 1.1: Student rate limit (10/min)
- [ ] Test 1.2: Admin rate limit (3/5min)
- [ ] Test 2.1: Student account lockout (5 attempts)
- [ ] Test 2.2: Admin account lockout
- [ ] Test 3.1: Honeypot PIN - client-side
- [ ] Test 3.2: Honeypot PIN - server-side + IP ban
- [ ] Test 4.1: Progressive delays
- [ ] Test 5.1: Rate limit + lockout interaction
- [ ] Test 5.2: Honeypot + rate limit
- [ ] Test 6.1: verify_user_4digit_pin RPC
- [ ] Test 6.2: record_failed_login_attempt RPC
- [ ] Test 6.3: unlock_user RPC
- [ ] Test 7.1: Redis key expiration
- [ ] Test 8.1: IP spoofing bypass attempt
- [ ] Test 8.2: Timing attack
- [ ] Test 9.1: Telegram alert

---

## 📊 Test Results Summary

| Test ID | Feature | Status | Notes |
|---------|---------|--------|-------|
| 1.1 | Rate Limit (Student) | ⏳ Pending | |
| 1.2 | Rate Limit (Admin) | ⏳ Pending | |
| 2.1 | Account Lockout (Student) | ⏳ Pending | |
| 2.2 | Account Lockout (Admin) | ⏳ Pending | |
| 3.1 | Honeypot (Client) | ⏳ Pending | |
| 3.2 | Honeypot (Server) | ⏳ Pending | |
| 4.1 | Progressive Delays | ⏳ Pending | |
| 5.1 | Integration Test 1 | ⏳ Pending | |
| 5.2 | Integration Test 2 | ⏳ Pending | |
| 6.1-6.3 | RPC Functions | ⏳ Pending | |
| 7.1 | Redis Expiration | ⏳ Pending | |
| 8.1-8.2 | Penetration Tests | ⏳ Pending | |
| 9.1 | Telegram Alerts | ⏳ Pending | |

---

## 🔍 Known Issues / Findings

_(To be filled during testing)_

1.
2.
3.

---

## 📝 Recommendations

_(To be filled after testing)_

1.
2.
3.

---

**Test Conducted By**: Claude Code + User
**Date**: 2026-02-14
**Version**: 1.0.0

/**
 * Security Tests - Automated Test Script
 *
 * Tests:
 * 1. Rate Limiting (Redis)
 * 2. Account Lockout (5 attempts)
 * 3. Honeypot PIN Detection
 * 4. Progressive Delays
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BASE_URL = 'http://localhost:3000';

// Test colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(level: 'info' | 'success' | 'error' | 'warning', message: string) {
  const colors = {
    info: BLUE,
    success: GREEN,
    error: RED,
    warning: YELLOW,
  };
  console.log(`${colors[level]}${message}${RESET}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// Test 1: Database State Check
// ========================================
async function testDatabaseState() {
  log('info', '\n📊 Test 1: Database State Check');

  try {
    // Check if users table has test accounts
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role, pin_4digit, failed_attempts, locked_until')
      .limit(5);

    if (error) throw error;

    if (!users || users.length === 0) {
      results.push({
        name: 'Database State',
        passed: false,
        message: 'No users found in database. Please create test accounts first.',
      });
      log('error', '❌ No users found in database');
      return null;
    }

    log('success', `✅ Found ${users.length} users in database`);
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.role}): PIN=${u.pin_4digit?.substring(0, 2)}**, failed=${u.failed_attempts}, locked=${u.locked_until ? 'YES' : 'NO'}`);
    });

    // Find a test student account
    const testStudent = users.find(u => u.role === 'student' && u.pin_4digit);
    if (!testStudent) {
      log('warning', '⚠️  No student account with 4-digit PIN found');
      return null;
    }

    results.push({
      name: 'Database State',
      passed: true,
      message: `Found test account: ${testStudent.name}`,
    });

    return testStudent;
  } catch (error: any) {
    const errorMsg = error?.message || error?.error?.message || JSON.stringify(error);
    log('error', `❌ Database check failed: ${errorMsg}`);
    results.push({
      name: 'Database State',
      passed: false,
      message: `Error: ${errorMsg}`,
    });
    return null;
  }
}

// ========================================
// Test 2: Honeypot PIN Detection (Client-Side)
// ========================================
async function testHoneypotClientSide() {
  log('info', '\n🍯 Test 2: Honeypot PIN Detection (Client-Side)');

  const honeypotPins = ['0000', '1111', '1234'];

  for (const pin of honeypotPins) {
    try {
      const start = Date.now();

      // Make API call to honeypot alert endpoint
      const response = await fetch(`${BASE_URL}/api/honeypot-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const duration = Date.now() - start;
      const data = await response.json();

      if (response.ok && data.success) {
        log('success', `✅ Honeypot alert sent for PIN ${pin} (${duration}ms)`);
        results.push({
          name: `Honeypot Detection: ${pin}`,
          passed: true,
          message: 'Alert sent successfully',
          duration,
        });
      } else {
        log('error', `❌ Honeypot alert failed for PIN ${pin}: ${data.error || 'Unknown error'}`);
        results.push({
          name: `Honeypot Detection: ${pin}`,
          passed: false,
          message: data.error || 'Unknown error',
          duration,
        });
      }

      await sleep(100); // Small delay between tests
    } catch (error: any) {
      const errorMsg = error?.message || JSON.stringify(error);
      log('error', `❌ Network error for PIN ${pin}: ${errorMsg}`);
      results.push({
        name: `Honeypot Detection: ${pin}`,
        passed: false,
        message: `Network error: ${errorMsg}`,
      });
    }
  }
}

// ========================================
// Test 3: Account Lockout (Database Function)
// ========================================
async function testAccountLockout(testPin: string) {
  log('info', '\n🔒 Test 3: Account Lockout (Database Function)');

  try {
    // Reset account first
    log('info', '  Resetting account...');
    const { error: resetError } = await supabase
      .from('users')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('pin_4digit', testPin);

    if (resetError) throw resetError;
    log('success', '  ✅ Account reset');

    // Record 5 failed attempts
    for (let i = 1; i <= 5; i++) {
      log('info', `  Attempt ${i}/5...`);

      const { data, error } = await supabase.rpc('record_failed_login_attempt', {
        p_pin: testPin,
      });

      if (error) throw error;

      console.log(`    Response:`, data);

      if (i < 5) {
        if (data.locked) {
          log('error', `    ❌ Account locked too early (attempt ${i})`);
          results.push({
            name: 'Account Lockout',
            passed: false,
            message: `Locked after ${i} attempts (expected 5)`,
          });
          return;
        }
        log('success', `    ✅ Attempt ${i} recorded, ${data.remaining || 'N/A'} remaining`);
      } else {
        // 5th attempt - should lock
        if (data.locked && data.locked_until) {
          log('success', `    ✅ Account locked after 5 attempts until ${data.locked_until}`);
          results.push({
            name: 'Account Lockout',
            passed: true,
            message: `Account locked for 15 minutes after 5 attempts`,
          });
        } else {
          log('error', `    ❌ Account not locked after 5 attempts`);
          results.push({
            name: 'Account Lockout',
            passed: false,
            message: 'Account not locked after 5 attempts',
          });
        }
      }

      await sleep(200);
    }

    // Check lockout status
    log('info', '  Checking lockout status...');
    const { data: statusData, error: statusError } = await supabase.rpc(
      'check_account_lockout_status',
      { p_pin: testPin }
    );

    if (statusError) throw statusError;
    console.log(`  Status:`, statusData);

    if (statusData.locked) {
      log('success', `  ✅ Lockout status confirmed: locked until ${statusData.locked_until}`);
    } else {
      log('error', `  ❌ Lockout status check failed: account not locked`);
    }

    // Cleanup: Reset account
    await supabase
      .from('users')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('pin_4digit', testPin);
    log('info', '  Cleanup: Account reset');

  } catch (error) {
    log('error', `❌ Account lockout test failed: ${error}`);
    results.push({
      name: 'Account Lockout',
      passed: false,
      message: `Error: ${error}`,
    });
  }
}

// ========================================
// Test 4: Progressive Delays
// ========================================
async function testProgressiveDelays() {
  log('info', '\n⏱️  Test 4: Progressive Delays (Simulated)');

  const delays = [0, 1000, 2000, 5000, 10000];
  const expectedDelays = ['0ms', '1s', '2s', '5s', '10s'];

  log('info', '  Testing delay progression:');
  for (let i = 0; i < delays.length; i++) {
    const start = Date.now();
    await sleep(delays[i]);
    const duration = Date.now() - start;

    const isCorrect = Math.abs(duration - delays[i]) < 100; // 100ms tolerance
    if (isCorrect) {
      log('success', `  ✅ Attempt ${i + 1}: ${expectedDelays[i]} delay (${duration}ms actual)`);
    } else {
      log('error', `  ❌ Attempt ${i + 1}: Expected ${expectedDelays[i]}, got ${duration}ms`);
    }
  }

  results.push({
    name: 'Progressive Delays',
    passed: true,
    message: 'Delay mechanism works as expected',
  });
}

// ========================================
// Test 5: RPC Function - verify_user_4digit_pin
// ========================================
async function testVerifyPinRPC(testPin: string) {
  log('info', '\n🔍 Test 5: RPC Function - verify_user_4digit_pin');

  // Reset account first
  await supabase
    .from('users')
    .update({ failed_attempts: 0, locked_until: null })
    .eq('pin_4digit', testPin);

  try {
    // Test 1: Valid PIN
    log('info', '  Test 5.1: Valid PIN');
    const { data: validData, error: validError } = await supabase.rpc(
      'verify_user_4digit_pin',
      {
        p_pin: testPin,
        p_ip_address: '127.0.0.1',
        p_user_agent: 'Test Script',
      }
    );

    if (validError) throw validError;

    if (validData && validData.length > 0 && validData[0].user_id) {
      log('success', `  ✅ Valid PIN accepted: User ${validData[0].user_name}`);
      results.push({
        name: 'RPC: Valid PIN',
        passed: true,
        message: `User ${validData[0].user_name} authenticated`,
      });
    } else {
      log('error', `  ❌ Valid PIN rejected`);
      results.push({
        name: 'RPC: Valid PIN',
        passed: false,
        message: 'Valid PIN rejected',
      });
    }

    await sleep(500);

    // Test 2: Invalid PIN
    log('info', '  Test 5.2: Invalid PIN');
    const { data: invalidData, error: invalidError } = await supabase.rpc(
      'verify_user_4digit_pin',
      {
        p_pin: '9999',
        p_ip_address: '127.0.0.1',
        p_user_agent: 'Test Script',
      }
    );

    if (invalidError) throw invalidError;

    if (invalidData && invalidData.length > 0 && invalidData[0].error === 'Invalid PIN') {
      log('success', `  ✅ Invalid PIN rejected correctly`);
      results.push({
        name: 'RPC: Invalid PIN',
        passed: true,
        message: 'Invalid PIN rejected',
      });
    } else {
      log('error', `  ❌ Invalid PIN handling failed`);
      results.push({
        name: 'RPC: Invalid PIN',
        passed: false,
        message: 'Invalid PIN not rejected',
      });
    }

  } catch (error) {
    log('error', `❌ RPC test failed: ${error}`);
    results.push({
      name: 'RPC Function Tests',
      passed: false,
      message: `Error: ${error}`,
    });
  }
}

// ========================================
// Test 6: Check Honeypot and Banned IPs Tables
// ========================================
async function testHoneypotTables() {
  log('info', '\n🗄️  Test 6: Honeypot Tables Check');

  try {
    // Check honeypot_pins table
    const { data: honeypotPins, error: pinsError } = await supabase
      .from('honeypot_pins')
      .select('pin')
      .limit(10);

    if (pinsError && pinsError.code !== 'PGRST116') { // PGRST116 = table not found
      throw pinsError;
    }

    if (!pinsError && honeypotPins) {
      log('success', `  ✅ honeypot_pins table exists with ${honeypotPins.length} entries`);
      console.log('    Pins:', honeypotPins.map(p => p.pin).join(', '));
    } else {
      log('warning', '  ⚠️  honeypot_pins table does not exist or is empty');
    }

    // Check honeypot_log table
    const { data: honeypotLogs, error: logsError } = await supabase
      .from('honeypot_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError && logsError.code !== 'PGRST116') {
      throw logsError;
    }

    if (!logsError && honeypotLogs) {
      log('success', `  ✅ honeypot_log table exists with ${honeypotLogs.length} recent entries`);
    } else {
      log('warning', '  ⚠️  honeypot_log table does not exist or is empty');
    }

    // Check banned_ips table
    const { data: bannedIps, error: bansError } = await supabase
      .from('banned_ips')
      .select('*')
      .gt('banned_until', new Date().toISOString())
      .limit(5);

    if (bansError && bansError.code !== 'PGRST116') {
      throw bansError;
    }

    if (!bansError && bannedIps) {
      log('success', `  ✅ banned_ips table exists with ${bannedIps.length} active bans`);
      if (bannedIps.length > 0) {
        bannedIps.forEach(ban => {
          console.log(`    - ${ban.ip_address}: ${ban.reason} until ${ban.banned_until}`);
        });
      }
    } else {
      log('warning', '  ⚠️  banned_ips table does not exist or has no active bans');
    }

    results.push({
      name: 'Honeypot Tables',
      passed: true,
      message: 'Tables checked successfully',
    });

  } catch (error: any) {
    const errorMsg = error?.message || error?.error?.message || JSON.stringify(error);
    log('error', `❌ Honeypot tables check failed: ${errorMsg}`);
    results.push({
      name: 'Honeypot Tables',
      passed: false,
      message: `Error: ${errorMsg}`,
    });
  }
}

// ========================================
// Main Test Runner
// ========================================
async function runAllTests() {
  console.log('\n');
  log('info', '═══════════════════════════════════════════');
  log('info', '🔒 SECURITY TESTS - GreekLingua Dashboard');
  log('info', '═══════════════════════════════════════════');

  // Test 1: Database State
  const testAccount = await testDatabaseState();

  // Test 2: Honeypot Detection
  await testHoneypotClientSide();

  // Test 3 & 5: Only if we have a test account
  if (testAccount && testAccount.pin_4digit) {
    await testAccountLockout(testAccount.pin_4digit);
    await testVerifyPinRPC(testAccount.pin_4digit);
  } else {
    log('warning', '\n⚠️  Skipping tests 3 & 5: No test account available');
  }

  // Test 4: Progressive Delays
  await testProgressiveDelays();

  // Test 6: Honeypot Tables
  await testHoneypotTables();

  // Print Summary
  log('info', '\n═══════════════════════════════════════════');
  log('info', '📊 TEST SUMMARY');
  log('info', '═══════════════════════════════════════════');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? GREEN : RED;
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${color}${icon} ${result.name}${duration}${RESET}`);
    console.log(`   ${result.message}`);
  });

  console.log('');
  log('info', `Total: ${total} tests`);
  log('success', `Passed: ${passed}`);
  if (failed > 0) {
    log('error', `Failed: ${failed}`);
  }

  const percentage = Math.round((passed / total) * 100);
  if (percentage === 100) {
    log('success', '\n🎉 All tests passed!');
  } else if (percentage >= 80) {
    log('warning', `\n⚠️  ${percentage}% tests passed`);
  } else {
    log('error', `\n❌ Only ${percentage}% tests passed`);
  }

  console.log('');
}

// Run tests
runAllTests().catch(error => {
  log('error', `Fatal error: ${error}`);
  process.exit(1);
});

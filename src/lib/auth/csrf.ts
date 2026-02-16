/**
 * CSRF Protection - Double-Submit Cookie Pattern
 *
 * Protects against Cross-Site Request Forgery attacks.
 *
 * How it works:
 * 1. Server generates random CSRF token
 * 2. Token stored in cookie (httpOnly: false, so JavaScript can read it)
 * 3. Client must include token in X-CSRF-Token header for state-changing requests
 * 4. Server validates: cookie token === header token
 *
 * SECURITY:
 * - Token is random and unpredictable
 * - SameSite=Strict prevents cross-origin cookie sending
 * - Attacker cannot read token from different origin (CORS)
 */

import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure CSRF token
 *
 * @returns Random 32-byte hex string
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token from cookie matches header token
 *
 * @param cookieToken - Token from cookie
 * @param headerToken - Token from X-CSRF-Token header
 * @returns true if tokens match, false otherwise
 */
export function verifyCSRFToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  // Both must be present
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks that could leak token information
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings match, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  // Must be same length
  if (a.length !== b.length) {
    return false;
  }

  // Compare every character (always runs full loop to prevent timing leak)
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Cookie names for CSRF protection
 */
export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * CSRF Token API Route
 *
 * GET /api/auth/csrf
 * - Generates a new CSRF token
 * - Sets token in cookie (httpOnly: false, so client can read it)
 * - Returns token in response body
 *
 * SECURITY:
 * - Token is cryptographically random
 * - SameSite=Strict prevents cross-origin attacks
 * - Client must include token in X-CSRF-Token header for mutations
 */

import { NextResponse } from 'next/server';
import { generateCSRFToken, CSRF_COOKIE_NAME } from '@/lib/auth/csrf';

export async function GET() {
  // Generate new CSRF token
  const csrfToken = generateCSRFToken();

  // Create response with token
  const response = NextResponse.json({
    csrfToken,
    success: true,
  });

  // Set CSRF token in cookie
  // httpOnly: false → JavaScript can read it (needed for including in headers)
  // sameSite: 'strict' → Prevents cross-origin cookie sending
  // secure: true in production → HTTPS only
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be false so client can read it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

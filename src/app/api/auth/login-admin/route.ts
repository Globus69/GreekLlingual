/**
 * Admin Login API Route
 *
 * POST /api/auth/login-admin
 * Body: { username: string, pin: string }
 *
 * - Validates username + 6-digit PIN
 * - Calls verify_admin_credentials RPC (or fallback: verify_user_pin)
 * - Creates JWT session token
 * - Sets httpOnly session cookie
 * - Returns user data + MFA status
 *
 * SECURITY:
 * - CSRF-protected (checks X-CSRF-Token header)
 * - Rate-limited via RPC function
 * - IP-whitelisted via middleware
 * - httpOnly cookie (XSS-safe)
 * - Short session timeout (15 minutes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/db/supabase';
import { createSessionToken, getSessionDuration } from '@/lib/auth/jwt';
import { verifyCSRFToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/auth/csrf';

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection - Verify token
    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

    if (!verifyCSRFToken(csrfCookie, csrfHeader || undefined)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', success: false },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { username, pin } = body;

    // Validate username
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid username', success: false },
        { status: 400 }
      );
    }

    // Validate PIN format (6 digits)
    if (!pin || typeof pin !== 'string' || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format (must be 6 digits)', success: false },
        { status: 400 }
      );
    }

    // Try: verify_admin_credentials RPC (if available)
    // Falls back to verify_user_pin if admin function doesn't exist
    let data, error;

    try {
      const result = await supabase.rpc('verify_admin_credentials', {
        p_username: username,
        p_pin: pin,
      });
      data = result.data;
      error = result.error;
    } catch (rpcError) {
      // Fallback: Try verify_user_pin (generic function)
      console.warn('verify_admin_credentials not available, using fallback:', rpcError);

      const fallbackResult = await supabase.rpc('verify_user_pin', {
        p_name: username,
        p_pin: pin,
      });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Admin RPC verification failed:', error);
      return NextResponse.json(
        { error: 'Authentication failed', success: false },
        { status: 500 }
      );
    }

    // Check RPC response
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials', success: false },
        { status: 401 }
      );
    }

    const userData = data[0];

    // Check for errors returned by RPC (account locked, etc.)
    if (userData.error) {
      let statusCode = 401;
      if (userData.error === 'Account locked. Try again later.') {
        statusCode = 423; // Locked
      }

      return NextResponse.json(
        { error: userData.error, success: false },
        { status: statusCode }
      );
    }

    // Verify user is actually admin
    if (userData.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied - admin only', success: false },
        { status: 403 }
      );
    }

    // Check MFA status (optional - requires Migration 008)
    let mfaEnabled = false;
    let mfaSecret = null;

    try {
      const { data: mfaData, error: mfaError } = await supabase.rpc('get_admin_mfa_secret', {
        p_user_id: userData.user_id,
      });

      if (!mfaError && mfaData && mfaData.mfa_enabled) {
        mfaEnabled = true;
        mfaSecret = mfaData.mfa_secret;
      }
    } catch (mfaErr) {
      // MFA feature not available - continue without MFA
      console.warn('MFA check failed (feature not available):', mfaErr);
    }

    // If MFA enabled → return MFA challenge (client must verify TOTP code)
    if (mfaEnabled) {
      return NextResponse.json({
        success: true,
        requiresMFA: true,
        userId: userData.user_id,
        mfaSecret: mfaSecret, // Client needs this for verification
      });
    }

    // No MFA or MFA not enabled → Successful login
    // Create JWT session token
    const sessionPayload = {
      userId: userData.user_id,
      role: 'admin' as const,
      name: userData.user_name,
      email: userData.user_email || '',
      preferred_locale: userData.user_preferred_locale || 'en',
    };

    const sessionToken = await createSessionToken(sessionPayload);
    const sessionDuration = getSessionDuration('admin');

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      requiresMFA: false,
      user: {
        id: userData.user_id,
        name: userData.user_name,
        email: userData.user_email || '',
        role: 'admin',
        preferred_locale: userData.user_preferred_locale || 'en',
      },
    });

    // Set httpOnly session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true, // JavaScript cannot access (XSS-safe)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      path: '/',
      maxAge: sessionDuration,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

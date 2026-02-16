/**
 * Student Login API Route
 *
 * POST /api/auth/login-student
 * Body: { pin: string, ipAddress?: string, userAgent?: string }
 *
 * - Validates 4-digit PIN
 * - Calls verify_user_4digit_pin RPC
 * - Creates JWT session token
 * - Sets httpOnly session cookie
 * - Returns user data
 *
 * SECURITY:
 * - CSRF-protected (checks X-CSRF-Token header)
 * - Rate-limited via RPC function
 * - Honeypot detection via RPC function
 * - httpOnly cookie (XSS-safe)
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
    const { pin, ipAddress, userAgent } = body;

    // Validate PIN format
    if (!pin || typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format (must be 4 digits)', success: false },
        { status: 400 }
      );
    }

    // Call Supabase RPC to verify PIN
    // This function handles:
    // - PIN verification (bcrypt)
    // - Honeypot detection
    // - IP banning
    // - Account lockout
    const { data, error } = await supabase.rpc('verify_user_4digit_pin', {
      p_pin: pin,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error('RPC verify_user_4digit_pin failed:', error);
      return NextResponse.json(
        { error: 'Authentication failed', success: false },
        { status: 500 }
      );
    }

    // Check RPC response
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid PIN', success: false },
        { status: 401 }
      );
    }

    const userData = data[0];

    // Check for errors returned by RPC (IP banned, account locked, etc.)
    if (userData.error) {
      let statusCode = 401;
      if (userData.error === 'IP banned') {
        statusCode = 403;
      } else if (userData.error === 'Account locked. Try again later.') {
        statusCode = 423; // Locked
      }

      return NextResponse.json(
        { error: userData.error, success: false },
        { status: statusCode }
      );
    }

    // Successful login - Create JWT session token
    const sessionPayload = {
      userId: userData.user_id,
      role: 'student' as const,
      name: userData.user_name,
      email: userData.user_email || '',
      level: userData.user_level,
      difficulty: userData.user_difficulty,
      performance_index: userData.user_performance_index,
      preferred_locale: userData.user_preferred_locale || 'en',
    };

    const sessionToken = await createSessionToken(sessionPayload);
    const sessionDuration = getSessionDuration('student');

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.user_id,
        name: userData.user_name,
        email: userData.user_email || '',
        role: 'student',
        level: userData.user_level,
        difficulty: userData.user_difficulty,
        performance_index: userData.user_performance_index,
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
    console.error('Student login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * Session API Route
 *
 * GET /api/auth/session
 * - Verifies session token from httpOnly cookie
 * - Returns current user data if valid
 * - Returns 401 if invalid/expired
 *
 * DELETE /api/auth/session
 * - Logs out user
 * - Deletes session cookie
 * - Returns success
 *
 * SECURITY:
 * - Session token is httpOnly (cannot be read by JavaScript)
 * - JWT signature prevents tampering
 * - Expiration time enforced
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import { verifyCSRFToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/auth/csrf';

/**
 * GET /api/auth/session
 * Check if user is logged in and return user data
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated', authenticated: false },
        { status: 401 }
      );
    }

    // Verify JWT token
    const session = await verifySessionToken(sessionToken);

    if (!session) {
      // Token invalid or expired
      return NextResponse.json(
        { error: 'Session expired', authenticated: false },
        { status: 401 }
      );
    }

    // Return user data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        level: session.level,
        difficulty: session.difficulty,
        performance_index: session.performance_index,
        preferred_locale: session.preferred_locale,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Logout user by deleting session cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    // CSRF Protection for logout (state-changing operation)
    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

    if (!verifyCSRFToken(csrfCookie, csrfHeader || undefined)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', success: false },
        { status: 403 }
      );
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Delete session cookie
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

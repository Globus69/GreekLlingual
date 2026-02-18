/**
 * Bulk Delete API Route
 *
 * POST /api/admin/vocab/bulk-delete
 * - Delete multiple vocabulary entries at once
 * - Body: { ids: string[] }
 *
 * SECURITY:
 * - Requires admin authentication
 * - Session token verified from httpOnly cookie
 * - CSRF protection for state-changing operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import { verifyCSRFToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/auth/csrf';
import { supabase } from '@/lib/supabase/client';
import type { BulkDeleteRequest } from '@/types/vocabulary';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify session
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // 2. CSRF protection
    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get(CSRF_HEADER_NAME);
    if (!verifyCSRFToken(csrfCookie, csrfHeader || undefined)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // 3. Check admin role
    const { data: user, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.userId)
      .single();

    if (roleError || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // 4. Parse and validate body
    const body: BulkDeleteRequest = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or empty ids array' },
        { status: 400 }
      );
    }

    // 5. Perform bulk delete
    const { error, count } = await supabase
      .from('multilingual_vocabulary')
      .delete()
      .in('id', body.ids);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete entries',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 6. Return results
    return NextResponse.json({
      success: true,
      deleted: body.ids.length,
      message: `Successfully deleted ${body.ids.length} entries`
    });

  } catch (error) {
    console.error('[vocab/bulk-delete] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

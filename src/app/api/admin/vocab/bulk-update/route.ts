/**
 * Bulk Update API Route
 *
 * POST /api/admin/vocab/bulk-update
 * - Update multiple vocabulary entries at once
 * - Body: { ids: string[], updates: Partial<VocabEntry> }
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
import { sanitizeEntry } from '@/lib/supabase/vocab';
import type { BulkUpdateRequest } from '@/types/vocabulary';

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
    const body: BulkUpdateRequest = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or empty ids array' },
        { status: 400 }
      );
    }

    if (!body.updates || typeof body.updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid updates object' },
        { status: 400 }
      );
    }

    // 5. Sanitize updates
    const sanitized = sanitizeEntry(body.updates);

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // 6. Perform bulk update
    const { data, error, count } = await supabase
      .from('multilingual_vocabulary')
      .update(sanitized)
      .in('id', body.ids)
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update entries',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 7. Return results
    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: `Successfully updated ${data?.length || 0} entries`
    });

  } catch (error) {
    console.error('[vocab/bulk-update] Error:', error);
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

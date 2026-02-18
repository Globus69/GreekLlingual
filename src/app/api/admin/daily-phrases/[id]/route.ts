/**
 * Single Daily Phrase Entry API Routes
 *
 * GET /api/admin/daily-phrases/[id]
 * - Get phrase entry by ID
 *
 * PATCH /api/admin/daily-phrases/[id]
 * - Update phrase entry by ID
 *
 * DELETE /api/admin/daily-phrases/[id]
 * - Delete phrase entry by ID
 *
 * SECURITY:
 * - Requires admin authentication
 * - Session token verified from httpOnly cookie
 * - CSRF protection for state-changing operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import { verifyCSRFToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/auth/csrf';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/admin/daily-phrases/[id]
 * Get single phrase entry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Check admin role
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

    // 3. Validate ID (Next.js 15: params is now a Promise)
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // 4. Fetch entry
    const { data, error } = await supabase
      .from('daily_phrases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Entry not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch entry',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 5. Return entry
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[daily-phrases/[id]/GET] Error:', error);
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

/**
 * PATCH /api/admin/daily-phrases/[id]
 * Update single phrase entry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 4. Validate ID (Next.js 15: params is now a Promise)
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // 5. Parse and validate body
    const body = await request.json();

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    body.updated_at = new Date().toISOString();

    // 6. Update entry
    const { data, error } = await supabase
      .from('daily_phrases')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Entry not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update entry',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 7. Return updated entry
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[daily-phrases/[id]/PATCH] Error:', error);
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

/**
 * DELETE /api/admin/daily-phrases/[id]
 * Delete phrase entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 4. Validate ID (Next.js 15: params is now a Promise)
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // 5. Delete entry
    const { error } = await supabase
      .from('daily_phrases')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete entry',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    });

  } catch (error) {
    console.error('[daily-phrases/[id]/DELETE] Error:', error);
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

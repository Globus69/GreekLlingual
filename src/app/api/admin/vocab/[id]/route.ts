/**
 * Single Vocabulary Entry API Routes
 *
 * PATCH /api/admin/vocab/[id]
 * - Update vocabulary entry by ID
 *
 * DELETE /api/admin/vocab/[id]
 * - Delete vocabulary entry by ID
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
import { validateVocabEntry, sanitizeEntry } from '@/lib/supabase/vocab';

/**
 * PATCH /api/admin/vocab/[id]
 * Update single vocabulary entry
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
    const sanitized = sanitizeEntry(body);

    // For updates, we validate only the fields that are present
    // So we need a partial validation
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validate if required fields are being updated
    if (sanitized.greek_transcription || sanitized.level || sanitized.difficulty) {
      const validation = validateVocabEntry({
        greek_transcription: sanitized.greek_transcription || 'dummy',
        level: sanitized.level || 'A1',
        difficulty: sanitized.difficulty || 'easy',
        ...sanitized
      });

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validation.errors
          },
          { status: 400 }
        );
      }
    }

    // 6. Update entry
    const { data, error } = await supabase
      .from('multilingual_vocabulary')
      .update(sanitized)
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
    console.error('[vocab/PATCH] Error:', error);
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
 * DELETE /api/admin/vocab/[id]
 * Delete single vocabulary entry
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
      .from('multilingual_vocabulary')
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
    console.error('[vocab/DELETE] Error:', error);
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

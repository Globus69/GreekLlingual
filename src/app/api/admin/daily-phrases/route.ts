/**
 * Daily Phrases CRUD API Routes
 *
 * GET /api/admin/daily-phrases
 * - List all phrase entries with filtering, pagination, and sorting
 *
 * POST /api/admin/daily-phrases
 * - Create new phrase entry
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
import type { PhraseFilterParams, PhraseListResponse } from '@/types/phrases';

/**
 * GET /api/admin/daily-phrases
 * List phrase entries with filtering and pagination
 */
export async function GET(request: NextRequest) {
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const level = searchParams.get('level')?.split(',') || undefined;
    const difficulty = searchParams.get('difficulty')?.split(',') || undefined;
    const frequency = searchParams.get('frequency') ? Number(searchParams.get('frequency')) : undefined;
    const page = Math.max(0, Number(searchParams.get('page') || '0'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
    const sort = searchParams.get('sort') as any || 'created_at';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // 4. Build query
    let query = supabase
      .from('daily_phrases')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`greek_transcription.ilike.%${search}%,en_translation.ilike.%${search}%,ru_translation.ilike.%${search}%,de_translation.ilike.%${search}%,es_translation.ilike.%${search}%`);
    }

    if (level && level.length > 0) {
      query = query.in('level', level);
    }

    if (difficulty && difficulty.length > 0) {
      query = query.in('difficulty', difficulty);
    }

    if (frequency) {
      query = query.eq('frequency', frequency);
    }

    // Apply sorting
    const validSortFields = ['frequency', 'created_at', 'updated_at', 'greek_transcription'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    query = query.order(sortField, { ascending: order === 'asc' });

    // Apply pagination
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 5. Execute query
    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch phrases',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 6. Return response
    const response: PhraseListResponse = {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? (from + limit) < count : false
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[daily-phrases/GET] Error:', error);
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
 * POST /api/admin/daily-phrases
 * Create new phrase entry
 */
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
    const { data: student, error: roleError } = await supabase
      .from('students')
      .select('role')
      .eq('id', session.userId)
      .single();

    if (roleError || student?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // 4. Parse and validate body
    const body = await request.json();

    // Basic validation
    if (!body.greek_transcription || body.greek_transcription.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: ['Greek transcription is required']
        },
        { status: 400 }
      );
    }

    if (!body.level || !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(body.level)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: ['Valid level is required (A1-C2)']
        },
        { status: 400 }
      );
    }

    if (!body.difficulty || !['easy', 'medium', 'hard'].includes(body.difficulty)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: ['Valid difficulty is required (easy/medium/hard)']
        },
        { status: 400 }
      );
    }

    // 5. Insert entry
    const { data, error } = await supabase
      .from('daily_phrases')
      .insert({
        ...body,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create entry',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 6. Return created entry
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[daily-phrases/POST] Error:', error);
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

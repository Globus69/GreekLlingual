/**
 * Export API Route
 *
 * GET /api/admin/vocab/export
 * - Export vocabulary entries to CSV format
 * - Supports same filtering as list endpoint
 * - Returns CSV file for download
 *
 * SECURITY:
 * - Requires admin authentication
 * - Session token verified from httpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import { supabase } from '@/lib/supabase/client';
import { generateCSV } from '@/lib/supabase/vocab';
import type { VocabEntry } from '@/types/vocabulary';

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

    // 3. Parse query parameters (same as list endpoint)
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const level = searchParams.get('level')?.split(',') || undefined;
    const difficulty = searchParams.get('difficulty')?.split(',') || undefined;
    const frequency = searchParams.get('frequency') ? Number(searchParams.get('frequency')) : undefined;
    const sort = searchParams.get('sort') as any || 'created_at';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // 4. Build query (no pagination for export - get all matching entries)
    let query = supabase
      .from('multilingual_vocabulary')
      .select('*');

    // Apply filters
    if (search) {
      query = query.or(`greek_transcription.ilike.%${search}%,translation_en.ilike.%${search}%,translation_ru.ilike.%${search}%,translation_de.ilike.%${search}%,translation_es.ilike.%${search}%`);
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

    // 5. Execute query
    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch vocabulary',
          details: error.message
        },
        { status: 500 }
      );
    }

    // 6. Generate CSV
    const csv = generateCSV(data as VocabEntry[]);

    // 7. Return CSV file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `vocabulary_export_${timestamp}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[vocab/export] Error:', error);
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

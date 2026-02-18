/**
 * Export API Route
 *
 * GET /api/admin/daily-phrases/export
 * - Export phrase entries to CSV format
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
import type { PhraseEntry } from '@/types/phrases';

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
      .from('daily_phrases')
      .select('*');

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

    // 5. Execute query
    const { data, error } = await query;

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

    // 6. Generate CSV
    const entries = data as PhraseEntry[];

    // CSV headers
    const headers = [
      'nr',
      'greek_transcription',
      'greek_phonetic',
      'en_translation',
      'en_importance_reason',
      'en_audio_url',
      'de_translation',
      'de_importance_reason',
      'de_audio_url',
      'es_translation',
      'es_importance_reason',
      'es_audio_url',
      'ru_translation',
      'ru_importance_reason',
      'ru_audio_url',
      'level',
      'difficulty',
      'frequency'
    ];

    // CSV rows
    const rows = entries.map(entry => [
      entry.nr || '',
      entry.greek_transcription || '',
      entry.greek_phonetic || '',
      entry.en_translation || '',
      entry.en_importance_reason || '',
      entry.en_audio_url || '',
      entry.de_translation || '',
      entry.de_importance_reason || '',
      entry.de_audio_url || '',
      entry.es_translation || '',
      entry.es_importance_reason || '',
      entry.es_audio_url || '',
      entry.ru_translation || '',
      entry.ru_importance_reason || '',
      entry.ru_audio_url || '',
      entry.level || '',
      entry.difficulty || '',
      entry.frequency || ''
    ]);

    // Escape CSV values
    const escapeCSV = (value: any): string => {
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Generate CSV content
    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // 7. Return CSV file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `phrases_export_${timestamp}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[daily-phrases/export] Error:', error);
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

/**
 * CSV Import API Route
 *
 * POST /api/admin/daily-phrases/import
 * - Imports phrases from CSV file
 * - Supports two modes: append (skip duplicates) and overwrite (clear table first)
 * - Returns detailed import results with errors
 *
 * SECURITY:
 * - Requires admin authentication
 * - Session token verified from httpOnly cookie
 * - CSRF protection for state-changing operation
 *
 * NOTE: CSV parsing is handled client-side using Papa Parse.
 * This endpoint receives pre-parsed data as JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import { verifyCSRFToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/auth/csrf';
import { supabase } from '@/lib/supabase/client';
import type { ImportResult, ImportMode } from '@/types/phrases';

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

    // 4. Parse body
    const body = await request.json();
    const { entries, mode } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entries array' },
        { status: 400 }
      );
    }

    if (mode !== 'append' && mode !== 'overwrite') {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Must be "append" or "overwrite"' },
        { status: 400 }
      );
    }

    // 5. Handle overwrite mode - clear table first
    if (mode === 'overwrite' && entries.length > 0) {
      const { error: deleteError } = await supabase
        .from('daily_phrases')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to clear table in overwrite mode',
            details: deleteError.message
          },
          { status: 500 }
        );
      }
    }

    // 6. Import entries
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rowNum = i + 2; // +2 for header row and 1-indexed

      try {
        // Basic validation
        if (!entry.greek_transcription || entry.greek_transcription.trim() === '') {
          errors.push(`Row ${rowNum}: Greek transcription is required`);
          skipped++;
          continue;
        }

        if (!entry.level || !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(entry.level)) {
          errors.push(`Row ${rowNum}: Valid level is required (A1-C2)`);
          skipped++;
          continue;
        }

        if (!entry.difficulty || !['easy', 'medium', 'hard'].includes(entry.difficulty)) {
          errors.push(`Row ${rowNum}: Valid difficulty is required`);
          skipped++;
          continue;
        }

        // Check for duplicates in append mode
        if (mode === 'append') {
          const { data: existing } = await supabase
            .from('daily_phrases')
            .select('id')
            .eq('greek_transcription', entry.greek_transcription)
            .eq('level', entry.level)
            .single();

          if (existing) {
            skipped++;
            continue;
          }
        }

        // Insert entry
        const { error: insertError } = await supabase
          .from('daily_phrases')
          .insert({
            ...entry,
            created_by: session.userId
          });

        if (insertError) {
          if (insertError.code === '23505') {
            // Unique constraint violation
            errors.push(`Row ${rowNum}: Duplicate entry`);
            skipped++;
          } else {
            errors.push(`Row ${rowNum}: ${insertError.message}`);
            skipped++;
          }
        } else {
          imported++;
        }

      } catch (rowError) {
        errors.push(`Row ${rowNum}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
        skipped++;
      }
    }

    // 7. Return results
    const result: ImportResult = {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
      message: `Imported ${imported} phrases, skipped ${skipped}`
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[daily-phrases/import] Error:', error);
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

/**
 * CSV Import API Route
 *
 * POST /api/admin/vocab/import
 * - Imports vocabulary from CSV file
 * - Supports two modes: append (skip duplicates) and overwrite (clear table first)
 * - Validates all entries before importing
 * - Returns detailed import results with errors
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
import { parseCSV, validateVocabEntry, sanitizeEntry, checkDuplicate } from '@/lib/supabase/vocab';
import type { ImportResult, ImportMode } from '@/types/vocabulary';

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

    // 4. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = (formData.get('mode') as ImportMode) || 'append';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (mode !== 'append' && mode !== 'overwrite') {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Must be "append" or "overwrite"' },
        { status: 400 }
      );
    }

    // 5. Parse CSV
    const { data: rows, errors: parseErrors } = await parseCSV(file);
    if (parseErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'CSV parsing failed',
          errors: parseErrors
        },
        { status: 400 }
      );
    }

    // 6. Validate and sanitize entries
    const validEntries: any[] = [];
    const errors: string[] = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because of header row and 1-indexed

      // Sanitize entry
      const sanitized = sanitizeEntry(row);

      // Validate entry
      const validation = validateVocabEntry(sanitized);
      if (!validation.valid) {
        errors.push(`Row ${rowNum}: ${validation.errors.join(', ')}`);
        continue;
      }

      // Check for duplicates in append mode
      if (mode === 'append') {
        const isDuplicate = await checkDuplicate(sanitized);
        if (isDuplicate) {
          skipped++;
          continue;
        }
      }

      // Add created_by field
      validEntries.push({
        ...sanitized,
        created_by: session.userId
      });
    }

    // 7. Handle overwrite mode - clear table first
    if (mode === 'overwrite' && validEntries.length > 0) {
      const { error: deleteError } = await supabase
        .from('multilingual_vocabulary')
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

    // 8. Insert valid entries
    let imported = 0;
    if (validEntries.length > 0) {
      const { data, error: insertError } = await supabase
        .from('multilingual_vocabulary')
        .insert(validEntries)
        .select();

      if (insertError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to insert entries',
            details: insertError.message,
            imported: 0,
            skipped,
            errors
          },
          { status: 500 }
        );
      }

      imported = data?.length || 0;
    }

    // 9. Return results
    const result: ImportResult = {
      success: true,
      imported,
      skipped,
      errors
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[vocab/import] Error:', error);
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

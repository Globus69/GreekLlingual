/**
 * Server-Side CSV Import API
 *
 * SECURITY: Uses service_role key ONLY server-side to bypass RLS
 * This is safe because:
 * 1. service_role key NEVER reaches the client
 * 2. API route runs server-side only
 * 3. We can add auth checks here if needed
 *
 * RLS Policy (for reference - already applied in Migration 086):
 *
 * CREATE POLICY "Authenticated users can insert multilingual_vocabulary"
 *     ON multilingual_vocabulary
 *     FOR INSERT
 *     TO authenticated
 *     WITH CHECK (true);
 *
 * If this policy exists and client-side still fails, use this API route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import type { ImportMode, ImportResult, CreateVocabPayload } from '@/types/vocabulary';

// Create admin client with service_role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
}

const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
              autoRefreshToken: false,
              persistSession: false,
          },
      })
    : null;

export async function POST(request: NextRequest) {
    try {
        // Check if admin client is available
        if (!supabaseAdmin) {
            return NextResponse.json(
                {
                    error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set',
                    hint: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (server-side only)',
                },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const mode = formData.get('mode') as ImportMode;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!mode || !['append', 'overwrite'].includes(mode)) {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }

        // Read and parse CSV
        const fileContent = await file.text();

        const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                delimiter: ';',
                transformHeader: (header: string) => {
                    const mapping: Record<string, string> = {
                        'Nr.': 'nr',
                        'Griechisch (Transkription)': 'greek_transcription',
                        'Lautschrift (Griechisch)': 'greek_phonetic',
                        'Russische Übersetzung': 'ru_translation',
                        'Wichtigkeit (Begründung) in Russisch': 'ru_importance_reason',
                        'Audio in russisch': 'ru_audio_url',
                        'Englische Übersetzung': 'en_translation',
                        'Wichtigkeit (Begründung)in Englisch': 'en_importance_reason',
                        'Audio in englisch': 'en_audio_url',
                        'Spanische Übersetzung': 'es_translation',
                        'Wichtigkeit (Begründung)in Spanisch': 'es_importance_reason',
                        'Audio in Spanisch': 'es_audio_url',
                        'Deutsche Übersetzung': 'de_translation',
                        'Wichtigkeit (Begründung)in Deutsch': 'de_importance_reason',
                        'Audio in deutsch': 'de_audio_url',
                        'Level': 'level',
                        'difficulty (easy/middle/hard)': 'difficulty',
                        'Häufigkeit im täglichen Gebrauch': 'frequency',
                    };
                    return mapping[header] || header;
                },
                complete: (results) => resolve(results),
                error: (error) => reject(error),
            });
        });

        const errors: ImportResult['errors'] = [];
        let imported = 0;
        let skipped = 0;

        // Overwrite mode: delete all existing entries
        if (mode === 'overwrite') {
            console.log('🗑️ Overwrite mode: Deleting all existing entries...');
            const { data: existingIds, error: selectError } = await supabaseAdmin
                .from('multilingual_vocabulary')
                .select('id');

            if (selectError) {
                console.error('Failed to fetch existing entries:', selectError);
                return NextResponse.json(
                    { error: `Fehler beim Abrufen: ${selectError.message}` },
                    { status: 500 }
                );
            }

            if (existingIds && existingIds.length > 0) {
                console.log(`Found ${existingIds.length} existing entries to delete`);
                const { error: deleteError } = await supabaseAdmin
                    .from('multilingual_vocabulary')
                    .delete()
                    .in(
                        'id',
                        existingIds.map((e) => e.id)
                    );

                if (deleteError) {
                    console.error('Failed to delete entries:', deleteError);
                    return NextResponse.json(
                        { error: `Fehler beim Löschen: ${deleteError.message}` },
                        { status: 500 }
                    );
                }
                console.log('✅ All existing entries deleted successfully');
            }
        }

        // Process each row
        console.log(`📥 Starting import of ${parseResult.data.length} rows...`);
        for (let i = 0; i < parseResult.data.length; i++) {
            const row = parseResult.data[i];
            const rowNum = i + 2;

            try {
                // Validate required fields
                if (!row.greek_transcription || row.greek_transcription.trim() === '') {
                    errors.push({
                        row: rowNum,
                        field: 'greek_transcription',
                        message: 'Greek transcription is required',
                    });
                    skipped++;
                    continue;
                }

                if (!row.level) {
                    errors.push({ row: rowNum, field: 'level', message: 'Level is required' });
                    skipped++;
                    continue;
                }

                if (!row.difficulty) {
                    errors.push({
                        row: rowNum,
                        field: 'difficulty',
                        message: 'Difficulty is required',
                    });
                    skipped++;
                    continue;
                }

                const frequency = parseInt(row.frequency || '3', 10);
                if (isNaN(frequency) || frequency < 1 || frequency > 5) {
                    errors.push({
                        row: rowNum,
                        field: 'frequency',
                        message: 'Frequency must be 1-5',
                    });
                    skipped++;
                    continue;
                }

                let difficultyValue = row.difficulty?.trim().toLowerCase();
                if (difficultyValue === 'middle') {
                    difficultyValue = 'medium';
                }

                const entry: CreateVocabPayload = {
                    nr: row.nr ? parseInt(row.nr, 10) : undefined,
                    greek_transcription: row.greek_transcription.trim(),
                    greek_phonetic: row.greek_phonetic?.trim(),
                    en_translation: row.en_translation?.trim(),
                    en_importance_reason: row.en_importance_reason?.trim(),
                    en_audio_url: row.en_audio_url?.trim(),
                    de_translation: row.de_translation?.trim(),
                    de_importance_reason: row.de_importance_reason?.trim(),
                    de_audio_url: row.de_audio_url?.trim(),
                    es_translation: row.es_translation?.trim(),
                    es_importance_reason: row.es_importance_reason?.trim(),
                    es_audio_url: row.es_audio_url?.trim(),
                    ru_translation: row.ru_translation?.trim(),
                    ru_importance_reason: row.ru_importance_reason?.trim(),
                    ru_audio_url: row.ru_audio_url?.trim(),
                    level: row.level?.trim() as CreateVocabPayload['level'],
                    difficulty: difficultyValue as CreateVocabPayload['difficulty'],
                    frequency: frequency as CreateVocabPayload['frequency'],
                };

                // Insert using admin client (bypasses RLS)
                const { error: insertError } = await supabaseAdmin
                    .from('multilingual_vocabulary')
                    .insert([entry]);

                if (insertError) {
                    if (insertError.code === '23505') {
                        console.warn(
                            `❌ Row ${rowNum}: Duplicate - ${entry.greek_transcription} (${entry.level})`
                        );
                        errors.push({
                            row: rowNum,
                            message: `Duplikat: ${entry.greek_transcription} (${entry.level})`,
                        });
                        skipped++;
                    } else {
                        console.error(`❌ Row ${rowNum}: ${insertError.message}`);
                        errors.push({ row: rowNum, message: insertError.message });
                        skipped++;
                    }
                } else {
                    imported++;
                    if (imported % 10 === 0) {
                        console.log(`✓ Imported ${imported} entries so far...`);
                    }
                }
            } catch (rowError) {
                errors.push({
                    row: rowNum,
                    message: rowError instanceof Error ? rowError.message : 'Unknown error',
                });
                skipped++;
            }
        }

        console.log(`\n📊 Import Summary:`);
        console.log(`   ✅ Imported: ${imported}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors.length}`);

        const result: ImportResult = {
            success: errors.length === 0,
            imported,
            skipped,
            errors,
            message: `Imported ${imported} entries, skipped ${skipped}`,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Import API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Import failed' },
            { status: 500 }
        );
    }
}

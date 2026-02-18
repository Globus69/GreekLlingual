/**
 * Vocabulary Management API
 * Client-side functions for vocabulary CRUD operations
 */

import { supabase } from '@/lib/supabase/client';
import type {
    VocabEntry,
    VocabFilters,
    VocabListResponse,
    CreateVocabPayload,
    UpdateVocabPayload,
    BulkUpdatePayload,
    ImportResult,
    ImportMode,
    VocabStats,
    VocabCSVRow,
} from '@/types/vocabulary';
import Papa from 'papaparse';

/**
 * Fetch filtered vocabulary list
 */
export async function fetchVocabList(filters: VocabFilters = {}): Promise<VocabListResponse> {
    const {
        search,
        level,
        difficulty,
        frequency_min,
        frequency_max,
        page = 1,
        limit = 20,
    } = filters;

    try {
        let query = supabase
            .from('multilingual_vocabulary')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search && search.trim() !== '') {
            query = query.or(`greek_transcription.ilike.%${search}%,en_translation.ilike.%${search}%,de_translation.ilike.%${search}%,es_translation.ilike.%${search}%,ru_translation.ilike.%${search}%`);
        }

        if (level && level !== 'All') {
            query = query.eq('level', level);
        }

        if (difficulty && difficulty !== 'All') {
            query = query.eq('difficulty', difficulty);
        }

        if (frequency_min !== undefined) {
            query = query.gte('frequency', frequency_min);
        }

        if (frequency_max !== undefined) {
            query = query.lte('frequency', frequency_max);
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Fetch vocabulary error:', error);
            throw new Error(error.message);
        }

        const total = count ?? 0;

        return {
            data: (data as VocabEntry[]) || [],
            total,
            page,
            limit,
            hasMore: total > page * limit,
        };
    } catch (error) {
        console.error('fetchVocabList error:', error);
        throw error;
    }
}

/**
 * Get vocabulary statistics
 */
export async function fetchVocabStats(): Promise<VocabStats> {
    try {
        const { data, error } = await supabase.rpc('get_vocabulary_stats');

        if (error) {
            console.error('Fetch stats error:', error);
            throw new Error(error.message);
        }

        return data as VocabStats;
    } catch (error) {
        console.error('fetchVocabStats error:', error);
        throw error;
    }
}

/**
 * Create new vocabulary entry
 */
export async function createVocabEntry(entry: CreateVocabPayload): Promise<VocabEntry> {
    try {
        const { data, error } = await supabase
            .from('multilingual_vocabulary')
            .insert([entry])
            .select()
            .single();

        if (error) {
            console.error('Create vocabulary error:', error);
            throw new Error(error.message);
        }

        return data as VocabEntry;
    } catch (error) {
        console.error('createVocabEntry error:', error);
        throw error;
    }
}

/**
 * Update existing vocabulary entry
 */
export async function updateVocabEntry(id: string, updates: Partial<CreateVocabPayload>): Promise<VocabEntry> {
    try {
        const { data, error } = await supabase
            .from('multilingual_vocabulary')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update vocabulary error:', error);
            throw new Error(error.message);
        }

        return data as VocabEntry;
    } catch (error) {
        console.error('updateVocabEntry error:', error);
        throw error;
    }
}

/**
 * Delete vocabulary entry
 */
export async function deleteVocabEntry(id: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('multilingual_vocabulary')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete vocabulary error:', error);
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('deleteVocabEntry error:', error);
        throw error;
    }
}

/**
 * Bulk update vocabulary entries
 */
export async function bulkUpdateVocab(payload: BulkUpdatePayload): Promise<number> {
    try {
        const { data, error } = await supabase.rpc('bulk_update_vocabulary', {
            p_ids: payload.ids,
            p_level: payload.level || null,
            p_difficulty: payload.difficulty || null,
            p_frequency: payload.frequency || null,
        });

        if (error) {
            console.error('Bulk update error:', error);
            throw new Error(error.message);
        }

        return data as number;
    } catch (error) {
        console.error('bulkUpdateVocab error:', error);
        throw error;
    }
}

/**
 * Bulk delete vocabulary entries
 */
export async function bulkDeleteVocab(ids: string[]): Promise<number> {
    try {
        const { data, error } = await supabase.rpc('bulk_delete_vocabulary', {
            p_ids: ids,
        });

        if (error) {
            console.error('Bulk delete error:', error);
            throw new Error(error.message);
        }

        return data as number;
    } catch (error) {
        console.error('bulkDeleteVocab error:', error);
        throw error;
    }
}

/**
 * Check for duplicate vocabulary entry
 */
export async function checkDuplicate(
    greekTranscription: string,
    level: string,
    excludeId?: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('check_vocabulary_duplicate', {
            p_greek_transcription: greekTranscription,
            p_level: level,
            p_exclude_id: excludeId || null,
        });

        if (error) {
            console.error('Check duplicate error:', error);
            throw new Error(error.message);
        }

        return data as boolean;
    } catch (error) {
        console.error('checkDuplicate error:', error);
        throw error;
    }
}

/**
 * Import CSV file
 */
export async function importCSV(file: File, mode: ImportMode): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
        Papa.parse<any>(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';', // Support semicolon-separated CSV
            transformHeader: (header: string) => {
                // Map German column names to English keys
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
            complete: async (results) => {
                try {
                    const errors: ImportResult['errors'] = [];
                    let imported = 0;
                    let skipped = 0;

                    // If overwrite mode, delete all existing entries
                    if (mode === 'overwrite') {
                        console.log('🗑️ Overwrite mode: Deleting all existing entries...');
                        const { data: existingIds, error: selectError } = await supabase
                            .from('multilingual_vocabulary')
                            .select('id');

                        if (selectError) {
                            console.error('Failed to fetch existing entries:', selectError);
                            throw new Error(`Fehler beim Abrufen bestehender Einträge: ${selectError.message}`);
                        }

                        if (existingIds && existingIds.length > 0) {
                            console.log(`Found ${existingIds.length} existing entries to delete`);
                            const { error: deleteError } = await supabase
                                .from('multilingual_vocabulary')
                                .delete()
                                .in('id', existingIds.map(e => e.id));

                            if (deleteError) {
                                console.error('Failed to delete entries:', deleteError);
                                throw new Error(`Fehler beim Löschen: ${deleteError.message}`);
                            }
                            console.log('✅ All existing entries deleted successfully');
                        } else {
                            console.log('No existing entries to delete');
                        }
                    }

                    // Process each row
                    console.log(`📥 Starting import of ${results.data.length} rows...`);
                    for (let i = 0; i < results.data.length; i++) {
                        const row = results.data[i];
                        const rowNum = i + 2; // Account for header row

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
                                errors.push({
                                    row: rowNum,
                                    field: 'level',
                                    message: 'Level is required',
                                });
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

                            // Parse frequency
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

                            // Normalize difficulty value (middle → medium)
                            let difficultyValue = row.difficulty?.trim().toLowerCase();
                            if (difficultyValue === 'middle') {
                                difficultyValue = 'medium';
                            }

                            // Create entry object
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

                            // Insert to database
                            const { error: insertError } = await supabase
                                .from('multilingual_vocabulary')
                                .insert([entry]);

                            if (insertError) {
                                if (insertError.code === '23505') {
                                    // Unique constraint violation
                                    console.warn(`❌ Row ${rowNum}: Duplicate - ${entry.greek_transcription} (${entry.level})`);
                                    errors.push({
                                        row: rowNum,
                                        message: `Duplikat: ${entry.greek_transcription} (${entry.level})`,
                                    });
                                    skipped++;
                                } else {
                                    console.error(`❌ Row ${rowNum}: ${insertError.message}`);
                                    errors.push({
                                        row: rowNum,
                                        message: insertError.message,
                                    });
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

                    resolve({
                        success: errors.length === 0,
                        imported,
                        skipped,
                        errors,
                        message: `Imported ${imported} entries, skipped ${skipped}`,
                    });
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            },
        });
    });
}

/**
 * Export vocabulary to CSV
 */
export async function exportCSV(filters: VocabFilters = {}): Promise<Blob> {
    try {
        // Fetch all data (remove pagination for export)
        const { data, error } = await supabase
            .from('multilingual_vocabulary')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        const entries = data as VocabEntry[];

        // Convert to CSV format
        const csvData = entries.map((entry) => ({
            nr: entry.nr || '',
            greek_transcription: entry.greek_transcription,
            greek_phonetic: entry.greek_phonetic || '',

            en_translation: entry.en_translation || '',
            en_importance_reason: entry.en_importance_reason || '',
            en_audio_url: entry.en_audio_url || '',

            de_translation: entry.de_translation || '',
            de_importance_reason: entry.de_importance_reason || '',
            de_audio_url: entry.de_audio_url || '',

            es_translation: entry.es_translation || '',
            es_importance_reason: entry.es_importance_reason || '',
            es_audio_url: entry.es_audio_url || '',

            ru_translation: entry.ru_translation || '',
            ru_importance_reason: entry.ru_importance_reason || '',
            ru_audio_url: entry.ru_audio_url || '',

            level: entry.level,
            difficulty: entry.difficulty,
            frequency: entry.frequency,
        }));

        const csv = Papa.unparse(csvData);
        return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
        console.error('exportCSV error:', error);
        throw error;
    }
}

/**
 * Download CSV template
 */
export function downloadTemplate(): void {
    const template = [
        {
            nr: '1',
            greek_transcription: 'Γεια σου',
            greek_phonetic: 'ya su',
            en_translation: 'Hello',
            en_importance_reason: 'Basic greeting',
            en_audio_url: '',
            de_translation: 'Hallo',
            de_importance_reason: 'Grundbegrüßung',
            de_audio_url: '',
            es_translation: 'Hola',
            es_importance_reason: 'Saludo básico',
            es_audio_url: '',
            ru_translation: 'Привет',
            ru_importance_reason: 'Основное приветствие',
            ru_audio_url: '',
            level: 'A1',
            difficulty: 'easy',
            frequency: '5',
        },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Vorlage-Vokabeln-Vollständig.csv';
    link.click();
    URL.revokeObjectURL(url);
}

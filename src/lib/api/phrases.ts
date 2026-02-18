/**
 * Daily Phrases Management API
 * Client-side functions for phrases CRUD operations
 * Mirrored from vocab.ts structure
 */

import { supabase } from '@/lib/supabase/client';
import type {
    PhraseEntry,
    PhraseFilters,
    PhraseListResponse,
    CreatePhrasePayload,
    UpdatePhrasePayload,
    BulkUpdatePhrasePayload,
    ImportResult,
    ImportMode,
    PhraseStats,
    PhraseCSVRow,
} from '@/types/phrases';
import Papa from 'papaparse';

/**
 * Fetch filtered phrases list
 */
export async function fetchPhrasesList(filters: PhraseFilters = {}): Promise<PhraseListResponse> {
    const {
        search,
        level,
        difficulty,
        frequency_min,
        frequency_max,
        category,
        page = 1,
        limit = 20,
    } = filters;

    try {
        let query = supabase
            .from('daily_phrases')
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

        if (category && category.trim() !== '') {
            query = query.eq('category', category);
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Fetch phrases error:', error);
            throw new Error(error.message);
        }

        const total = count ?? 0;

        return {
            data: (data as PhraseEntry[]) || [],
            total,
            page,
            limit,
            hasMore: total > page * limit,
        };
    } catch (error) {
        console.error('fetchPhrasesList error:', error);
        throw error;
    }
}

/**
 * Get phrases statistics
 */
export async function fetchPhrasesStats(): Promise<PhraseStats> {
    try {
        const { data, error } = await supabase.rpc('get_phrases_stats');

        if (error) {
            console.error('Fetch stats error:', error);
            throw new Error(error.message);
        }

        return data as PhraseStats;
    } catch (error) {
        console.error('fetchPhrasesStats error:', error);
        throw error;
    }
}

/**
 * Create new phrase entry
 */
export async function createPhraseEntry(entry: CreatePhrasePayload): Promise<PhraseEntry> {
    try {
        const { data, error } = await supabase
            .from('daily_phrases')
            .insert([entry])
            .select()
            .single();

        if (error) {
            console.error('Create phrase error:', error);
            throw new Error(error.message);
        }

        return data as PhraseEntry;
    } catch (error) {
        console.error('createPhraseEntry error:', error);
        throw error;
    }
}

/**
 * Update existing phrase entry
 */
export async function updatePhraseEntry(id: string, updates: Partial<CreatePhrasePayload>): Promise<PhraseEntry> {
    try {
        const { data, error } = await supabase
            .from('daily_phrases')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update phrase error:', error);
            throw new Error(error.message);
        }

        return data as PhraseEntry;
    } catch (error) {
        console.error('updatePhraseEntry error:', error);
        throw error;
    }
}

/**
 * Delete phrase entry
 */
export async function deletePhraseEntry(id: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('daily_phrases')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete phrase error:', error);
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('deletePhraseEntry error:', error);
        throw error;
    }
}

/**
 * Bulk update phrase entries
 */
export async function bulkUpdatePhrases(payload: BulkUpdatePhrasePayload): Promise<number> {
    try {
        const { data, error } = await supabase.rpc('bulk_update_phrases', {
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
        console.error('bulkUpdatePhrases error:', error);
        throw error;
    }
}

/**
 * Bulk delete phrase entries
 */
export async function bulkDeletePhrases(ids: string[]): Promise<number> {
    try {
        const { data, error } = await supabase.rpc('bulk_delete_phrases', {
            p_ids: ids,
        });

        if (error) {
            console.error('Bulk delete error:', error);
            throw new Error(error.message);
        }

        return data as number;
    } catch (error) {
        console.error('bulkDeletePhrases error:', error);
        throw error;
    }
}

/**
 * Check for duplicate phrase entry
 */
export async function checkDuplicate(
    greekTranscription: string,
    level: string,
    excludeId?: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('check_phrases_duplicate', {
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
        Papa.parse<PhraseCSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const errors: ImportResult['errors'] = [];
                    let imported = 0;
                    let skipped = 0;

                    // If overwrite mode, delete all existing entries
                    if (mode === 'overwrite') {
                        const { data: existingIds } = await supabase
                            .from('daily_phrases')
                            .select('id');

                        if (existingIds && existingIds.length > 0) {
                            await supabase
                                .from('daily_phrases')
                                .delete()
                                .in('id', existingIds.map(e => e.id));
                        }
                    }

                    // Process each row
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

                            // Create entry object
                            const entry: CreatePhrasePayload = {
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

                                level: row.level as CreatePhrasePayload['level'],
                                difficulty: row.difficulty as CreatePhrasePayload['difficulty'],
                                frequency: frequency as CreatePhrasePayload['frequency'],
                            };

                            // Insert to database
                            const { error: insertError } = await supabase
                                .from('daily_phrases')
                                .insert([entry]);

                            if (insertError) {
                                if (insertError.code === '23505') {
                                    // Unique constraint violation
                                    errors.push({
                                        row: rowNum,
                                        message: `Duplicate: ${entry.greek_transcription} (${entry.level})`,
                                    });
                                    skipped++;
                                } else {
                                    errors.push({
                                        row: rowNum,
                                        message: insertError.message,
                                    });
                                    skipped++;
                                }
                            } else {
                                imported++;
                            }
                        } catch (rowError) {
                            errors.push({
                                row: rowNum,
                                message: rowError instanceof Error ? rowError.message : 'Unknown error',
                            });
                            skipped++;
                        }
                    }

                    resolve({
                        success: errors.length === 0,
                        imported,
                        skipped,
                        errors,
                        message: `Imported ${imported} phrases, skipped ${skipped}`,
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
 * Export phrases to CSV
 */
export async function exportCSV(filters: PhraseFilters = {}): Promise<Blob> {
    try {
        // Fetch all data (remove pagination for export)
        const { data, error } = await supabase
            .from('daily_phrases')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        const entries = data as PhraseEntry[];

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
            greek_transcription: 'καλησπέρα',
            greek_phonetic: 'kalispera',
            en_translation: 'good evening',
            en_importance_reason: 'evening greeting',
            en_audio_url: '',
            de_translation: 'guten Abend',
            de_importance_reason: 'abendliche Begrüßung',
            de_audio_url: '',
            es_translation: 'buenas noches',
            es_importance_reason: 'saludo nocturno',
            es_audio_url: '',
            ru_translation: 'добрый вечер',
            ru_importance_reason: 'вечернее приветствие',
            ru_audio_url: '',
            level: 'A2',
            difficulty: 'easy',
            frequency: '5',
        },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Vorlage-Phrasen-Vollständig.csv';
    link.click();
    URL.revokeObjectURL(url);
}

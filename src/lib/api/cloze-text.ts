/**
 * Cloze Text Management API
 * Client-side functions for cloze text CRUD operations
 */

import { supabase } from '@/lib/supabase/client';
import type {
    ClozeTextEntry,
    ClozeTextFilters,
    ClozeTextListResponse,
    CreateClozeTextPayload,
    UpdateClozeTextPayload,
    BulkUpdateClozeTextPayload,
    ImportResult,
    ImportMode,
    ClozeTextStats,
    ClozeTextCSVRow,
} from '@/types/cloze-text';
import Papa from 'papaparse';

/**
 * Fetch filtered cloze texts list
 * Uses server-side API with service_role key to bypass RLS
 */
export async function fetchClozeTextsList(filters: ClozeTextFilters = {}): Promise<ClozeTextListResponse> {
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
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (level) params.append('level', level);
        if (difficulty) params.append('difficulty', difficulty);
        if (frequency_min !== undefined) params.append('frequency_min', frequency_min.toString());
        if (frequency_max !== undefined) params.append('frequency_max', frequency_max.toString());
        if (category) params.append('category', category);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await fetch(`/api/admin/cloze-text/list?${params.toString()}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fetch failed');
        }

        const data = await response.json();
        return data as ClozeTextListResponse;
    } catch (error) {
        console.error('fetchClozeTextsList error:', error);
        throw error;
    }
}

/**
 * Get cloze texts statistics
 */
export async function fetchClozeTextsStats(): Promise<ClozeTextStats> {
    try {
        const { data, error } = await supabase.rpc('get_cloze_texts_stats');

        if (error) {
            console.error('Fetch stats error:', error);
            throw new Error(error.message);
        }

        return data as ClozeTextStats;
    } catch (error) {
        console.error('fetchClozeTextsStats error:', error);
        throw error;
    }
}

/**
 * Create new cloze text entry
 * Uses server-side API with service_role key to bypass RLS
 */
export async function createClozeTextEntry(entry: CreateClozeTextPayload): Promise<ClozeTextEntry> {
    try {
        const response = await fetch('/api/admin/cloze-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Create failed');
        }

        const data = await response.json();
        return data as ClozeTextEntry;
    } catch (error) {
        console.error('createClozeTextEntry error:', error);
        throw error;
    }
}

/**
 * Update existing cloze text entry
 * Uses server-side API with service_role key to bypass RLS
 */
export async function updateClozeTextEntry(id: string, updates: UpdateClozeTextPayload): Promise<ClozeTextEntry> {
    try {
        const response = await fetch('/api/admin/cloze-text', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Update failed');
        }

        const data = await response.json();
        return data as ClozeTextEntry;
    } catch (error) {
        console.error('updateClozeTextEntry error:', error);
        throw error;
    }
}

/**
 * Delete cloze text entry
 * Uses server-side API with service_role key to bypass RLS
 */
export async function deleteClozeTextEntry(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/admin/cloze-text?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Delete failed');
        }
    } catch (error) {
        console.error('deleteClozeTextEntry error:', error);
        throw error;
    }
}

/**
 * Bulk update cloze text entries
 */
export async function bulkUpdateClozeTexts(payload: BulkUpdateClozeTextPayload): Promise<number> {
    try {
        const { data, error } = await supabase.rpc('bulk_update_cloze_texts', {
            p_ids: payload.ids,
            p_level: payload.level || null,
            p_difficulty: payload.difficulty || null,
            p_frequency: payload.frequency || null,
            p_category: payload.category || null,
        });

        if (error) {
            console.error('Bulk update error:', error);
            throw new Error(error.message);
        }

        return data as number;
    } catch (error) {
        console.error('bulkUpdateClozeTexts error:', error);
        throw error;
    }
}

/**
 * Bulk delete cloze text entries
 */
export async function bulkDeleteClozeTexts(ids: string[]): Promise<number> {
    try {
        const { data, error } = await supabase.rpc('bulk_delete_cloze_texts', {
            p_ids: ids,
        });

        if (error) {
            console.error('Bulk delete error:', error);
            throw new Error(error.message);
        }

        return data as number;
    } catch (error) {
        console.error('bulkDeleteClozeTexts error:', error);
        throw error;
    }
}

/**
 * Check for duplicate cloze text entry
 */
export async function checkDuplicate(
    greekTranscription: string,
    level: string,
    excludeId?: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('check_cloze_texts_duplicate', {
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
        Papa.parse<ClozeTextCSVRow>(file, {
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
                            .from('cloze_texts')
                            .select('id');

                        if (existingIds && existingIds.length > 0) {
                            await supabase
                                .from('cloze_texts')
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

                            if (!row.cloze_answer || row.cloze_answer.trim() === '') {
                                errors.push({
                                    row: rowNum,
                                    field: 'cloze_answer',
                                    message: 'Cloze answer is required',
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

                            // Normalize difficulty
                            let difficultyValue = row.difficulty?.trim().toLowerCase();
                            if (difficultyValue === 'middle') {
                                difficultyValue = 'medium';
                            }

                            // Create entry object
                            const entry: CreateClozeTextPayload = {
                                nr: row.nr ? parseInt(row.nr, 10) : undefined,
                                greek_transcription: row.greek_transcription.trim(),
                                greek_phonetic: row.greek_phonetic?.trim(),
                                cloze_answer: row.cloze_answer.trim(),
                                cloze_hints: row.cloze_hints?.trim(),

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

                                level: row.level.trim() as CreateClozeTextPayload['level'],
                                difficulty: difficultyValue as CreateClozeTextPayload['difficulty'],
                                frequency: frequency as CreateClozeTextPayload['frequency'],
                                category: row.category?.trim(),
                            };

                            // Insert to database
                            const { error: insertError } = await supabase
                                .from('cloze_texts')
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
                        message: `Imported ${imported} cloze texts, skipped ${skipped}`,
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
 * Export cloze texts to CSV
 */
export async function exportCSV(filters: ClozeTextFilters = {}): Promise<Blob> {
    try {
        // Fetch all data (remove pagination for export)
        const { data, error } = await supabase
            .from('cloze_texts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        const entries = data as ClozeTextEntry[];

        // Convert to CSV format
        const csvData = entries.map((entry) => ({
            nr: entry.nr || '',
            greek_transcription: entry.greek_transcription,
            greek_phonetic: entry.greek_phonetic || '',
            cloze_answer: entry.cloze_answer,
            cloze_hints: entry.cloze_hints || '',

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
            category: entry.category || '',
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
            greek_transcription: 'Καλημέρα, το όνομά μου ___ Γιάννης',
            greek_phonetic: 'kalimera, to onoma mu ___ Yiannis',
            cloze_answer: 'είναι',
            cloze_hints: 'verb "to be" in 3rd person singular',
            en_translation: 'Good morning, my name ___ John',
            en_importance_reason: 'Basic verb conjugation',
            en_audio_url: '',
            de_translation: 'Guten Morgen, mein Name ___ John',
            de_importance_reason: 'Grundlegende Verbkonjugation',
            de_audio_url: '',
            es_translation: 'Buenos días, mi nombre ___ John',
            es_importance_reason: 'Conjugación verbal básica',
            es_audio_url: '',
            ru_translation: 'Доброе утро, меня зовут ___ Джон',
            ru_importance_reason: 'Базовое спряжение глагола',
            ru_audio_url: '',
            level: 'A1',
            difficulty: 'easy',
            frequency: '5',
            category: 'grammar',
        },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Vorlage-Cloze-Text-Vollständig.csv';
    link.click();
    URL.revokeObjectURL(url);
}

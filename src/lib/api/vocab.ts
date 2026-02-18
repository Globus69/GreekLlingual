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
 *
 * Uses server-side API route that has service_role key to bypass RLS.
 * This is secure because:
 * - service_role key stays server-side only
 * - Never exposed to browser
 * - Can add additional auth checks in API route if needed
 *
 * Why not client-side?
 * - RLS policies can be complex and may block authenticated users
 * - Using service_role server-side ensures consistent behavior
 * - Better error handling and logging
 */
export async function importCSV(file: File, mode: ImportMode): Promise<ImportResult> {
    try {
        console.log(`📤 Sending import request to server API...`);

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);

        // Send to server-side API
        const response = await fetch('/api/admin/vocab/import', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server API error:', errorData);

            // User-friendly error messages
            if (errorData.error?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
                throw new Error(
                    'Server-Konfigurationsfehler: SUPABASE_SERVICE_ROLE_KEY fehlt. ' +
                        'Bitte füge den Key zur .env.local hinzu.'
                );
            }

            throw new Error(errorData.error || 'Import fehlgeschlagen');
        }

        const result: ImportResult = await response.json();
        console.log('✅ Import completed:', result);
        return result;
    } catch (error) {
        console.error('importCSV error:', error);
        throw error;
    }
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

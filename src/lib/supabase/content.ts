import { supabase } from './client';
import {
    Content,
    ContentInsert,
    ContentUpdate,
    MultilingualContent,
    MultilingualContentInsert,
    MultilingualContentUpdate
} from '../../types/content';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
    filterParamsSchema,
    safeParse,
    contentInsertSchema,
    contentUpdateSchema,
    multilingualContentInsertSchema,
    multilingualContentUpdateSchema,
    uuidSchema,
    bulkDeleteSchema,
    practiceModesConfigSchema,
    practiceAttemptSchema,
    type PracticeModesConfig,
    type PracticeAttempt
} from '../validation/schemas';

interface FilterParams {
    search?: string;
    type?: string;
    level?: string[];
    difficulty?: string[];
    page?: number;
    pageSize?: number;
}

/**
 * Fetch multilingual content with filtering and pagination
 */
export async function fetchContent(params: FilterParams): Promise<{ data: MultilingualContent[]; count: number }> {
    // Validate filter params
    const validationResult = safeParse(filterParamsSchema, params);
    if (!validationResult.success) {
        console.error('[fetchContent] Validation error:', validationResult.error);
        toast.error('Invalid filter parameters: ' + validationResult.error);
        return { data: [], count: 0 };
    }

    const validParams = validationResult.data;
    let query = supabase.from('multilingual_content').select('*', { count: 'exact' });

    if (validParams.search) {
        // Sanitized search - validated by Zod, safe from SQL injection
        // Search in greek_transcription and all translation fields
        query = query.or(
            `greek_transcription.ilike.%${validParams.search}%,` +
            `en_translation.ilike.%${validParams.search}%,` +
            `de_translation.ilike.%${validParams.search}%,` +
            `es_translation.ilike.%${validParams.search}%,` +
            `ru_translation.ilike.%${validParams.search}%`
        );
    }
    if (validParams.type) {
        query = query.eq('type', validParams.type);
    }
    if (validParams.level && validParams.level.length > 0) {
        query = query.in('level', validParams.level);
    }
    if (validParams.difficulty && validParams.difficulty.length > 0) {
        query = query.in('difficulty', validParams.difficulty);
    }

    if (validParams.page !== undefined && validParams.pageSize) {
        const from = validParams.page * validParams.pageSize;
        const to = from + validParams.pageSize - 1;
        query = query.range(from, to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
        toast.error('Fehler beim Laden der Inhalte: ' + error.message);
        return { data: [], count: 0 };
    }

    return { data: data as MultilingualContent[], count: count || 0 };
}

/**
 * Create multilingual content
 * Uses RPC function to bypass RLS with custom auth
 */
export async function createContent(item: MultilingualContentInsert): Promise<MultilingualContent | null> {
    // Validate input
    const validationResult = safeParse(multilingualContentInsertSchema, item);
    if (!validationResult.success) {
        toast.error('Invalid input: ' + validationResult.error);
        return null;
    }

    const validItem = validationResult.data;

    // Get user from localStorage
    const storedUser = localStorage.getItem('greeklingua_user');
    if (!storedUser) {
        toast.error('Fehler beim Erstellen: Nicht angemeldet');
        return null;
    }

    const user = JSON.parse(storedUser);

    // Use RPC function instead of direct insert (bypasses RLS with custom auth)
    const { data, error } = await supabase.rpc('admin_create_multilingual_content', {
        p_user_id: user.id,
        p_nr: validItem.nr || null,
        p_type: validItem.type,
        p_greek_transcription: validItem.greek_transcription,
        p_greek_phonetic: validItem.greek_phonetic || null,
        p_en_translation: validItem.en_translation || null,
        p_en_importance_reason: validItem.en_importance_reason || null,
        p_en_audio_url: validItem.en_audio_url || null,
        p_de_translation: validItem.de_translation || null,
        p_de_importance_reason: validItem.de_importance_reason || null,
        p_de_audio_url: validItem.de_audio_url || null,
        p_es_translation: validItem.es_translation || null,
        p_es_importance_reason: validItem.es_importance_reason || null,
        p_es_audio_url: validItem.es_audio_url || null,
        p_ru_translation: validItem.ru_translation || null,
        p_ru_importance_reason: validItem.ru_importance_reason || null,
        p_ru_audio_url: validItem.ru_audio_url || null,
        p_level: validItem.level,
        p_difficulty: validItem.difficulty,
        p_frequency: validItem.frequency,
    });

    if (error) {
        toast.error('Fehler beim Erstellen: ' + error.message);
        return null;
    }

    return data as MultilingualContent;
}

/**
 * Update multilingual content
 * Uses RPC function to bypass RLS with custom auth
 */
export async function updateContent(id: string, updates: MultilingualContentUpdate): Promise<MultilingualContent | null> {
    // Validate ID
    const idValidation = safeParse(uuidSchema, id);
    if (!idValidation.success) {
        toast.error('Invalid ID format');
        return null;
    }

    // Validate updates
    const validationResult = safeParse(multilingualContentUpdateSchema, updates);
    if (!validationResult.success) {
        toast.error('Invalid input: ' + validationResult.error);
        return null;
    }

    const validUpdates = validationResult.data;

    // Get user from localStorage
    const storedUser = localStorage.getItem('greeklingua_user');
    if (!storedUser) {
        toast.error('Fehler beim Aktualisieren: Nicht angemeldet');
        return null;
    }

    const user = JSON.parse(storedUser);

    // Use RPC function instead of direct update (bypasses RLS with custom auth)
    const { data, error } = await supabase.rpc('admin_update_multilingual_content', {
        p_user_id: user.id,
        p_content_id: idValidation.data,
        p_nr: validUpdates.nr !== undefined ? validUpdates.nr : null,
        p_type: validUpdates.type,
        p_greek_transcription: validUpdates.greek_transcription,
        p_greek_phonetic: validUpdates.greek_phonetic !== undefined ? validUpdates.greek_phonetic : null,
        p_en_translation: validUpdates.en_translation !== undefined ? validUpdates.en_translation : null,
        p_en_importance_reason: validUpdates.en_importance_reason !== undefined ? validUpdates.en_importance_reason : null,
        p_en_audio_url: validUpdates.en_audio_url !== undefined ? validUpdates.en_audio_url : null,
        p_de_translation: validUpdates.de_translation !== undefined ? validUpdates.de_translation : null,
        p_de_importance_reason: validUpdates.de_importance_reason !== undefined ? validUpdates.de_importance_reason : null,
        p_de_audio_url: validUpdates.de_audio_url !== undefined ? validUpdates.de_audio_url : null,
        p_es_translation: validUpdates.es_translation !== undefined ? validUpdates.es_translation : null,
        p_es_importance_reason: validUpdates.es_importance_reason !== undefined ? validUpdates.es_importance_reason : null,
        p_es_audio_url: validUpdates.es_audio_url !== undefined ? validUpdates.es_audio_url : null,
        p_ru_translation: validUpdates.ru_translation !== undefined ? validUpdates.ru_translation : null,
        p_ru_importance_reason: validUpdates.ru_importance_reason !== undefined ? validUpdates.ru_importance_reason : null,
        p_ru_audio_url: validUpdates.ru_audio_url !== undefined ? validUpdates.ru_audio_url : null,
        p_level: validUpdates.level,
        p_difficulty: validUpdates.difficulty,
        p_frequency: validUpdates.frequency,
    });

    if (error) {
        toast.error('Fehler beim Aktualisieren: ' + error.message);
        return null;
    }

    return data as MultilingualContent;
}

/**
 * Delete multilingual content
 * Uses RPC function to bypass RLS with custom auth
 */
export async function deleteContent(id: string): Promise<boolean> {
    // Validate ID
    const idValidation = safeParse(uuidSchema, id);
    if (!idValidation.success) {
        toast.error('Invalid ID format');
        return false;
    }

    // Get user from localStorage
    const storedUser = localStorage.getItem('greeklingua_user');
    if (!storedUser) {
        toast.error('Fehler beim Löschen: Nicht angemeldet');
        return false;
    }

    const user = JSON.parse(storedUser);

    // Use RPC function instead of direct delete (bypasses RLS with custom auth)
    const { error } = await supabase.rpc('admin_delete_multilingual_content', {
        p_user_id: user.id,
        p_content_id: idValidation.data,
    });

    if (error) {
        toast.error('Fehler beim Löschen: ' + error.message);
        return false;
    }

    return true;
}

/**
 * Bulk delete multilingual content
 * Uses RPC function to bypass RLS with custom auth
 */
export async function bulkDeleteContent(ids: string[]): Promise<boolean> {
    // Validate IDs
    const validationResult = safeParse(bulkDeleteSchema, { ids });
    if (!validationResult.success) {
        toast.error('Invalid IDs: ' + validationResult.error);
        return false;
    }

    const validIds = validationResult.data.ids;

    // Get user from localStorage
    const storedUser = localStorage.getItem('greeklingua_user');
    if (!storedUser) {
        toast.error('Fehler beim Löschen: Nicht angemeldet');
        return false;
    }

    const user = JSON.parse(storedUser);

    // Use RPC function with admin authorization check (SECURITY DEFINER)
    const { data, error } = await supabase.rpc('admin_bulk_delete_multilingual_content', {
        p_user_id: user.id,
        p_content_ids: validIds,
    });

    if (error) {
        toast.error('Fehler beim Bulk-Löschen: ' + error.message);
        return false;
    }

    // Check results
    if (data && data.length > 0) {
        const result = data[0];
        if (result.errors && result.errors.length > 0) {
            console.warn('⚠️ Some items could not be deleted:', result.errors);
            toast.warning(`${result.deleted_count} items deleted, ${result.errors.length} errors`);
        } else {
            toast.success(`${result.deleted_count} items successfully deleted`);
        }
        return result.deleted_count > 0;
    }

    return true;
}

/**
 * Generate CSV from multilingual content data
 */
export function generateCSV(data: MultilingualContent[]): string {
    return Papa.unparse(data, {
        header: true,
        columns: [
            'id', 'nr', 'type',
            'greek_transcription', 'greek_phonetic',
            'en_translation', 'en_importance_reason', 'en_audio_url',
            'de_translation', 'de_importance_reason', 'de_audio_url',
            'es_translation', 'es_importance_reason', 'es_audio_url',
            'ru_translation', 'ru_importance_reason', 'ru_audio_url',
            'level', 'difficulty', 'frequency',
            'created_at', 'updated_at'
        ],
    });
}

/**
 * Import multilingual content from CSV file
 */
export async function importFromCSV(file: File): Promise<{ validItems: MultilingualContentInsert[]; invalidItems: { row: number; errors: string[] }[] }> {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const validItems: MultilingualContentInsert[] = [];
                const invalidItems: { row: number; errors: string[] }[] = [];

                results.data.forEach((row: any, index: number) => {
                    // Skip empty rows
                    if (!row || Object.keys(row).length === 0) {
                        return;
                    }

                    // Use Zod validation for consistent and secure validation
                    const validationResult = safeParse(multilingualContentInsertSchema, {
                        nr: row.nr ? parseInt(row.nr) : undefined,
                        type: row.type,
                        greek_transcription: row.greek_transcription,
                        greek_phonetic: row.greek_phonetic || undefined,
                        en_translation: row.en_translation || undefined,
                        en_importance_reason: row.en_importance_reason || undefined,
                        en_audio_url: row.en_audio_url || undefined,
                        de_translation: row.de_translation || undefined,
                        de_importance_reason: row.de_importance_reason || undefined,
                        de_audio_url: row.de_audio_url || undefined,
                        es_translation: row.es_translation || undefined,
                        es_importance_reason: row.es_importance_reason || undefined,
                        es_audio_url: row.es_audio_url || undefined,
                        ru_translation: row.ru_translation || undefined,
                        ru_importance_reason: row.ru_importance_reason || undefined,
                        ru_audio_url: row.ru_audio_url || undefined,
                        level: row.level,
                        difficulty: row.difficulty,
                        frequency: row.frequency ? parseInt(row.frequency) : 3, // Default to 3
                    });

                    if (validationResult.success) {
                        validItems.push(validationResult.data);
                    } else {
                        invalidItems.push({
                            row: index + 1,
                            errors: [validationResult.error],
                        });
                    }
                });

                resolve({ validItems, invalidItems });
            },
        });
    });
}

/**
 * Bulk import multilingual content from parsed CSV data
 * Uses RPC function to bypass RLS with custom auth
 */
export async function bulkImport(items: MultilingualContentInsert[]): Promise<{ success: number; errors: string[] }> {
    // Get user from localStorage
    const storedUser = localStorage.getItem('greeklingua_user');
    if (!storedUser) {
        return { success: 0, errors: ['Nicht angemeldet'] };
    }

    const user = JSON.parse(storedUser);

    // Use RPC function for bulk import (bypasses RLS with custom auth)
    const { data, error } = await supabase.rpc('admin_bulk_import_multilingual_content', {
        p_user_id: user.id,
        p_items: items,
    });

    if (error) {
        return { success: 0, errors: [error.message] };
    }

    if (data && data.length > 0) {
        const result = data[0];
        return {
            success: result.success_count || 0,
            errors: result.errors || [],
        };
    }

    return { success: 0, errors: ['Unbekannter Fehler'] };
}

/**
 * Generate template CSV for multilingual content import
 */
export function generateTemplateCSV(): string {
    const headers = [
        'nr', 'type', 'greek_transcription', 'greek_phonetic',
        'en_translation', 'en_importance_reason', 'en_audio_url',
        'de_translation', 'de_importance_reason', 'de_audio_url',
        'es_translation', 'es_importance_reason', 'es_audio_url',
        'ru_translation', 'ru_importance_reason', 'ru_audio_url',
        'level', 'difficulty', 'frequency'
    ];
    const exampleRow = [
        '1', 'vocabulary', 'Γεια', 'YAH-soo',
        'Hello', 'Common greeting used daily', 'https://audio.example.com/hello-en.mp3',
        'Hallo', 'Häufige Begrüßung im Alltag', 'https://audio.example.com/hello-de.mp3',
        'Hola', 'Saludo común usado diariamente', 'https://audio.example.com/hello-es.mp3',
        'Привет', 'Обычное приветствие для повседневного использования', 'https://audio.example.com/hello-ru.mp3',
        'A1', 'easy', '5'
    ];
    return Papa.unparse([exampleRow], { header: true, columns: headers });
}

// ============================================================================
// PRACTICE MODES FUNCTIONS
// ============================================================================

/**
 * Update practice mode configuration for a learning item (Admin only)
 *
 * @param itemId - UUID of the learning item
 * @param config - Practice modes configuration object
 * @returns True if update successful, false otherwise
 */
export async function updatePracticeModeConfig(
    itemId: string,
    config: PracticeModesConfig
): Promise<boolean> {
    // Validate item ID
    const idValidation = safeParse(uuidSchema, itemId);
    if (!idValidation.success) {
        toast.error('Invalid ID format');
        return false;
    }

    // Validate configuration
    const configValidation = safeParse(practiceModesConfigSchema, config);
    if (!configValidation.success) {
        toast.error('Invalid configuration: ' + configValidation.error);
        return false;
    }

    // Get user from localStorage
    const storedUser = localStorage.getItem('greeklingua_user');
    if (!storedUser) {
        toast.error('Fehler: Nicht angemeldet');
        return false;
    }

    const user = JSON.parse(storedUser);

    // Call RPC function
    const { error } = await supabase.rpc('admin_update_practice_config', {
        p_user_id: user.id,
        p_item_id: idValidation.data,
        p_config: configValidation.data
    });

    if (error) {
        toast.error('Failed to update practice configuration: ' + error.message);
        return false;
    }

    toast.success('Practice configuration updated successfully!');
    return true;
}

/**
 * Get practice mode configuration and unlock status for a learning item
 *
 * @param itemId - UUID of the learning item
 * @param userId - UUID of the user
 * @param modeType - Type of practice mode (matching, multiple_choice, write_input)
 * @returns Practice config object with unlock status
 */
export async function getPracticeConfig(
    itemId: string,
    userId: string,
    modeType: string
): Promise<{
    unlocked: boolean;
    config: any;
    user_reps: number;
    threshold: number;
    enabled: boolean;
    mode_available: boolean;
} | null> {
    // Validate IDs
    const itemIdValidation = safeParse(uuidSchema, itemId);
    const userIdValidation = safeParse(uuidSchema, userId);

    if (!itemIdValidation.success || !userIdValidation.success) {
        toast.error('Invalid ID format');
        return null;
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('get_practice_config', {
        p_item_id: itemIdValidation.data,
        p_user_id: userIdValidation.data,
        p_mode_type: modeType
    });

    if (error) {
        console.error('[getPracticeConfig] Error:', error);
        toast.error('Failed to load practice configuration');
        return null;
    }

    return data as any;
}

/**
 * Record a practice attempt with score and FSRS rating
 *
 * @param attempt - Practice attempt data
 * @param userId - UUID of the user
 * @returns True if recording successful, false otherwise
 */
export async function recordPracticeAttempt(
    attempt: Omit<PracticeAttempt, 'metadata'> & { metadata?: Record<string, unknown> },
    userId: string
): Promise<boolean> {
    // Validate user ID
    const userIdValidation = safeParse(uuidSchema, userId);
    if (!userIdValidation.success) {
        toast.error('Invalid user ID');
        return false;
    }

    // Validate attempt data
    const attemptValidation = safeParse(practiceAttemptSchema, attempt);
    if (!attemptValidation.success) {
        toast.error('Invalid attempt data: ' + attemptValidation.error);
        return false;
    }

    const validAttempt = attemptValidation.data;

    // Call RPC function
    const { data, error } = await supabase.rpc('record_practice_attempt', {
        p_user_id: userIdValidation.data,
        p_item_id: validAttempt.item_id,
        p_mode_type: validAttempt.mode_type,
        p_success: validAttempt.success,
        p_score: validAttempt.score,
        p_time_seconds: validAttempt.time_seconds,
        p_mistakes: validAttempt.mistakes,
        p_fsrs_rating: validAttempt.fsrs_rating,
        p_metadata: validAttempt.metadata || {}
    });

    if (error) {
        console.error('[recordPracticeAttempt] Error:', error);
        toast.error('Failed to record practice attempt');
        return false;
    }

    return data === true;
}

/**
 * Get practice statistics for a user/item combination
 *
 * @param userId - UUID of the user
 * @param itemId - UUID of the learning item
 * @param days - Number of days to look back (default: 30)
 * @returns Array of statistics by mode type
 */
export async function getPracticeStats(
    userId: string,
    itemId: string,
    days: number = 30
): Promise<any[] | null> {
    // Validate IDs
    const userIdValidation = safeParse(uuidSchema, userId);
    const itemIdValidation = safeParse(uuidSchema, itemId);

    if (!userIdValidation.success || !itemIdValidation.success) {
        toast.error('Invalid ID format');
        return null;
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('get_practice_stats', {
        p_user_id: userIdValidation.data,
        p_item_id: itemIdValidation.data,
        p_days: days
    });

    if (error) {
        console.error('[getPracticeStats] Error:', error);
        toast.error('Failed to load practice statistics');
        return null;
    }

    return data || [];
}

import { supabase } from './client';
import { Content, ContentInsert, ContentUpdate } from '../../types/content';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
    filterParamsSchema,
    safeParse,
    contentInsertSchema,
    contentUpdateSchema,
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

export async function fetchContent(params: FilterParams): Promise<{ data: Content[]; count: number }> {
    // Validate filter params
    const validationResult = safeParse(filterParamsSchema, params);
    if (!validationResult.success) {
        console.error('[fetchContent] Validation error:', validationResult.error);
        toast.error('Invalid filter parameters: ' + validationResult.error);
        return { data: [], count: 0 };
    }

    const validParams = validationResult.data;
    let query = supabase.from('content').select('*', { count: 'exact' });

    if (validParams.search) {
        // Sanitized search - validated by Zod, safe from SQL injection
        query = query.or(`english.ilike.%${validParams.search}%,greek.ilike.%${validParams.search}%`);
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

    return { data: data as Content[], count: count || 0 };
}

export async function createContent(item: ContentInsert): Promise<Content | null> {
    // Validate input
    const validationResult = safeParse(contentInsertSchema, item);
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
    const { data, error } = await supabase.rpc('admin_create_content', {
        p_user_id: user.id,
        p_type: validItem.type,
        p_english: validItem.english,
        p_greek: validItem.greek,
        p_level: validItem.level,
        p_difficulty: validItem.difficulty,
        p_phonetic: validItem.phonetic || null,
        p_example_en: validItem.example_en || null,
        p_example_gr: validItem.example_gr || null,
        p_audio_url: validItem.audio_url || null,
    });

    if (error) {
        toast.error('Fehler beim Erstellen: ' + error.message);
        return null;
    }

    return data as Content;
}

export async function updateContent(id: string, updates: ContentUpdate): Promise<Content | null> {
    // Validate ID
    const idValidation = safeParse(uuidSchema, id);
    if (!idValidation.success) {
        toast.error('Invalid ID format');
        return null;
    }

    // Validate updates
    const validationResult = safeParse(contentUpdateSchema, updates);
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
    const { data, error } = await supabase.rpc('admin_update_content', {
        p_user_id: user.id,
        p_content_id: idValidation.data,
        p_type: validUpdates.type,
        p_english: validUpdates.english,
        p_greek: validUpdates.greek,
        p_level: validUpdates.level,
        p_difficulty: validUpdates.difficulty,
        p_phonetic: validUpdates.phonetic || null,
        p_example_en: validUpdates.example_en || null,
        p_example_gr: validUpdates.example_gr || null,
        p_audio_url: validUpdates.audio_url || null,
    });

    if (error) {
        toast.error('Fehler beim Aktualisieren: ' + error.message);
        return null;
    }

    return data as Content;
}

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
    const { error } = await supabase.rpc('admin_delete_content', {
        p_user_id: user.id,
        p_content_id: idValidation.data,
    });

    if (error) {
        toast.error('Fehler beim Löschen: ' + error.message);
        return false;
    }

    return true;
}

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
    const { data, error } = await supabase.rpc('admin_bulk_delete_content', {
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

export function generateCSV(data: Content[]): string {
    return Papa.unparse(data, {
        header: true,
        columns: ['id', 'type', 'english', 'greek', 'level', 'difficulty', 'phonetic', 'example_en', 'example_gr', 'audio_url', 'created_at', 'updated_at'],
    });
}

export async function importFromCSV(file: File): Promise<{ validItems: ContentInsert[]; invalidItems: { row: number; errors: string[] }[] }> {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const validItems: ContentInsert[] = [];
                const invalidItems: { row: number; errors: string[] }[] = [];

                results.data.forEach((row: any, index: number) => {
                    // Skip empty rows
                    if (!row || Object.keys(row).length === 0) {
                        return;
                    }

                    // Use Zod validation for consistent and secure validation
                    const validationResult = safeParse(contentInsertSchema, {
                        type: row.type,
                        english: row.english,
                        greek: row.greek,
                        level: row.level,
                        difficulty: row.difficulty,
                        phonetic: row.phonetic || undefined,
                        example_en: row.example_en || undefined,
                        example_gr: row.example_gr || undefined,
                        audio_url: row.audio_url || undefined,
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

export async function bulkImport(items: ContentInsert[]): Promise<{ success: number; errors: string[] }> {
    // Get user from localStorage
    const storedUser = localStorage.getItem('greeklingua_user');
    if (!storedUser) {
        return { success: 0, errors: ['Nicht angemeldet'] };
    }

    const user = JSON.parse(storedUser);

    // Use RPC function for bulk import (bypasses RLS with custom auth)
    const { data, error } = await supabase.rpc('admin_bulk_import_content', {
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

export function generateTemplateCSV(): string {
    const headers = ['type', 'english', 'greek', 'level', 'difficulty', 'phonetic', 'example_en', 'example_gr', 'audio_url'];
    const exampleRow = ['vocabulary', 'Hello', 'Γεια', 'A1', 'easy', 'he-lo', 'Hello, how are you?', 'Γεια, πώς είσαι;', 'https://audio.example.com/hello.mp3'];
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

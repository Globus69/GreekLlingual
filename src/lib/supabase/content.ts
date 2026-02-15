/**
 * Supabase API Functions for Content Management
 * CRUD operations + Import/Export helpers
 */

import { supabase } from '@/db/supabase';
import type {
    Content,
    ContentFormData,
    ContentFilters,
    BulkImportResult,
    ImportPreviewRow,
} from '@/types/content';

const TABLE_NAME = 'learning_items';

/**
 * Fetch all content with optional filters
 */
export async function fetchContent(
    filters?: ContentFilters,
    page = 1,
    pageSize = 50
): Promise<{ data: Content[]; count: number; error: Error | null }> {
    try {
        let query = supabase.from(TABLE_NAME).select('*', { count: 'exact' });

        // Apply filters
        if (filters?.search) {
            query = query.or(
                `english.ilike.%${filters.search}%,greek.ilike.%${filters.search}%`
            );
        }
        if (filters?.type && filters.type !== 'all') {
            query = query.eq('type', filters.type);
        }
        if (filters?.level && filters.level !== 'all') {
            query = query.eq('level', filters.level);
        }
        if (filters?.difficulty && filters.difficulty !== 'all') {
            query = query.eq('difficulty', filters.difficulty);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        return { data: data || [], count: count || 0, error: null };
    } catch (error) {
        console.error('Error fetching content:', error);
        return { data: [], count: 0, error: error as Error };
    }
}

/**
 * Fetch single content item by ID
 */
export async function fetchContentById(
    id: string
): Promise<{ data: Content | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching content by ID:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Create new content item
 */
export async function createContent(
    formData: ContentFormData
): Promise<{ data: Content | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([formData])
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error creating content:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Update existing content item
 */
export async function updateContent(
    id: string,
    formData: ContentFormData
): Promise<{ data: Content | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(formData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error updating content:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Delete single content item
 */
export async function deleteContent(
    id: string
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

        if (error) throw error;

        return { error: null };
    } catch (error) {
        console.error('Error deleting content:', error);
        return { error: error as Error };
    }
}

/**
 * Bulk delete content items
 */
export async function bulkDeleteContent(
    ids: string[]
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from(TABLE_NAME).delete().in('id', ids);

        if (error) throw error;

        return { error: null };
    } catch (error) {
        console.error('Error bulk deleting content:', error);
        return { error: error as Error };
    }
}

/**
 * Bulk import content items
 */
export async function bulkImportContent(
    items: ContentFormData[]
): Promise<BulkImportResult> {
    const result: BulkImportResult = {
        success: 0,
        failed: 0,
        errors: [],
    };

    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(items)
            .select();

        if (error) throw error;

        result.success = data?.length || 0;
    } catch (error) {
        console.error('Error bulk importing content:', error);
        result.failed = items.length;
        result.errors.push({
            row: 0,
            message: (error as Error).message,
        });
    }

    return result;
}

/**
 * Export all content as CSV
 */
export async function exportContentAsCSV(
    filters?: ContentFilters
): Promise<{ csv: string; error: Error | null }> {
    try {
        const { data, error } = await fetchContent(filters, 1, 10000);

        if (error) throw error;

        // CSV Headers
        const headers = [
            'type',
            'english',
            'greek',
            'level',
            'difficulty',
            'phonetic',
            'example_en',
            'example_gr',
            'audio_url',
        ];

        // CSV Rows
        const rows = data.map((item) =>
            [
                item.type,
                `"${item.english.replace(/"/g, '""')}"`,
                `"${item.greek.replace(/"/g, '""')}"`,
                item.level,
                item.difficulty,
                item.phonetic || '',
                item.example_en ? `"${item.example_en.replace(/"/g, '""')}"` : '',
                item.example_gr ? `"${item.example_gr.replace(/"/g, '""')}"` : '',
                item.audio_url || '',
            ].join(',')
        );

        const csv = [headers.join(','), ...rows].join('\n');

        return { csv, error: null };
    } catch (error) {
        console.error('Error exporting content as CSV:', error);
        return { csv: '', error: error as Error };
    }
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
    const headers = [
        'type',
        'english',
        'greek',
        'level',
        'difficulty',
        'phonetic',
        'example_en',
        'example_gr',
        'audio_url',
    ];

    const exampleRow = [
        'vocabulary',
        '"Hello"',
        '"Γεια σου"',
        'A1',
        'easy',
        '"YAH soo"',
        '"Hello, how are you?"',
        '"Γεια σου, τι κάνεις;"',
        '',
    ];

    return [headers.join(','), exampleRow.join(',')].join('\n');
}

/**
 * Validate import row
 */
export function validateImportRow(
    row: any,
    rowIndex: number
): ImportPreviewRow {
    const errors: string[] = [];

    // Required fields
    if (!row.type || !['vocabulary', 'phrase', 'grammar'].includes(row.type)) {
        errors.push('Invalid or missing type');
    }
    if (!row.english || row.english.trim() === '') {
        errors.push('English text is required');
    }
    if (!row.greek || row.greek.trim() === '') {
        errors.push('Greek text is required');
    }
    if (!row.level || !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(row.level)) {
        errors.push('Invalid or missing level');
    }
    if (
        !row.difficulty ||
        !['easy', 'medium', 'hard'].includes(row.difficulty)
    ) {
        errors.push('Invalid or missing difficulty');
    }

    return {
        _rowIndex: rowIndex,
        _errors: errors,
        _isValid: errors.length === 0,
        type: row.type,
        english: row.english,
        greek: row.greek,
        level: row.level,
        difficulty: row.difficulty,
        phonetic: row.phonetic,
        example_en: row.example_en,
        example_gr: row.example_gr,
        audio_url: row.audio_url,
    };
}

/**
 * Parse CSV file
 */
export function parseCSV(csvText: string): ImportPreviewRow[] {
    const lines = csvText.split('\n').filter((line) => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const rows: ImportPreviewRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
        const row: any = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        rows.push(validateImportRow(row, i));
    }

    return rows;
}

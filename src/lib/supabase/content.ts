import { supabase } from './client';
import { Content, ContentInsert, ContentUpdate } from '../../types/content';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface FilterParams {
    search?: string;
    type?: string;
    level?: string[];
    difficulty?: string[];
    page?: number;
    pageSize?: number;
}

export async function fetchContent(params: FilterParams): Promise<{ data: Content[]; count: number }> {
    let query = supabase.from('content').select('*', { count: 'exact' });

    if (params.search) {
        query = query.or(`english.ilike.%${params.search}%,greek.ilike.%${params.search}%`);
    }
    if (params.type) {
        query = query.eq('type', params.type);
    }
    if (params.level && params.level.length > 0) {
        query = query.in('level', params.level);
    }
    if (params.difficulty && params.difficulty.length > 0) {
        query = query.in('difficulty', params.difficulty);
    }

    if (params.page !== undefined && params.pageSize) {
        const from = params.page * params.pageSize;
        const to = from + params.pageSize - 1;
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
        p_type: item.type,
        p_english: item.english,
        p_greek: item.greek,
        p_level: item.level,
        p_difficulty: item.difficulty,
        p_phonetic: item.phonetic || null,
        p_example_en: item.example_en || null,
        p_example_gr: item.example_gr || null,
        p_audio_url: item.audio_url || null,
    });

    if (error) {
        toast.error('Fehler beim Erstellen: ' + error.message);
        return null;
    }

    return data as Content;
}

export async function updateContent(id: string, updates: ContentUpdate): Promise<Content | null> {
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
        p_content_id: id,
        p_type: updates.type,
        p_english: updates.english,
        p_greek: updates.greek,
        p_level: updates.level,
        p_difficulty: updates.difficulty,
        p_phonetic: updates.phonetic || null,
        p_example_en: updates.example_en || null,
        p_example_gr: updates.example_gr || null,
        p_audio_url: updates.audio_url || null,
    });

    if (error) {
        toast.error('Fehler beim Aktualisieren: ' + error.message);
        return null;
    }

    return data as Content;
}

export async function deleteContent(id: string): Promise<boolean> {
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
        p_content_id: id,
    });

    if (error) {
        toast.error('Fehler beim Löschen: ' + error.message);
        return false;
    }

    return true;
}

export async function bulkDeleteContent(ids: string[]): Promise<boolean> {
    const { error } = await supabase.from('content').delete().in('id', ids);

    if (error) {
        toast.error('Fehler beim Bulk-Löschen: ' + error.message);
        return false;
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
                const requiredFields = ['type', 'english', 'greek', 'level', 'difficulty'];

                results.data.forEach((row: any, index: number) => {
                    const errors: string[] = [];
                    requiredFields.forEach((field) => {
                        if (!row[field]) errors.push(`${field} fehlt`);
                    });

                    if (row.type && !['vocabulary', 'phrase', 'grammar'].includes(row.type)) {
                        errors.push('Ungültiger type');
                    }
                    if (row.level && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(row.level)) {
                        errors.push('Ungültiger level');
                    }
                    if (row.difficulty && !['easy', 'medium', 'hard'].includes(row.difficulty)) {
                        errors.push('Ungültige difficulty');
                    }

                    if (errors.length === 0) {
                        validItems.push({
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
                    } else {
                        invalidItems.push({ row: index + 1, errors });
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

/**
 * Cloze Text Types
 * TypeScript interfaces for cloze text (fill-in-the-blank) exercises
 */

export interface ClozeTextEntry {
    id: string;
    nr?: number;
    greek_transcription: string;
    greek_phonetic?: string;
    cloze_answer: string;
    cloze_hints?: string;
    en_translation?: string;
    en_importance_reason?: string;
    en_audio_url?: string;
    de_translation?: string;
    de_importance_reason?: string;
    de_audio_url?: string;
    es_translation?: string;
    es_importance_reason?: string;
    es_audio_url?: string;
    ru_translation?: string;
    ru_importance_reason?: string;
    ru_audio_url?: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    difficulty: 'easy' | 'medium' | 'hard';
    frequency: 1 | 2 | 3 | 4 | 5;
    category?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateClozeTextPayload {
    nr?: number;
    greek_transcription: string;
    greek_phonetic?: string;
    cloze_answer: string;
    cloze_hints?: string;
    en_translation?: string;
    en_importance_reason?: string;
    en_audio_url?: string;
    de_translation?: string;
    de_importance_reason?: string;
    de_audio_url?: string;
    es_translation?: string;
    es_importance_reason?: string;
    es_audio_url?: string;
    ru_translation?: string;
    ru_importance_reason?: string;
    ru_audio_url?: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    difficulty: 'easy' | 'medium' | 'hard';
    frequency: 1 | 2 | 3 | 4 | 5;
    category?: string;
}

export type UpdateClozeTextPayload = Partial<CreateClozeTextPayload>;

export interface ClozeTextFilters {
    search?: string;
    level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'All';
    difficulty?: 'easy' | 'medium' | 'hard' | 'All';
    frequency_min?: number;
    frequency_max?: number;
    category?: string;
    page?: number;
    limit?: number;
}

export interface ClozeTextListResponse {
    data: ClozeTextEntry[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface BulkUpdateClozeTextPayload {
    ids: string[];
    level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    difficulty?: 'easy' | 'medium' | 'hard';
    frequency?: 1 | 2 | 3 | 4 | 5;
    category?: string;
}

export type ImportMode = 'append' | 'overwrite';

export interface ImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    errors: Array<{
        row: number;
        field?: string;
        message: string;
    }>;
    message: string;
}

export interface ClozeTextStats {
    total: number;
    by_level: Record<string, number>;
    by_difficulty: Record<string, number>;
    by_category: Record<string, number>;
}

export interface ClozeTextCSVRow {
    nr?: string;
    greek_transcription: string;
    greek_phonetic?: string;
    cloze_answer: string;
    cloze_hints?: string;
    en_translation?: string;
    en_importance_reason?: string;
    en_audio_url?: string;
    de_translation?: string;
    de_importance_reason?: string;
    de_audio_url?: string;
    es_translation?: string;
    es_importance_reason?: string;
    es_audio_url?: string;
    ru_translation?: string;
    ru_importance_reason?: string;
    ru_audio_url?: string;
    level: string;
    difficulty: string;
    frequency: string;
    category?: string;
}

/**
 * Multilingual Vocabulary System - TypeScript Types
 * Used for vocabulary management in admin interface
 */

// CEFR Levels
export type VocabLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Difficulty levels
export type VocabDifficulty = 'easy' | 'medium' | 'hard';

// Frequency rating (1-5 stars)
export type VocabFrequency = 1 | 2 | 3 | 4 | 5;

/**
 * Translation data for a single language
 */
export interface VocabTranslation {
    translation: string;
    importance_reason?: string;
    audio_url?: string;
}

/**
 * Core vocabulary entry with all language translations
 */
export interface VocabEntry {
    id: string;
    nr?: number;

    // Greek content
    greek_transcription: string;
    greek_phonetic?: string;

    // English
    en_translation?: string;
    en_importance_reason?: string;
    en_audio_url?: string;

    // German
    de_translation?: string;
    de_importance_reason?: string;
    de_audio_url?: string;

    // Spanish
    es_translation?: string;
    es_importance_reason?: string;
    es_audio_url?: string;

    // Russian
    ru_translation?: string;
    ru_importance_reason?: string;
    ru_audio_url?: string;

    // Learning metadata
    level: VocabLevel;
    difficulty: VocabDifficulty;
    frequency: VocabFrequency;

    // Timestamps
    created_at: string;
    updated_at: string;
    created_by?: string;
}

/**
 * Filters for vocabulary list queries
 */
export interface VocabFilters {
    search?: string;
    level?: VocabLevel | 'All';
    difficulty?: VocabDifficulty | 'All';
    frequency_min?: VocabFrequency;
    frequency_max?: VocabFrequency;
    page?: number;
    limit?: number;
}

/**
 * Response from vocabulary list endpoint
 */
export interface VocabListResponse {
    data: VocabEntry[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Statistics for vocabulary dashboard
 */
export interface VocabStats {
    total: number;
    by_level: {
        A1: number;
        A2: number;
        B1: number;
        B2: number;
        C1: number;
        C2: number;
    };
    by_difficulty: {
        easy: number;
        medium: number;
        hard: number;
    };
    avg_frequency: number;
    with_audio: {
        en: number;
        de: number;
        es: number;
        ru: number;
    };
}

/**
 * Create vocabulary entry payload
 */
export interface CreateVocabPayload {
    nr?: number;
    greek_transcription: string;
    greek_phonetic?: string;

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

    level: VocabLevel;
    difficulty: VocabDifficulty;
    frequency: VocabFrequency;
}

/**
 * Update vocabulary entry payload (all fields optional except ID)
 */
export type UpdateVocabPayload = Partial<CreateVocabPayload> & { id: string };

/**
 * Bulk update payload
 */
export interface BulkUpdatePayload {
    ids: string[];
    level?: VocabLevel;
    difficulty?: VocabDifficulty;
    frequency?: VocabFrequency;
}

/**
 * CSV import mode
 */
export type ImportMode = 'append' | 'overwrite';

/**
 * CSV import result
 */
export interface ImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    errors: Array<ImportError | string>; // Can be either format
    message?: string;
}

/**
 * Import error details
 */
export interface ImportError {
    row: number;
    field?: string;
    message: string;
    data?: Record<string, unknown>;
}

/**
 * CSV row structure for imports
 */
export interface VocabCSVRow {
    nr?: string;
    greek_transcription: string;
    greek_phonetic?: string;

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
}

/**
 * Validation result for CSV row
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}

/**
 * Sort options for vocabulary table
 */
export interface VocabSortOptions {
    field: keyof VocabEntry;
    direction: 'asc' | 'desc';
}

/**
 * Level color mapping for UI
 */
export const LEVEL_COLORS: Record<VocabLevel, string> = {
    A1: '#34C759', // Green
    A2: '#30D158', // Light green
    B1: '#64D2FF', // Light blue
    B2: '#0A84FF', // Blue
    C1: '#BF5AF2', // Purple
    C2: '#AF52DE', // Dark purple
};

/**
 * Difficulty color mapping for UI
 */
export const DIFFICULTY_COLORS: Record<VocabDifficulty, string> = {
    easy: '#34C759',   // Green
    medium: '#FFD60A', // Yellow
    hard: '#FF3B30',   // Red
};

/**
 * Frequency star display helper
 */
export function getFrequencyStars(frequency: VocabFrequency): string {
    const filled = '★'.repeat(frequency);
    const empty = '☆'.repeat(5 - frequency);
    return filled + empty;
}

/**
 * Level order for sorting
 */
export const LEVEL_ORDER: VocabLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Check if vocabulary entry has audio for a language
 */
export function hasAudio(entry: VocabEntry, lang: 'en' | 'de' | 'es' | 'ru'): boolean {
    const audioUrl = entry[`${lang}_audio_url`];
    return Boolean(audioUrl && audioUrl.trim() !== '');
}

/**
 * Get translation for a language
 */
export function getTranslation(entry: VocabEntry, lang: 'en' | 'de' | 'es' | 'ru'): VocabTranslation {
    return {
        translation: entry[`${lang}_translation`] || '',
        importance_reason: entry[`${lang}_importance_reason`],
        audio_url: entry[`${lang}_audio_url`],
    };
}

/**
 * Validate vocabulary entry
 */
export function validateVocabEntry(entry: Partial<CreateVocabPayload>): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!entry.greek_transcription || entry.greek_transcription.trim() === '') {
        errors.push('Greek transcription is required');
    }

    if (!entry.level) {
        errors.push('Level is required');
    } else if (!LEVEL_ORDER.includes(entry.level)) {
        errors.push('Invalid level (must be A1-C2)');
    }

    if (!entry.difficulty) {
        errors.push('Difficulty is required');
    } else if (!['easy', 'medium', 'hard'].includes(entry.difficulty)) {
        errors.push('Invalid difficulty');
    }

    if (!entry.frequency) {
        errors.push('Frequency is required');
    } else if (entry.frequency < 1 || entry.frequency > 5) {
        errors.push('Frequency must be between 1 and 5');
    }

    // Character limits
    if (entry.greek_transcription && entry.greek_transcription.length > 200) {
        errors.push('Greek transcription too long (max 200 chars)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * LEGACY TYPE ALIASES (for backward compatibility with API routes)
 * These will be removed once all API routes are updated
 */
export type CEFRLevel = VocabLevel;
export type VocabInsert = Omit<VocabEntry, 'id' | 'created_at' | 'updated_at'>;
export type VocabUpdate = Partial<VocabInsert>;

/**
 * Filter parameters for querying vocabulary (API format)
 */
export interface VocabFilterParams {
    search?: string;
    level?: CEFRLevel[];
    difficulty?: VocabDifficulty[];
    frequency?: number;
    page?: number;
    limit?: number;
    sort?: 'frequency' | 'created_at' | 'updated_at' | 'greek_transcription';
    order?: 'asc' | 'desc';
}


/**
 * Bulk update request body
 */
export interface BulkUpdateRequest {
    ids: string[];
    updates: VocabUpdate;
}

/**
 * Bulk delete request body
 */
export interface BulkDeleteRequest {
    ids: string[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

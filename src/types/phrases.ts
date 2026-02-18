/**
 * Multilingual Daily Phrases System - TypeScript Types
 * Used for phrases management in admin interface
 * Mirrored from vocabulary.ts structure
 */

// CEFR Levels
export type PhraseLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Difficulty levels
export type PhraseDifficulty = 'easy' | 'medium' | 'hard';

// Frequency rating (1-5 stars)
export type PhraseFrequency = 1 | 2 | 3 | 4 | 5;

/**
 * Translation data for a single language
 */
export interface PhraseTranslation {
    translation: string;
    importance_reason?: string;
    audio_url?: string;
}

/**
 * Core phrase entry with all language translations
 */
export interface PhraseEntry {
    id: string;
    nr?: number;

    // Greek content
    greek_transcription: string;
    greek_phonetic?: string;
    audio_url?: string;

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
    level: PhraseLevel;
    difficulty: PhraseDifficulty;
    frequency: PhraseFrequency;

    // Legacy fields (backward compatibility)
    category?: string;
    deck_id?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
    created_by?: string;
}

/**
 * Filters for phrases list queries
 */
export interface PhraseFilters {
    search?: string;
    level?: PhraseLevel | 'All';
    difficulty?: PhraseDifficulty | 'All';
    frequency_min?: PhraseFrequency;
    frequency_max?: PhraseFrequency;
    category?: string;
    page?: number;
    limit?: number;
}

/**
 * Response from phrases list endpoint
 */
export interface PhraseListResponse {
    data: PhraseEntry[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Statistics for phrases dashboard
 */
export interface PhraseStats {
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
 * Create phrase entry payload
 */
export interface CreatePhrasePayload {
    nr?: number;
    greek_transcription: string;
    greek_phonetic?: string;
    audio_url?: string;

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

    level: PhraseLevel;
    difficulty: PhraseDifficulty;
    frequency: PhraseFrequency;

    // Legacy support
    category?: string;
    deck_id?: string;
}

/**
 * Update phrase entry payload (all fields optional except ID)
 */
export type UpdatePhrasePayload = Partial<CreatePhrasePayload> & { id: string };

/**
 * Bulk update payload
 */
export interface BulkUpdatePhrasePayload {
    ids: string[];
    level?: PhraseLevel;
    difficulty?: PhraseDifficulty;
    frequency?: PhraseFrequency;
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
export interface PhraseCSVRow {
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
 * Sort options for phrases table
 */
export interface PhraseSortOptions {
    field: keyof PhraseEntry;
    direction: 'asc' | 'desc';
}

/**
 * Level color mapping for UI (matching vocabulary)
 */
export const LEVEL_COLORS: Record<PhraseLevel, string> = {
    A1: '#34C759', // Green
    A2: '#30D158', // Light green
    B1: '#64D2FF', // Light blue
    B2: '#0A84FF', // Blue
    C1: '#BF5AF2', // Purple
    C2: '#AF52DE', // Dark purple
};

/**
 * Difficulty color mapping for UI (matching vocabulary)
 */
export const DIFFICULTY_COLORS: Record<PhraseDifficulty, string> = {
    easy: '#34C759',   // Green
    medium: '#FFD60A', // Yellow
    hard: '#FF3B30',   // Red
};

/**
 * Frequency star display helper
 */
export function getFrequencyStars(frequency: PhraseFrequency): string {
    const filled = '★'.repeat(frequency);
    const empty = '☆'.repeat(5 - frequency);
    return filled + empty;
}

/**
 * Level order for sorting
 */
export const LEVEL_ORDER: PhraseLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Check if phrase entry has audio for a language
 */
export function hasAudio(entry: PhraseEntry, lang: 'en' | 'de' | 'es' | 'ru'): boolean {
    const audioUrl = entry[`${lang}_audio_url`];
    return Boolean(audioUrl && audioUrl.trim() !== '');
}

/**
 * Get translation for a language
 */
export function getTranslation(entry: PhraseEntry, lang: 'en' | 'de' | 'es' | 'ru'): PhraseTranslation {
    return {
        translation: entry[`${lang}_translation`] || '',
        importance_reason: entry[`${lang}_importance_reason`],
        audio_url: entry[`${lang}_audio_url`],
    };
}

/**
 * Validate phrase entry
 */
export function validatePhraseEntry(entry: Partial<CreatePhrasePayload>): ValidationResult {
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
    if (entry.greek_transcription && entry.greek_transcription.length > 500) {
        errors.push('Greek transcription too long (max 500 chars for phrases)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * LEGACY TYPE ALIASES (for backward compatibility with API routes)
 */
export type CEFRLevel = PhraseLevel;
export type PhraseInsert = Omit<PhraseEntry, 'id' | 'created_at' | 'updated_at'>;
export type PhraseUpdate = Partial<PhraseInsert>;

/**
 * Filter parameters for querying phrases (API format)
 */
export interface PhraseFilterParams {
    search?: string;
    level?: CEFRLevel[];
    difficulty?: PhraseDifficulty[];
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
    updates: PhraseUpdate;
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

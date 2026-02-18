/**
 * Zod validation schemas for input sanitization and SQL injection prevention
 *
 * Security: All user inputs must be validated before being used in queries
 */

import { z } from 'zod';

// ========================================
// CONSTANTS
// ========================================

export const CONTENT_TYPES = ['vocabulary', 'phrase', 'grammar'] as const;
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const USER_ROLES = ['admin', 'student'] as const;

// Practice Modes
export const PRACTICE_MODES = ['matching', 'multiple_choice', 'write_input'] as const;
export const PRACTICE_TOLERANCE = ['strict', 'lenient'] as const;

// ========================================
// BASIC SCHEMAS
// ========================================

/**
 * Search query validation
 * - Max 100 characters
 * - Only alphanumeric, spaces, and common Greek/English characters
 * - No SQL injection patterns
 */
export const searchSchema = z
    .string()
    .max(100, 'Search query too long')
    .regex(
        /^[a-zA-Z0-9\s\u0370-\u03FF\u1F00-\u1FFF.,!?'-]*$/,
        'Invalid characters in search query'
    )
    .transform(str => str.trim());

/**
 * UUID validation
 */
export const uuidSchema = z
    .string()
    .uuid('Invalid ID format');

/**
 * Content type validation
 */
export const contentTypeSchema = z.enum(CONTENT_TYPES, {
    message: 'Invalid content type'
});

/**
 * Level validation
 */
export const levelSchema = z.enum(LEVELS, {
    message: 'Invalid level'
});

/**
 * Difficulty validation
 */
export const difficultySchema = z.enum(DIFFICULTIES, {
    message: 'Invalid difficulty'
});

// ========================================
// FILTER PARAMS SCHEMA
// ========================================

export const filterParamsSchema = z.object({
    search: searchSchema.optional(),
    type: contentTypeSchema.optional(),
    level: z.array(levelSchema).optional(),
    difficulty: z.array(difficultySchema).optional(),
    page: z.number().int().min(0).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
});

export type FilterParams = z.infer<typeof filterParamsSchema>;

// ========================================
// CONTENT SCHEMAS
// ========================================

/**
 * Text field validation (english, greek, phonetic, etc.)
 * - Max 500 characters
 * - Allow Greek, Latin, and common punctuation
 */
const textFieldSchema = z
    .string()
    .min(1, 'Field cannot be empty')
    .max(500, 'Text too long')
    .regex(
        /^[a-zA-Z0-9\s\u0370-\u03FF\u1F00-\u1FFF.,!?'"\-()\/]+$/,
        'Invalid characters'
    )
    .transform(str => str.trim());

/**
 * Optional text field
 */
const optionalTextFieldSchema = textFieldSchema.optional();

/**
 * URL validation (audio_url)
 */
const urlSchema = z
    .string()
    .url('Invalid URL format')
    .max(500, 'URL too long')
    .optional();

/**
 * Frequency validation (1-5 scale)
 */
const frequencySchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5)
]).refine((val) => val >= 1 && val <= 5, {
    message: 'Frequency must be 1, 2, 3, 4, or 5'
});

/**
 * Optional number field
 */
const optionalNumberSchema = z.number().int().optional();

/**
 * Long text field validation (for importance reasons)
 * - Max 2000 characters
 */
const longTextFieldSchema = z
    .string()
    .max(2000, 'Text too long')
    .transform(str => str.trim())
    .optional();

/**
 * Multilingual content insert validation
 * Matches multilingual_content table schema
 */
export const multilingualContentInsertSchema = z.object({
    nr: optionalNumberSchema,
    type: contentTypeSchema,

    // Greek fields (core)
    greek_transcription: textFieldSchema,
    greek_phonetic: optionalTextFieldSchema,

    // English fields
    en_translation: longTextFieldSchema,
    en_importance_reason: longTextFieldSchema,
    en_audio_url: urlSchema,

    // German fields
    de_translation: longTextFieldSchema,
    de_importance_reason: longTextFieldSchema,
    de_audio_url: urlSchema,

    // Spanish fields
    es_translation: longTextFieldSchema,
    es_importance_reason: longTextFieldSchema,
    es_audio_url: urlSchema,

    // Russian fields
    ru_translation: longTextFieldSchema,
    ru_importance_reason: longTextFieldSchema,
    ru_audio_url: urlSchema,

    // Metadata
    level: levelSchema,
    difficulty: difficultySchema,
    frequency: frequencySchema,
});

export type MultilingualContentInsert = z.infer<typeof multilingualContentInsertSchema>;

/**
 * Multilingual content update validation (all fields optional)
 */
export const multilingualContentUpdateSchema = multilingualContentInsertSchema.partial();

export type MultilingualContentUpdate = z.infer<typeof multilingualContentUpdateSchema>;

/**
 * @deprecated Use multilingualContentInsertSchema instead
 * Legacy content insert validation
 */
export const contentInsertSchema = z.object({
    type: contentTypeSchema,
    english: textFieldSchema,
    greek: textFieldSchema,
    level: levelSchema,
    difficulty: difficultySchema,
    phonetic: optionalTextFieldSchema,
    example_en: optionalTextFieldSchema,
    example_gr: optionalTextFieldSchema,
    audio_url: urlSchema,
});

export type ContentInsert = z.infer<typeof contentInsertSchema>;

/**
 * @deprecated Use multilingualContentUpdateSchema instead
 * Legacy content update validation (same as insert but all fields required)
 */
export const contentUpdateSchema = contentInsertSchema;

export type ContentUpdate = z.infer<typeof contentUpdateSchema>;

/**
 * Bulk delete validation
 */
export const bulkDeleteSchema = z.object({
    ids: z.array(uuidSchema).min(1, 'At least one ID required').max(100, 'Too many IDs'),
});

// ========================================
// PRACTICE MODES SCHEMAS
// ========================================

/**
 * Practice mode type validation
 */
export const practiceModeSchema = z.enum(PRACTICE_MODES, {
    message: 'Invalid practice mode'
});

/**
 * Practice tolerance validation (for write_input mode)
 */
export const practiceToleranceSchema = z.enum(PRACTICE_TOLERANCE, {
    message: 'Invalid tolerance setting'
});

/**
 * Practice modes configuration schema
 * Validates JSONB config stored in learning_items.practice_modes_config
 */
export const practiceModesConfigSchema = z.object({
    enabled: z.boolean().default(false),
    available_modes: z.array(practiceModeSchema).default([]),
    activation_threshold: z.number().int().min(0).max(50).default(3),
    difficulty_settings: z.object({
        matching: z.object({
            num_pairs: z.number().int().min(3).max(10).default(6),
            time_limit_sec: z.number().int().min(10).nullable().default(null)
        }),
        multiple_choice: z.object({
            num_options: z.number().int().min(2).max(6).default(4),
            time_limit_sec: z.number().int().min(10).max(300).default(30),
            show_hint: z.boolean().default(true)
        }),
        write_input: z.object({
            tolerance: practiceToleranceSchema.default('lenient'),
            show_phonetic: z.boolean().default(true),
            max_attempts: z.number().int().min(1).max(5).default(3)
        })
    })
});

export type PracticeModesConfig = z.infer<typeof practiceModesConfigSchema>;
export type PracticeMode = z.infer<typeof practiceModeSchema>;
export type PracticeTolerance = z.infer<typeof practiceToleranceSchema>;

/**
 * Practice attempt validation (for recording attempts)
 */
export const practiceAttemptSchema = z.object({
    item_id: uuidSchema,
    mode_type: practiceModeSchema,
    success: z.boolean(),
    score: z.number().int().min(0).max(100),
    time_seconds: z.number().int().min(0),
    mistakes: z.number().int().min(0).default(0),
    fsrs_rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    metadata: z.record(z.string(), z.unknown()).optional()
});

export type PracticeAttempt = z.infer<typeof practiceAttemptSchema>;

// ========================================
// AUTH SCHEMAS
// ========================================

/**
 * PIN validation (4 digits)
 */
export const pinSchema = z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only digits');

/**
 * User role validation
 */
export const userRoleSchema = z.enum(USER_ROLES);

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Safe parse with error logging
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[Validation Error]', errors);
        return { success: false, error: errors };
    }

    return { success: true, data: result.data };
}

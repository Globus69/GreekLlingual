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
    errorMap: () => ({ message: 'Invalid content type' })
});

/**
 * Level validation
 */
export const levelSchema = z.enum(LEVELS, {
    errorMap: () => ({ message: 'Invalid level' })
});

/**
 * Difficulty validation
 */
export const difficultySchema = z.enum(DIFFICULTIES, {
    errorMap: () => ({ message: 'Invalid difficulty' })
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
 * Content insert validation
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
 * Content update validation (same as insert but all fields required)
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
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[Validation Error]', errors);
        return { success: false, error: errors };
    }

    return { success: true, data: result.data };
}

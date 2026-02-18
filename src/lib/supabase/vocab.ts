/**
 * Vocabulary Helper Functions
 *
 * Server-side utility functions for vocabulary management
 * Handles CSV parsing, validation, duplicate detection, and export
 */

import Papa from 'papaparse';
import { supabase } from './client';
import type { VocabEntry, VocabInsert, CEFRLevel, VocabDifficulty } from '@/types/vocabulary';

/**
 * Parse CSV file and extract vocabulary entries
 *
 * @param file - CSV file to parse
 * @returns Promise resolving to array of parsed entries or error
 */
export async function parseCSV(file: File): Promise<{ data: any[]; errors: string[] }> {
  return new Promise((resolve) => {
    const errors: string[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Check for parsing errors
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach(err => {
            errors.push(`Row ${err.row}: ${err.message}`);
          });
        }

        resolve({
          data: results.data as any[],
          errors
        });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [`CSV parsing failed: ${error.message}`]
        });
      }
    });
  });
}

/**
 * Validate a vocabulary entry against schema requirements
 *
 * @param entry - Entry to validate
 * @returns Validation result with errors if any
 */
export function validateVocabEntry(entry: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!entry.greek_transcription || typeof entry.greek_transcription !== 'string' || entry.greek_transcription.trim() === '') {
    errors.push('greek_transcription is required');
  }

  if (!entry.level || typeof entry.level !== 'string') {
    errors.push('level is required');
  } else {
    const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(entry.level as CEFRLevel)) {
      errors.push(`level must be one of: ${validLevels.join(', ')}`);
    }
  }

  if (!entry.difficulty || typeof entry.difficulty !== 'string') {
    errors.push('difficulty is required');
  } else {
    const validDifficulties: VocabDifficulty[] = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(entry.difficulty as VocabDifficulty)) {
      errors.push(`difficulty must be one of: ${validDifficulties.join(', ')}`);
    }
  }

  // Frequency validation (optional field, but must be 1-5 if present)
  if (entry.frequency !== undefined && entry.frequency !== null) {
    const freq = Number(entry.frequency);
    if (isNaN(freq) || freq < 1 || freq > 5) {
      errors.push('frequency must be between 1 and 5');
    }
  }

  // Optional string fields - validate type if present
  const optionalStringFields = [
    'greek_phonetic',
    'translation_ru', 'importance_reason_ru', 'audio_url_ru',
    'translation_en', 'importance_reason_en', 'audio_url_en',
    'translation_es', 'importance_reason_es', 'audio_url_es',
    'translation_de', 'importance_reason_de', 'audio_url_de'
  ];

  optionalStringFields.forEach(field => {
    if (entry[field] !== undefined && entry[field] !== null && typeof entry[field] !== 'string') {
      errors.push(`${field} must be a string`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a vocabulary entry already exists (duplicate detection)
 * Checks based on greek_transcription + level combination
 *
 * @param entry - Entry to check
 * @returns Promise resolving to true if duplicate exists
 */
export async function checkDuplicate(entry: Partial<VocabEntry>): Promise<boolean> {
  if (!entry.greek_transcription || !entry.level) {
    return false;
  }

  const { data, error } = await supabase
    .from('multilingual_vocabulary')
    .select('id')
    .eq('greek_transcription', entry.greek_transcription)
    .eq('level', entry.level)
    .limit(1);

  if (error) {
    console.error('[checkDuplicate] Error:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Generate CSV string from vocabulary entries
 *
 * @param entries - Vocabulary entries to export
 * @returns CSV string
 */
export function generateCSV(entries: VocabEntry[]): string {
  return Papa.unparse(entries, {
    header: true,
    columns: [
      'id',
      'nr',
      'greek_transcription',
      'greek_phonetic',
      'translation_ru',
      'importance_reason_ru',
      'audio_url_ru',
      'translation_en',
      'importance_reason_en',
      'audio_url_en',
      'translation_es',
      'importance_reason_es',
      'audio_url_es',
      'translation_de',
      'importance_reason_de',
      'audio_url_de',
      'level',
      'difficulty',
      'frequency',
      'created_at',
      'updated_at'
    ]
  });
}

/**
 * Sanitize and prepare entry for database insertion
 * Removes empty strings, trims whitespace, converts types
 *
 * @param entry - Raw entry from CSV
 * @returns Sanitized entry ready for DB
 */
export function sanitizeEntry(entry: any): Partial<VocabInsert> {
  const sanitized: any = {};

  // Required fields
  if (entry.greek_transcription) {
    sanitized.greek_transcription = String(entry.greek_transcription).trim();
  }
  if (entry.level) {
    sanitized.level = String(entry.level).trim();
  }
  if (entry.difficulty) {
    sanitized.difficulty = String(entry.difficulty).trim();
  }

  // Optional number field
  if (entry.frequency !== undefined && entry.frequency !== null && entry.frequency !== '') {
    sanitized.frequency = Number(entry.frequency);
  }

  // Optional number field (nr)
  if (entry.nr !== undefined && entry.nr !== null && entry.nr !== '') {
    sanitized.nr = Number(entry.nr);
  }

  // Optional string fields - only include if not empty
  const optionalFields = [
    'greek_phonetic',
    'translation_ru', 'importance_reason_ru', 'audio_url_ru',
    'translation_en', 'importance_reason_en', 'audio_url_en',
    'translation_es', 'importance_reason_es', 'audio_url_es',
    'translation_de', 'importance_reason_de', 'audio_url_de'
  ];

  optionalFields.forEach(field => {
    if (entry[field] && String(entry[field]).trim() !== '') {
      sanitized[field] = String(entry[field]).trim();
    }
  });

  return sanitized;
}

/**
 * Get admin authorization helper
 * Checks if user has admin role
 *
 * @param userId - User ID to check
 * @returns Promise resolving to true if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[isAdmin] Error:', error);
    return false;
  }

  return data?.role === 'admin';
}

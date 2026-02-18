import type { PracticeModesConfig } from '@/lib/validation/schemas';

/**
 * Multilingual content interface matching multilingual_content table schema
 * Supports Greek + 4 languages (EN, DE, ES, RU) with translations, importance reasons, and audio URLs
 */
export interface MultilingualContent {
  id: string;
  nr?: number; // Optional number for sorting
  type: 'vocabulary' | 'phrase' | 'grammar';

  // Greek fields (core)
  greek_transcription: string; // Required
  greek_phonetic?: string;
  audio_url?: string;

  // English fields
  en_translation?: string;
  en_importance_reason?: string;
  en_audio_url?: string;

  // German fields
  de_translation?: string;
  de_importance_reason?: string;
  de_audio_url?: string;

  // Spanish fields
  es_translation?: string;
  es_importance_reason?: string;
  es_audio_url?: string;

  // Russian fields
  ru_translation?: string;
  ru_importance_reason?: string;
  ru_audio_url?: string;

  // Metadata
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 1 | 2 | 3 | 4 | 5; // 1-5 scale (union type for type safety)

  // Practice modes (optional)
  practice_modes_config?: PracticeModesConfig;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Use MultilingualContent instead
 * Legacy Content interface for backward compatibility
 */
export interface Content {
  id: string;
  type: 'vocabulary' | 'phrase' | 'grammar';
  english: string;
  greek: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'easy' | 'medium' | 'hard';
  phonetic?: string;
  example_en?: string;
  example_gr?: string;
  audio_url?: string;
  practice_modes_config?: PracticeModesConfig;
  created_at: string;
  updated_at: string;
}

export interface ContentFilters {
  search: string;
  type: 'all' | 'vocabulary' | 'phrase' | 'grammar';
  level: 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

/**
 * Form data for multilingual content creation/editing
 */
export interface MultilingualContentFormData {
  nr?: number;
  type: 'vocabulary' | 'phrase' | 'grammar';

  // Greek fields
  greek_transcription: string;
  greek_phonetic?: string;
  audio_url?: string;

  // English fields
  en_translation?: string;
  en_importance_reason?: string;
  en_audio_url?: string;

  // German fields
  de_translation?: string;
  de_importance_reason?: string;
  de_audio_url?: string;

  // Spanish fields
  es_translation?: string;
  es_importance_reason?: string;
  es_audio_url?: string;

  // Russian fields
  ru_translation?: string;
  ru_importance_reason?: string;
  ru_audio_url?: string;

  // Metadata
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 1 | 2 | 3 | 4 | 5; // 1-5 scale
}

/**
 * @deprecated Use MultilingualContentFormData instead
 */
export interface ContentFormData {
  type: 'vocabulary' | 'phrase' | 'grammar';
  english: string;
  greek: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'easy' | 'medium' | 'hard';
  phonetic?: string;
  example_en?: string;
  example_gr?: string;
  audio_url?: string;
}

// Multilingual types
export type MultilingualContentInsert = Omit<MultilingualContent, 'id' | 'created_at' | 'updated_at'>;
export type MultilingualContentUpdate = Partial<MultilingualContentInsert>;

// Legacy types (backward compatibility)
export type ContentInsert = Omit<Content, 'id' | 'created_at' | 'updated_at'>;
export type ContentUpdate = Partial<ContentInsert>;

export interface ImportPreviewRow {
  row: number;
  data: Partial<MultilingualContent>;
  errors?: string[];
  warnings?: string[];
  _isValid?: boolean;
  _rowIndex?: number;
  type?: string;
  greek_transcription?: string;
  en_translation?: string;
  level?: string;
  difficulty?: string;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{ row: number; error: string }>;
}

/**
 * Content Management Types
 * macOS Liquid Glass Admin Interface
 */

export type ContentType = 'vocabulary' | 'phrase' | 'grammar';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Content {
  id: string;
  type: ContentType;
  english: string;
  greek: string;
  level: Level;
  difficulty: Difficulty;
  phonetic?: string;
  example_en?: string;
  example_gr?: string;
  audio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentFormData {
  type: ContentType;
  english: string;
  greek: string;
  level: Level;
  difficulty: Difficulty;
  phonetic?: string;
  example_en?: string;
  example_gr?: string;
  audio_url?: string;
}

export interface ContentFilters {
  search?: string;
  type?: ContentType | 'all';
  level?: Level | 'all';
  difficulty?: Difficulty | 'all';
}

export interface ImportPreviewRow extends ContentFormData {
  _rowIndex: number;
  _errors?: string[];
  _isValid: boolean;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

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
  created_at: string;
  updated_at: string;
}

export interface ContentFilters {
  search: string;
  type: 'all' | 'vocabulary' | 'phrase' | 'grammar';
  level: 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

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

export type ContentInsert = Omit<Content, 'id' | 'created_at' | 'updated_at'>;
export type ContentUpdate = Partial<ContentInsert>;

export interface ImportPreviewRow {
  row: number;
  data: Partial<Content>;
  errors?: string[];
  warnings?: string[];
  _isValid?: boolean;
  _rowIndex?: number;
  type?: string;
  english?: string;
  greek?: string;
  level?: string;
  difficulty?: string;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{ row: number; error: string }>;
}

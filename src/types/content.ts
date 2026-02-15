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

export type ContentInsert = Omit<Content, 'id' | 'created_at' | 'updated_at'>;
export type ContentUpdate = Partial<ContentInsert>;

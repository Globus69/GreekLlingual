# Content/Learning Items Schema Analysis - Gaps Report

**Created:** 2026-02-18
**Target Table:** `content` or `learning_items`
**Status:** ❌ **WRONG SCHEMA - INCOMPATIBLE**

---

## 🚨 CRITICAL FINDINGS

### Table Status: **EXISTS BUT COMPLETELY WRONG**

**Found:**
- Migration: `create_content_table.sql`
- Table name: `content`
- Purpose: "vocabulary, phrases, and grammar"

**Problem:** Schema is **COMPLETELY DIFFERENT** from vocab reference schema.

---

## ❌ Current Schema (WRONG)

### File: `supabase/migrations/create_content_table.sql`

```sql
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('vocabulary', 'phrase', 'grammar')),
    english TEXT NOT NULL,
    greek TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    phonetic TEXT,
    example_en TEXT,
    example_gr TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**TOTAL COLUMNS:** 12 (should be 21 like vocab)

---

## ❌ Missing Columns (Compared to Vocab Reference)

### Core Missing Columns (15 total):

| Column | Status | Impact |
|--------|--------|--------|
| `nr` | ❌ MISSING | Cannot order entries sequentially |
| `greek_phonetic` | ⚠️ EXISTS as `phonetic` | Wrong name |
| `en_translation` | ⚠️ EXISTS as `english` | Wrong name |
| `en_importance_reason` | ❌ MISSING | Cannot explain why word is important |
| `en_audio_url` | ⚠️ EXISTS as `audio_url` | Only 1 audio URL (no multilingual) |
| `de_translation` | ❌ MISSING | No German support |
| `de_importance_reason` | ❌ MISSING | No German support |
| `de_audio_url` | ❌ MISSING | No German audio |
| `es_translation` | ❌ MISSING | No Spanish support |
| `es_importance_reason` | ❌ MISSING | No Spanish support |
| `es_audio_url` | ❌ MISSING | No Spanish audio |
| `ru_translation` | ❌ MISSING | No Russian support |
| `ru_importance_reason` | ❌ MISSING | No Russian support |
| `ru_audio_url` | ❌ MISSING | No Russian audio |
| `frequency` | ❌ MISSING | Cannot rate importance (1-5 stars) |
| `created_by` | ❌ MISSING | Cannot track who created entry |

### Extra Columns (Not in Vocab):

| Column | Purpose | Should Keep? |
|--------|---------|-------------|
| `type` | Distinguish vocab/phrase/grammar | ❌ NO - Use separate tables |
| `example_en` | Example sentence in English | ❌ NO - Not in vocab schema |
| `example_gr` | Example sentence in Greek | ❌ NO - Not in vocab schema |

---

## 🔍 Comparison Table

| Feature | Vocab Schema | Content Schema | Status |
|---------|-------------|----------------|--------|
| **Table Name** | `multilingual_vocabulary` | `content` | ❌ Different |
| **Column Count** | 21 | 12 | ❌ Wrong |
| **Languages** | 4 (EN, DE, ES, RU) | 1 (EN only) | ❌ Incomplete |
| **Fields per Language** | 3 (translation, reason, audio) | 1 (translation only) | ❌ Incomplete |
| **Has `nr` field** | ✅ Yes | ❌ No | ❌ Missing |
| **Has `frequency` field** | ✅ Yes (1-5) | ❌ No | ❌ Missing |
| **Has `created_by` field** | ✅ Yes | ❌ No | ❌ Missing |
| **Greek field name** | `greek_transcription` | `greek` | ❌ Different |
| **English field name** | `en_translation` | `english` | ❌ Different |
| **Phonetic field name** | `greek_phonetic` | `phonetic` | ❌ Different |
| **Audio URLs** | 4 (one per language) | 1 (single URL) | ❌ Incomplete |
| **Unique Constraint** | ✅ (greek_transcription, level) | ❌ No | ❌ Missing |

---

## ❌ Missing Indexes (7 of 9)

**What EXISTS:**
```sql
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_level ON content(level);
CREATE INDEX idx_content_difficulty ON content(difficulty);
CREATE INDEX idx_content_created_at ON content(created_at DESC);
CREATE INDEX idx_content_english_search ON content USING gin(to_tsvector('english', english));
CREATE INDEX idx_content_greek_search ON content USING gin(to_tsvector('simple', greek));
```

**What's MISSING:**
1. ❌ `idx_content_frequency` - Filter by frequency (column doesn't exist)
2. ❌ `idx_content_de_text` - German full-text search (column doesn't exist)
3. ❌ `idx_content_es_text` - Spanish full-text search (column doesn't exist)
4. ❌ `idx_content_ru_text` - Russian full-text search (column doesn't exist)

**Extra Indexes (Not Needed):**
- ✅ `idx_content_type` - Only needed because schema wrongly mixes types

---

## ❌ Missing RPC Functions (5 of 5)

**Current Status:** 0 RPC functions exist for content table

**Required (matching vocab):**
1. ❌ `get_content_filtered()` - Filter and paginate
2. ❌ `get_content_stats()` - Statistics dashboard
3. ❌ `bulk_update_content()` - Bulk update
4. ❌ `bulk_delete_content()` - Bulk delete
5. ❌ `check_content_duplicate()` - Duplicate check

---

## ❌ RLS Policies Analysis

**What EXISTS:**
```sql
-- Allow authenticated users to read content
CREATE POLICY "Allow authenticated users to read content"
    ON content FOR SELECT TO authenticated USING (true);

-- Allow only admins to insert content
CREATE POLICY "Allow admins to insert content"
    ON content FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Allow only admins to update content
CREATE POLICY "Allow admins to update content"
    ON content FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Allow only admins to delete content
CREATE POLICY "Allow admins to delete content"
    ON content FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
```

**Problems:**
1. ❌ No `anon` policy - Anonymous users cannot read content (vocab allows this)
2. ⚠️ Uses `users.role` instead of comparing directly (inconsistent with vocab)

**Vocab RLS (for reference):**
```sql
-- Admin full access (single policy for ALL operations)
CREATE POLICY "Admin full access to vocabulary"
    ON multilingual_vocabulary FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Students can read
CREATE POLICY "Students can read vocabulary"
    ON multilingual_vocabulary FOR SELECT
    USING (true);

-- Anon can read
CREATE POLICY "Anon can read vocabulary"
    ON multilingual_vocabulary FOR SELECT TO anon
    USING (true);
```

---

## 📊 TypeScript Types Analysis

### File: `src/types/content.ts`

```typescript
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
```

**Problems:**
1. ❌ Single-language only (no DE, ES, RU)
2. ❌ Wrong field names (`english` instead of `en_translation`)
3. ❌ Wrong field names (`greek` instead of `greek_transcription`)
4. ❌ Missing `frequency` field
5. ❌ Missing `nr` field
6. ❌ Missing importance_reason fields
7. ❌ Has `type` field (should use separate tables)
8. ❌ Has `example_en`, `example_gr` (not in vocab)
9. ❌ Has `practice_modes_config` (belongs in separate table)

---

## 🔥 Critical Issues Summary

| Issue | Severity | Impact |
|-------|----------|--------|
| Only 1 language instead of 4 | 🔥 CRITICAL | Cannot serve DE, ES, RU users |
| Wrong column names | 🔥 CRITICAL | Import/export incompatible |
| Missing `frequency` field | 🔴 HIGH | Cannot prioritize words |
| Missing importance_reason fields | 🔴 HIGH | Cannot explain why word matters |
| Missing 5 RPC functions | 🔴 HIGH | Admin UI broken |
| No unique constraint | 🔴 HIGH | Duplicates possible |
| Missing `nr` field | 🟡 MEDIUM | Cannot order entries |
| Wrong RLS policies | 🟡 MEDIUM | Anon users blocked |
| Mixes vocabulary/phrases/grammar | 🟡 MEDIUM | Violates single responsibility |

---

## ❌ API Routes Status

**No admin API routes found for `/admin/content`.**

Expected files:
- ❌ `src/app/api/admin/content/route.ts`
- ❌ `src/app/api/admin/content/import/route.ts`
- ❌ `src/app/api/admin/content/export/route.ts`
- ❌ `src/app/api/admin/content/bulk-update/route.ts`
- ❌ `src/app/api/admin/content/bulk-delete/route.ts`
- ❌ `src/app/api/admin/content/[id]/route.ts`

**Conclusion:** Content admin system **does not exist** or is incomplete.

---

## ❌ CSV Format

**No CSV template found for content import.**

Expected file:
- ❌ `public/templates/Import-Content-A1-Sample.csv`

**Must create with vocab column order:**
```
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

---

## ✅ Action Required

### Option 1: Drop and Replace (RECOMMENDED)

1. Drop `content` table completely
2. Create 3 separate tables:
   - `multilingual_vocabulary` (already exists - use it!)
   - `multilingual_phrases` (rename from `daily_phrases`, add schema)
   - `multilingual_grammar` (new table, same 18-column structure)

### Option 2: Migrate Data and Replace

1. Export existing `content` data (if any)
2. Drop `content` table
3. Create proper tables (see Option 1)
4. Migrate data to appropriate table based on `type` field

### Option 3: Keep Both (NOT RECOMMENDED)

1. Rename `content` → `legacy_content`
2. Create proper tables
3. Eventually migrate and drop legacy

---

## 🎯 Recommendation

**CRITICAL:** The `content` table is **fundamentally incompatible** with the vocab schema.

**DO NOT ATTEMPT TO ALTER.**

**Instead:**
1. ✅ Use existing `multilingual_vocabulary` table for vocabulary
2. ✅ Create `multilingual_phrases` with identical schema
3. ✅ Create `multilingual_grammar` with identical schema (if needed)
4. ✅ Drop `content` table (backup data first if any)
5. ✅ Update all TypeScript types
6. ✅ Create proper API routes

**Benefits:**
- ✅ 100% schema consistency
- ✅ Proper separation of concerns
- ✅ Multilingual support for all content types
- ✅ Reusable RPC functions
- ✅ Proper indexing and RLS

**Migration Path:**
```sql
-- 1. Create learning_items as alias/view (if needed for backward compatibility)
CREATE VIEW learning_items AS
SELECT
  id,
  'vocabulary' as type,
  en_translation as english,
  greek_transcription as greek,
  level,
  difficulty,
  greek_phonetic as phonetic,
  NULL as example_en,
  NULL as example_gr,
  en_audio_url as audio_url,
  created_at,
  updated_at
FROM multilingual_vocabulary;

-- 2. Drop content table (backup first!)
DROP TABLE content;

-- 3. Use multilingual_vocabulary directly
-- No migration needed - table already perfect!
```

---

## 📦 Deliverables Needed

1. ❌ Migration: `081_drop_content_create_views.sql`
2. ❌ API Routes: Complete `/admin/content` CRUD (6 files)
3. ❌ CSV Template: `Import-Content-A1-Sample.csv`
4. ❌ TypeScript: Update `src/types/content.ts` to match vocab structure
5. ❌ Documentation: Update schema docs

---

## ⚠️ WARNING

**DO NOT USE `content` TABLE FOR NEW FEATURES.**

**It is incompatible with the vocab schema and will cause problems.**

**Always use `multilingual_vocabulary` or create properly structured tables.**

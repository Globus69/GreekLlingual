# Schema Alignment Summary - Complete Report

**Date:** 2026-02-18
**Mission:** Align 3 admin systems to identical database schema
**Reference:** `multilingual_vocabulary` table (PERFECT)
**Status:** 🔴 **MAJOR ALIGNMENT NEEDED**

---

## 📊 Executive Summary

| System | Table Name | Schema Status | Alignment | Action Required |
|--------|-----------|---------------|-----------|----------------|
| **Vocab** | `multilingual_vocabulary` | ✅ PERFECT | 100% | ✅ None (this is the reference) |
| **Phrases** | `daily_phrases` or `phrases`? | ❌ INCOMPLETE | ~30% | 🔥 CREATE FROM SCRATCH |
| **Content** | `content` | ❌ WRONG | ~40% | 🔥 DROP AND REPLACE |

**Overall Status:** 🔴 **CRITICAL - Immediate action required**

---

## 🎯 Reference Schema (PERFECT)

**Table:** `multilingual_vocabulary`
**Migration:** `079_create_vocabulary.sql`

### Core Structure (21 columns):

1. **Core Fields (2):** `id`, `nr`
2. **Greek Content (2):** `greek_transcription`, `greek_phonetic`
3. **English (3):** `en_translation`, `en_importance_reason`, `en_audio_url`
4. **German (3):** `de_translation`, `de_importance_reason`, `de_audio_url`
5. **Spanish (3):** `es_translation`, `es_importance_reason`, `es_audio_url`
6. **Russian (3):** `ru_translation`, `ru_importance_reason`, `ru_audio_url`
7. **Metadata (3):** `level`, `difficulty`, `frequency`
8. **System (3):** `created_at`, `updated_at`, `created_by`

**18 user-facing columns + 3 system columns = 21 total**

### Features:
- ✅ 4 languages with 3 fields each (translation, reason, audio)
- ✅ 9 indexes (4 performance + 5 full-text search)
- ✅ 3 RLS policies (admin + student + anon)
- ✅ 5 RPC functions (filter, stats, bulk update, bulk delete, duplicate check)
- ✅ Unique constraint on (greek_transcription, level)
- ✅ Auto-update timestamp trigger

**This is THE standard. All systems must match this exactly.**

---

## ❌ System 1: Phrases - INCOMPLETE

**Table:** Uncertain (`phrases` vs `daily_phrases`)
**Migration:** `077_add_daily_phrases_scheduling.sql` (only adds columns to existing table)
**Status:** 🔥 **CRITICAL - Base table missing**

### Problems:

| Issue | Impact | Severity |
|-------|--------|----------|
| No base table creation found | Cannot deploy from scratch | 🔥 CRITICAL |
| Table name inconsistent | API queries `daily_phrases`, migration uses `phrases` | 🔥 CRITICAL |
| Missing 15 of 18 core columns | Cannot store multilingual data | 🔥 CRITICAL |
| Wrong column names | `phonetic` instead of `greek_phonetic` | 🔴 HIGH |
| No RPC functions (0 of 5) | Admin UI cannot function | 🔴 HIGH |
| Missing 7 indexes | Slow queries, no full-text search | 🟡 MEDIUM |
| No unique constraint | Duplicates allowed | 🔴 HIGH |
| CSV column order wrong | Confusing, import may fail | 🟡 MEDIUM |

### What EXISTS:

Migration 077 adds **phrases-specific fields** (AFTER base schema):
```sql
ALTER TABLE phrases ADD COLUMN scheduled_date DATE;
ALTER TABLE phrases ADD COLUMN context_tags TEXT[];
ALTER TABLE phrases ADD COLUMN phonetic TEXT;        -- WRONG NAME
ALTER TABLE phrases ADD COLUMN audio_url TEXT;       -- SHOULD BE 4 SEPARATE URLs
ALTER TABLE phrases ADD COLUMN audio_file_path TEXT;
ALTER TABLE phrases ADD COLUMN notes TEXT;
```

**Problem:** These are EXTRA fields, but the BASE 18-column structure doesn't exist!

### API Routes:

**File:** `src/app/api/admin/daily-phrases/route.ts`

- ✅ EXISTS and queries `daily_phrases`
- ✅ Searches across multilingual fields (expects them to exist)
- ❌ BUT: Database doesn't have those fields!

### TypeScript Types:

**File:** `src/types/phrases.ts`

- ✅ Perfectly matches vocab schema (18 columns)
- ✅ All 4 languages defined
- ❌ BUT: Database doesn't match types!

**Gap:** **HUGE** - Types promise 18 columns, database has maybe 6.

---

## ❌ System 2: Content - WRONG SCHEMA

**Table:** `content`
**Migration:** `create_content_table.sql`
**Status:** 🔥 **CRITICAL - Incompatible schema**

### Problems:

| Issue | Impact | Severity |
|-------|--------|----------|
| Single language only (EN) | Cannot serve DE, ES, RU users | 🔥 CRITICAL |
| Wrong column names | `english` vs `en_translation`, `greek` vs `greek_transcription` | 🔥 CRITICAL |
| Missing 15 columns | No DE, ES, RU, importance reasons, frequency | 🔥 CRITICAL |
| No RPC functions (0 of 5) | Admin UI doesn't exist | 🔴 HIGH |
| Wrong RLS policies | Missing anon policy, inconsistent admin check | 🟡 MEDIUM |
| Mixes types | `vocabulary`, `phrase`, `grammar` in one table | 🟡 MEDIUM |
| No API routes | Admin interface not implemented | 🔴 HIGH |
| No CSV template | Cannot import data | 🔴 HIGH |

### Current Schema (WRONG):

```sql
CREATE TABLE content (
    id UUID,
    type TEXT CHECK (type IN ('vocabulary', 'phrase', 'grammar')), -- ❌ Should use separate tables
    english TEXT,           -- ❌ Should be en_translation
    greek TEXT,             -- ❌ Should be greek_transcription
    level TEXT,             -- ✅ OK
    difficulty TEXT,        -- ✅ OK
    phonetic TEXT,          -- ❌ Should be greek_phonetic
    example_en TEXT,        -- ❌ Not in vocab schema
    example_gr TEXT,        -- ❌ Not in vocab schema
    audio_url TEXT,         -- ❌ Should be 4 separate URLs (en_, de_, es_, ru_audio_url)
    created_at TIMESTAMPTZ, -- ✅ OK
    updated_at TIMESTAMPTZ  -- ✅ OK
);
```

**12 columns total (should be 21)**

### What's MISSING:

- ❌ `nr` - Sequential numbering
- ❌ `greek_phonetic` - (has `phonetic` but wrong name)
- ❌ `en_importance_reason` - Why word is important
- ❌ `de_translation` - German translation
- ❌ `de_importance_reason` - German explanation
- ❌ `de_audio_url` - German audio
- ❌ `es_translation` - Spanish translation
- ❌ `es_importance_reason` - Spanish explanation
- ❌ `es_audio_url` - Spanish audio
- ❌ `ru_translation` - Russian translation
- ❌ `ru_importance_reason` - Russian explanation
- ❌ `ru_audio_url` - Russian audio
- ❌ `frequency` - Importance rating (1-5 stars)
- ❌ `created_by` - Admin who created entry

### API Routes Status:

**Expected:** `src/app/api/admin/content/`

- ❌ `route.ts` - List/Create
- ❌ `[id]/route.ts` - Read/Update/Delete
- ❌ `import/route.ts` - CSV import
- ❌ `export/route.ts` - CSV export
- ❌ `bulk-update/route.ts` - Bulk operations
- ❌ `bulk-delete/route.ts` - Bulk operations

**Status:** NONE EXIST

---

## 📋 Detailed Comparison Matrix

### Column-by-Column Comparison

| Column | Vocab | Phrases | Content | Status |
|--------|-------|---------|---------|--------|
| `id` | ✅ UUID | ❓ Unknown | ✅ UUID | ⚠️ Uncertain |
| `nr` | ✅ INTEGER | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `greek_transcription` | ✅ TEXT NOT NULL | ❓ Unknown | ❌ `greek` (wrong name) | 🔴 Wrong |
| `greek_phonetic` | ✅ TEXT | ❌ `phonetic` (wrong name) | ❌ `phonetic` (wrong name) | 🔴 Wrong |
| `en_translation` | ✅ TEXT | ❌ Missing | ❌ `english` (wrong name) | 🔴 Wrong |
| `en_importance_reason` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `en_audio_url` | ✅ TEXT | ❌ `audio_url` (incomplete) | ❌ `audio_url` (incomplete) | 🔴 Wrong |
| `de_translation` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `de_importance_reason` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `de_audio_url` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `es_translation` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `es_importance_reason` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `es_audio_url` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `ru_translation` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `ru_importance_reason` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `ru_audio_url` | ✅ TEXT | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `level` | ✅ TEXT NOT NULL + CHECK | ❓ Unknown | ✅ TEXT NOT NULL + CHECK | ⚠️ Uncertain |
| `difficulty` | ✅ TEXT NOT NULL + CHECK | ❓ Unknown | ✅ TEXT NOT NULL + CHECK | ⚠️ Uncertain |
| `frequency` | ✅ INTEGER NOT NULL + CHECK | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |
| `created_at` | ✅ TIMESTAMPTZ | ❓ Unknown | ✅ TIMESTAMPTZ | ⚠️ Uncertain |
| `updated_at` | ✅ TIMESTAMPTZ | ❓ Unknown | ✅ TIMESTAMPTZ | ⚠️ Uncertain |
| `created_by` | ✅ UUID FK | ❌ Missing | ❌ Missing | 🔴 2 of 3 missing |

**Legend:**
- ✅ Correct
- ❌ Missing
- ❓ Unknown (table structure uncertain)
- ⚠️ Uncertain

---

## 📊 Feature Comparison Matrix

| Feature | Vocab | Phrases | Content |
|---------|-------|---------|---------|
| **Columns** | 21 ✅ | ~6-10 ❓ | 12 ❌ |
| **Languages** | 4 ✅ | 0-1 ❓ | 1 ❌ |
| **Fields per Language** | 3 ✅ | 0-1 ❓ | 1 ❌ |
| **Indexes** | 9 ✅ | 2 ❌ | 6 ⚠️ |
| **RPC Functions** | 5 ✅ | 0 ❌ | 0 ❌ |
| **RLS Policies** | 3 ✅ | ❓ | 4 ⚠️ |
| **Unique Constraint** | ✅ | ❌ | ❌ |
| **Auto-update Trigger** | ✅ | ❓ | ✅ |
| **API Routes** | 6 ✅ | 6 ✅ | 0 ❌ |
| **CSV Template** | ✅ | ⚠️ (wrong order) | ❌ |
| **TypeScript Types** | ✅ | ✅ | ❌ (wrong structure) |

---

## 🔥 Critical Issues Ranking

### Severity Scale:
- 🔥 CRITICAL - System non-functional
- 🔴 HIGH - Major features broken
- 🟡 MEDIUM - Degraded experience
- 🟢 LOW - Minor issues

### By System:

#### Phrases System:
1. 🔥 No base table creation migration
2. 🔥 Missing 15 of 18 core columns
3. 🔥 Table name mismatch (`phrases` vs `daily_phrases`)
4. 🔴 No RPC functions (0 of 5)
5. 🔴 Missing unique constraint (duplicates possible)
6. 🟡 Missing 7 indexes (slow queries)
7. 🟡 CSV column order wrong

#### Content System:
1. 🔥 Single language only (no DE, ES, RU)
2. 🔥 Wrong column names (incompatible)
3. 🔥 Missing 15 columns
4. 🔴 No API routes (0 of 6)
5. 🔴 No RPC functions (0 of 5)
6. 🔴 No CSV template
7. 🟡 Wrong RLS policies (missing anon)
8. 🟡 Mixes types in single table

---

## ✅ SOLUTION: Migration Plan

### Phase 1: Phrases Table (Priority 1)

**Create:** `080_create_daily_phrases_multilingual.sql`

```sql
-- ═══════════════════════════════════════════════════════════════
-- DAILY PHRASES - MULTILINGUAL STRUCTURE (MATCHING VOCAB)
-- ═══════════════════════════════════════════════════════════════

-- Drop old table if exists (backup first!)
DROP TABLE IF EXISTS phrases CASCADE;
DROP TABLE IF EXISTS daily_phrases CASCADE;

-- Create daily_phrases with EXACT vocab structure
CREATE TABLE public.daily_phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core Greek content
    nr INTEGER,
    greek_transcription TEXT NOT NULL,
    greek_phonetic TEXT,

    -- English translation
    en_translation TEXT,
    en_importance_reason TEXT,
    en_audio_url TEXT,

    -- German translation
    de_translation TEXT,
    de_importance_reason TEXT,
    de_audio_url TEXT,

    -- Spanish translation
    es_translation TEXT,
    es_importance_reason TEXT,
    es_audio_url TEXT,

    -- Russian translation
    ru_translation TEXT,
    ru_importance_reason TEXT,
    ru_audio_url TEXT,

    -- Learning metadata
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    frequency INTEGER NOT NULL DEFAULT 3 CHECK (frequency >= 1 AND frequency <= 5),

    -- Phrases-specific fields
    scheduled_date DATE,
    context_tags TEXT[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.users(id),

    -- Unique constraint
    CONSTRAINT unique_phrase_level UNIQUE (greek_transcription, level)
);

-- Create indexes (9 total - matching vocab)
CREATE INDEX idx_phrases_level ON public.daily_phrases(level);
CREATE INDEX idx_phrases_difficulty ON public.daily_phrases(difficulty);
CREATE INDEX idx_phrases_frequency ON public.daily_phrases(frequency);
CREATE INDEX idx_phrases_created_at ON public.daily_phrases(created_at DESC);
CREATE INDEX idx_phrases_scheduled_date ON public.daily_phrases(scheduled_date);
CREATE INDEX idx_phrases_context_tags ON public.daily_phrases USING GIN(context_tags);

-- Full-text search indexes
CREATE INDEX idx_phrases_greek_text ON public.daily_phrases USING gin(to_tsvector('simple', greek_transcription));
CREATE INDEX idx_phrases_en_text ON public.daily_phrases USING gin(to_tsvector('english', COALESCE(en_translation, '')));
CREATE INDEX idx_phrases_de_text ON public.daily_phrases USING gin(to_tsvector('german', COALESCE(de_translation, '')));
CREATE INDEX idx_phrases_es_text ON public.daily_phrases USING gin(to_tsvector('spanish', COALESCE(es_translation, '')));
CREATE INDEX idx_phrases_ru_text ON public.daily_phrases USING gin(to_tsvector('russian', COALESCE(ru_translation, '')));

-- Timestamp trigger
CREATE FUNCTION update_phrases_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_phrases_timestamp
    BEFORE UPDATE ON public.daily_phrases
    FOR EACH ROW
    EXECUTE FUNCTION update_phrases_timestamp();

-- RLS
ALTER TABLE public.daily_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to phrases"
    ON public.daily_phrases FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students can read phrases"
    ON public.daily_phrases FOR SELECT
    USING (true);

CREATE POLICY "Anon can read phrases"
    ON public.daily_phrases FOR SELECT TO anon
    USING (true);

-- RPC Functions (5 total - matching vocab)
-- (see full implementation in migration file)
```

**Estimated Time:** 2 hours

---

### Phase 2: Content System (Priority 2)

**Strategy:** Drop `content` table, use `multilingual_vocabulary` directly

**Create:** `081_drop_content_use_vocab.sql`

```sql
-- ═══════════════════════════════════════════════════════════════
-- DROP CONTENT TABLE - USE MULTILINGUAL_VOCABULARY INSTEAD
-- ═══════════════════════════════════════════════════════════════

-- Backup existing data (if any)
CREATE TABLE _content_backup AS SELECT * FROM content;

-- Drop content table
DROP TABLE IF EXISTS content CASCADE;

-- Create view for backward compatibility (optional)
CREATE VIEW content AS
SELECT
    id,
    'vocabulary' as type,
    en_translation as english,
    greek_transcription as greek,
    level,
    difficulty,
    greek_phonetic as phonetic,
    NULL::TEXT as example_en,
    NULL::TEXT as example_gr,
    en_audio_url as audio_url,
    created_at,
    updated_at
FROM multilingual_vocabulary;

-- Create learning_items alias (if needed)
CREATE VIEW learning_items AS SELECT * FROM multilingual_vocabulary;

-- Note: No new table needed!
-- Use multilingual_vocabulary directly for vocabulary content.
-- Use daily_phrases for phrases content.
-- Create multilingual_grammar if grammar content is needed.
```

**Estimated Time:** 30 minutes

---

### Phase 3: CSV Templates (Priority 3)

**Update:** `public/templates/Import-Phrases-A2-Sample.csv`

Change column order from:
```
nr,greek_transcription,greek_phonetic,ru_translation,ru_importance_reason,ru_audio_url,en_translation,en_importance_reason,en_audio_url,es_translation,es_importance_reason,es_audio_url,de_translation,de_importance_reason,de_audio_url,level,difficulty,frequency
```

To match vocab:
```
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

**Create:** `public/templates/Import-Content-A1-Sample.csv` (same format as vocab)

**Estimated Time:** 15 minutes

---

### Phase 4: API Routes for Content (Priority 4)

**Create:** Complete API route structure for `/admin/content`

Files to create:
1. `src/app/api/admin/content/route.ts` - List/Create
2. `src/app/api/admin/content/[id]/route.ts` - Read/Update/Delete
3. `src/app/api/admin/content/import/route.ts` - CSV import
4. `src/app/api/admin/content/export/route.ts` - CSV export
5. `src/app/api/admin/content/bulk-update/route.ts` - Bulk update
6. `src/app/api/admin/content/bulk-delete/route.ts` - Bulk delete

**Template:** Clone from `/admin/vocab` routes, change table to `multilingual_vocabulary`

**Estimated Time:** 1 hour

---

### Phase 5: TypeScript Types Update (Priority 5)

**Update:** `src/types/content.ts`

Replace current structure with vocab-compatible structure:

```typescript
// content.ts should now just import from vocabulary.ts
export type { VocabEntry as ContentEntry } from './vocabulary';
export type { VocabLevel as ContentLevel } from './vocabulary';
export type { VocabDifficulty as ContentDifficulty } from './vocabulary';
export type { VocabFrequency as ContentFrequency } from './vocabulary';
// ... etc
```

**Estimated Time:** 30 minutes

---

## 📦 Complete Deliverables Checklist

### Migrations:
- [ ] `080_create_daily_phrases_multilingual.sql` - Full phrases table with 18-column structure
- [ ] `081_drop_content_use_vocab.sql` - Drop content, create views if needed

### CSV Templates:
- [ ] Update `public/templates/Import-Phrases-A2-Sample.csv` - Fix column order
- [ ] Create `public/templates/Import-Content-A1-Sample.csv` - Match vocab format

### API Routes (Content):
- [ ] `src/app/api/admin/content/route.ts`
- [ ] `src/app/api/admin/content/[id]/route.ts`
- [ ] `src/app/api/admin/content/import/route.ts`
- [ ] `src/app/api/admin/content/export/route.ts`
- [ ] `src/app/api/admin/content/bulk-update/route.ts`
- [ ] `src/app/api/admin/content/bulk-delete/route.ts`

### TypeScript Types:
- [ ] Update `src/types/content.ts` - Match vocab structure
- [ ] Verify `src/types/phrases.ts` - Already correct!

### Documentation:
- [x] `VOCAB-SCHEMA-REFERENCE.md` - Reference schema (DONE)
- [x] `PHRASES-SCHEMA-GAPS.md` - Phrases analysis (DONE)
- [x] `CONTENT-SCHEMA-GAPS.md` - Content analysis (DONE)
- [x] `SCHEMA-ALIGNMENT-SUMMARY.md` - This file (DONE)

---

## ⏱️ Time Estimates

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Create phrases migration | 2 hours | 🔥 CRITICAL |
| 2 | Drop content, create views | 30 min | 🔴 HIGH |
| 3 | Update CSV templates | 15 min | 🟡 MEDIUM |
| 4 | Create content API routes | 1 hour | 🔴 HIGH |
| 5 | Update TypeScript types | 30 min | 🟡 MEDIUM |
| **TOTAL** | | **4-5 hours** | |

---

## ✅ Success Criteria

When complete, ALL must be TRUE:

### Phrases System:
- ✅ `daily_phrases` table has 21 columns (18 content + 3 system)
- ✅ All 4 languages with 3 fields each
- ✅ 11 indexes (9 standard + 2 phrases-specific)
- ✅ 3 RLS policies (admin + student + anon)
- ✅ 5 RPC functions (filter, stats, bulk update, bulk delete, duplicate check)
- ✅ Unique constraint on (greek_transcription, level)
- ✅ CSV template matches vocab format (EN first, not RU first)
- ✅ TypeScript types match database schema

### Content System:
- ✅ `content` table dropped (or deprecated)
- ✅ `multilingual_vocabulary` used directly for content
- ✅ API routes query correct table
- ✅ CSV template exists with correct format
- ✅ TypeScript types match vocab structure
- ✅ All 6 API routes implemented

### Overall:
- ✅ All 3 systems use IDENTICAL 18-column structure
- ✅ All 3 systems use IDENTICAL column names
- ✅ All 3 CSV templates have IDENTICAL column order
- ✅ All 3 TypeScript interfaces are COMPATIBLE
- ✅ Can import CSV between systems without modification
- ✅ Zero schema inconsistencies

---

## 🎯 Final Recommendations

### DO:
1. ✅ Start with phrases table (highest priority)
2. ✅ Use vocab migration 079 as template (proven to work)
3. ✅ Test each migration thoroughly before deploying
4. ✅ Backup any existing data first
5. ✅ Deploy migrations in order (080, then 081)

### DON'T:
1. ❌ Don't try to alter existing schemas incrementally
2. ❌ Don't use different column names "for consistency"
3. ❌ Don't skip indexes or RPC functions
4. ❌ Don't mix vocabulary/phrases/grammar in single table
5. ❌ Don't deploy without testing CSV import/export

### CRITICAL RULES:
1. **NEVER change vocab schema** - it's the reference
2. **ALWAYS use EXACT column names** from vocab
3. **ALWAYS include all 18 content columns** (even if optional)
4. **ALWAYS create all 5 RPC functions** for each table
5. **ALWAYS test with real CSV data** before deploying

---

## 📞 Next Steps

1. **Review this document** with team/stakeholders
2. **Create migrations** (080, 081) following templates above
3. **Test locally** with sample data
4. **Deploy to staging** and verify
5. **Update API routes** and test end-to-end
6. **Deploy to production** when all tests pass

**Estimated Total Time:** 4-5 hours for complete alignment

**Status after completion:** ✅ **100% schema consistency across all 3 systems**

---

## 📚 Reference Documents

- [VOCAB-SCHEMA-REFERENCE.md](./VOCAB-SCHEMA-REFERENCE.md) - Perfect reference schema
- [PHRASES-SCHEMA-GAPS.md](./PHRASES-SCHEMA-GAPS.md) - Phrases detailed analysis
- [CONTENT-SCHEMA-GAPS.md](./CONTENT-SCHEMA-GAPS.md) - Content detailed analysis
- Migration 079: `supabase/migrations/079_create_vocabulary.sql` - Perfect example

---

**END OF REPORT**

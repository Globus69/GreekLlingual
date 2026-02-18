# Phrases Schema Analysis - Gaps Report

**Created:** 2026-02-18
**Target Table:** `daily_phrases` (or `phrases`)
**Status:** ❌ **INCOMPLETE SCHEMA - MAJOR GAPS**

---

## 🚨 CRITICAL FINDINGS

### Table Status: **UNCERTAIN**

**Problem:** No base migration found creating the `phrases` or `daily_phrases` table with the full 18-column structure.

**Found:**
- Migration `077_add_daily_phrases_scheduling.sql` **ADDS COLUMNS** to existing `phrases` table
- BUT: No evidence of base table creation with multilingual structure
- API routes reference `daily_phrases` table (line 72, 88 in route.ts)

**Conclusion:** Table structure is **INCONSISTENT** and **INCOMPLETE**.

---

## ❌ Missing Columns (Compared to Vocab Reference)

Based on migration 077 and API routes analysis:

### 1. **Missing Core Columns:**

| Column | Found in Migration 077? | Status |
|--------|------------------------|--------|
| `nr` | ❌ | MISSING |
| `greek_transcription` | ❌ (assumes exists) | UNCERTAIN |
| `greek_phonetic` | ❌ (added as `phonetic`) | WRONG NAME |
| `en_translation` | ❌ | MISSING |
| `en_importance_reason` | ❌ | MISSING |
| `en_audio_url` | ❌ (added as `audio_url`) | INCOMPLETE |
| `de_translation` | ❌ | MISSING |
| `de_importance_reason` | ❌ | MISSING |
| `de_audio_url` | ❌ | MISSING |
| `es_translation` | ❌ | MISSING |
| `es_importance_reason` | ❌ | MISSING |
| `es_audio_url` | ❌ | MISSING |
| `ru_translation` | ❌ | MISSING |
| `ru_importance_reason` | ❌ | MISSING |
| `ru_audio_url` | ❌ | MISSING |
| `level` | ❌ | MISSING |
| `difficulty` | ❌ | MISSING |
| `frequency` | ❌ | MISSING |

### 2. **What Migration 077 Actually Adds:**

```sql
ALTER TABLE phrases
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

ADD COLUMN IF NOT EXISTS context_tags TEXT[];

ADD COLUMN IF NOT EXISTS phonetic TEXT;        -- Wrong: should be greek_phonetic

ADD COLUMN IF NOT EXISTS audio_url TEXT;       -- Wrong: should be en_audio_url, de_audio_url, etc.

ADD COLUMN IF NOT EXISTS audio_file_path TEXT;

ADD COLUMN IF NOT EXISTS notes TEXT;
```

**Problem:** These are **ADDITIONAL** fields for daily phrases scheduling, but the **BASE 18-column structure is missing**!

---

## 🔍 API Route Analysis

### File: `src/app/api/admin/daily-phrases/route.ts`

**Line 72:** Queries `daily_phrases` table:
```typescript
let query = supabase
  .from('daily_phrases')  // ❌ Table name inconsistent with migration (uses 'phrases')
  .select('*', { count: 'exact' });
```

**Line 77:** Searches across multilingual fields:
```typescript
if (search) {
  query = query.or(`greek_transcription.ilike.%${search}%,en_translation.ilike.%${search}%,ru_translation.ilike.%${search}%,de_translation.ilike.%${search}%,es_translation.ilike.%${search}%`);
}
```

**Conclusion:** API expects `daily_phrases` table with full multilingual columns, but schema doesn't provide them.

---

## 📊 TypeScript Types Analysis

### File: `src/types/phrases.ts`

**Lines 28-68:** `PhraseEntry` interface defines:

```typescript
interface PhraseEntry {
  id: string;
  nr?: number;

  // Greek content
  greek_transcription: string;
  greek_phonetic?: string;

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

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
}
```

**Result:** TypeScript types match vocab schema perfectly (18 columns), but **DATABASE DOESN'T**.

---

## ❌ Missing RPC Functions

Compared to vocab (which has 5 RPC functions), phrases has **NONE** of the following:

### Required RPC Functions (0 of 5 implemented):

1. ❌ `get_phrases_filtered()` - Filter and paginate phrases
2. ❌ `get_phrases_stats()` - Get statistics dashboard
3. ❌ `bulk_update_phrases()` - Bulk update metadata
4. ❌ `bulk_delete_phrases()` - Bulk delete entries
5. ❌ `check_phrases_duplicate()` - Check for duplicates

**What EXISTS (from migration 077):**
- `check_daily_phrase_limit()` - Check 3-per-day limit (DIFFERENT PURPOSE)
- `admin_create_daily_phrase()` - Create with scheduling (DIFFERENT SCHEMA)
- `admin_update_daily_phrase()` - Update with scheduling (DIFFERENT SCHEMA)
- `admin_delete_daily_phrase()` - Delete single phrase (DIFFERENT SCHEMA)
- `get_upcoming_phrases()` - Get scheduled phrases (DIFFERENT PURPOSE)

**Problem:** These RPC functions use **OLD SCHEMA** with `greek`, `english` fields instead of multilingual structure.

---

## ❌ Missing Indexes

Compared to vocab (which has 9 indexes), phrases has **ONLY 2**:

**What EXISTS:**
```sql
CREATE INDEX idx_phrases_scheduled_date ON phrases(scheduled_date);
CREATE INDEX idx_phrases_context_tags ON phrases USING GIN(context_tags);
```

**What's MISSING:**
1. ❌ `idx_phrases_level` - Filter by level
2. ❌ `idx_phrases_difficulty` - Filter by difficulty
3. ❌ `idx_phrases_frequency` - Filter by frequency
4. ❌ `idx_phrases_created_at` - Sort by date
5. ❌ `idx_phrases_greek_text` - Full-text search (Greek)
6. ❌ `idx_phrases_en_text` - Full-text search (EN)
7. ❌ `idx_phrases_de_text` - Full-text search (DE)
8. ❌ `idx_phrases_es_text` - Full-text search (ES)
9. ❌ `idx_phrases_ru_text` - Full-text search (RU)

---

## ❌ Missing Constraints

**What's MISSING:**
1. ❌ `UNIQUE (greek_transcription, level)` - Prevent duplicates
2. ❌ `CHECK (level IN ('A1','A2','B1','B2','C1','C2'))` - Validate level
3. ❌ `CHECK (difficulty IN ('easy','medium','hard'))` - Validate difficulty
4. ❌ `CHECK (frequency >= 1 AND frequency <= 5)` - Validate frequency

---

## 📋 CSV Format Analysis

### File: `public/templates/Import-Phrases-A2-Sample.csv`

**Column Order (17 columns - WRONG!):**

```
nr,greek_transcription,greek_phonetic,ru_translation,ru_importance_reason,ru_audio_url,en_translation,en_importance_reason,en_audio_url,es_translation,es_importance_reason,es_audio_url,de_translation,de_importance_reason,de_audio_url,level,difficulty,frequency
```

**Problems:**
1. ❌ **Column order is DIFFERENT from vocab** (RU first instead of EN first)
2. ✅ Has all 18 columns (GOOD)
3. ❌ **But database schema doesn't support them** (BAD)

**Expected Order (matching vocab):**
```
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

---

## 🔥 Critical Issues Summary

| Issue | Severity | Impact |
|-------|----------|--------|
| Table name mismatch (`phrases` vs `daily_phrases`) | 🔥 CRITICAL | API fails |
| Missing 15 multilingual columns | 🔥 CRITICAL | Cannot store translations |
| Wrong column names (`phonetic` vs `greek_phonetic`) | 🔴 HIGH | Import fails |
| Missing 5 RPC functions | 🔴 HIGH | Admin UI broken |
| Missing 9 indexes | 🟡 MEDIUM | Slow queries |
| Missing 4 constraints | 🟡 MEDIUM | Data integrity risk |
| CSV column order wrong | 🟡 MEDIUM | Confusing for admins |
| No unique constraint | 🔴 HIGH | Duplicates possible |

---

## ✅ Action Required

### Option 1: Create New Migration (RECOMMENDED)

Create `080_create_phrases_multilingual.sql` that:
1. Drops existing `phrases` table (if exists)
2. Creates `daily_phrases` table with EXACT vocab schema (18 columns)
3. Adds phrases-specific fields (`scheduled_date`, `context_tags`)
4. Creates all 9 indexes
5. Creates all 5 RPC functions (phrases-specific)
6. Enables RLS with 3 policies

### Option 2: Alter Existing Table

Create `080_align_phrases_schema.sql` that:
1. Renames `phrases` → `daily_phrases`
2. Adds 15 missing columns
3. Renames `phonetic` → `greek_phonetic`
4. Splits `audio_url` → language-specific audio URLs
5. Creates all missing indexes
6. Creates all missing RPC functions
7. Adds all missing constraints

---

## 📦 Deliverables Needed

1. ✅ Migration: `080_create_phrases_multilingual.sql` or `080_align_phrases_schema.sql`
2. ✅ CSV Template: Update `Import-Phrases-A2-Sample.csv` with correct column order
3. ✅ API Route: Update references to use consistent table name
4. ✅ RPC Functions: Create all 5 missing functions
5. ✅ Documentation: Update schema docs

---

## 🎯 Recommendation

**DO NOT ATTEMPT TO FIX INCREMENTALLY.**

**Instead:**
1. Drop existing `phrases` table (backup data first if any exists)
2. Create clean `daily_phrases` table from scratch
3. Use vocab migration 079 as template
4. Add phrases-specific fields afterward
5. Test thoroughly

**This ensures 100% schema consistency.**

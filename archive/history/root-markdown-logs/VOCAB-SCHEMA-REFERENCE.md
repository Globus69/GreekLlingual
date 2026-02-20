# Vocabulary Schema Reference

**Created:** 2026-02-18
**Purpose:** Reference schema for all admin systems
**Table:** `multilingual_vocabulary`
**Migration:** `079_create_vocabulary.sql`

---

## ✅ PERFECT SCHEMA (DO NOT CHANGE)

This is the **REFERENCE** schema that all other systems must match exactly.

### Table: `multilingual_vocabulary`

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `nr` | INTEGER | - | Sequential number (optional) |
| **Greek Content** |
| `greek_transcription` | TEXT | NOT NULL | Greek text in Latin script |
| `greek_phonetic` | TEXT | - | Phonetic pronunciation guide |
| **English Translation** |
| `en_translation` | TEXT | - | English translation |
| `en_importance_reason` | TEXT | - | Why this is important (EN) |
| `en_audio_url` | TEXT | - | Audio file URL (EN) |
| **German Translation** |
| `de_translation` | TEXT | - | German translation |
| `de_importance_reason` | TEXT | - | Why this is important (DE) |
| `de_audio_url` | TEXT | - | Audio file URL (DE) |
| **Spanish Translation** |
| `es_translation` | TEXT | - | Spanish translation |
| `es_importance_reason` | TEXT | - | Why this is important (ES) |
| `es_audio_url` | TEXT | - | Audio file URL (ES) |
| **Russian Translation** |
| `ru_translation` | TEXT | - | Russian translation |
| `ru_importance_reason` | TEXT | - | Why this is important (RU) |
| `ru_audio_url` | TEXT | - | Audio file URL (RU) |
| **Learning Metadata** |
| `level` | TEXT | NOT NULL, CHECK (level IN ('A1','A2','B1','B2','C1','C2')) | CEFR level |
| `difficulty` | TEXT | NOT NULL, CHECK (difficulty IN ('easy','medium','hard')) | Difficulty rating |
| `frequency` | INTEGER | NOT NULL DEFAULT 3, CHECK (frequency >= 1 AND frequency <= 5) | Frequency rating (1-5 stars) |
| **Timestamps** |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update timestamp |
| `created_by` | UUID | REFERENCES users(id) | Admin who created entry |

**TOTAL COLUMNS:** 21 (but only 18 user-facing content columns)

---

## 🔍 Indexes

```sql
CREATE INDEX idx_vocab_level ON multilingual_vocabulary(level);
CREATE INDEX idx_vocab_difficulty ON multilingual_vocabulary(difficulty);
CREATE INDEX idx_vocab_frequency ON multilingual_vocabulary(frequency);
CREATE INDEX idx_vocab_created_at ON multilingual_vocabulary(created_at DESC);
CREATE INDEX idx_vocab_greek_text ON multilingual_vocabulary USING gin(to_tsvector('simple', greek_transcription));
CREATE INDEX idx_vocab_en_text ON multilingual_vocabulary USING gin(to_tsvector('english', COALESCE(en_translation, '')));
CREATE INDEX idx_vocab_de_text ON multilingual_vocabulary USING gin(to_tsvector('german', COALESCE(de_translation, '')));
CREATE INDEX idx_vocab_es_text ON multilingual_vocabulary USING gin(to_tsvector('spanish', COALESCE(es_translation, '')));
CREATE INDEX idx_vocab_ru_text ON multilingual_vocabulary USING gin(to_tsvector('russian', COALESCE(ru_translation, '')));
```

---

## 🛡️ Constraints

1. **Unique Constraint:** `UNIQUE (greek_transcription, level)` - No duplicates per level
2. **Level Check:** Must be one of: A1, A2, B1, B2, C1, C2
3. **Difficulty Check:** Must be one of: easy, medium, hard
4. **Frequency Check:** Must be between 1 and 5 (inclusive)

---

## 🔐 Row Level Security (RLS)

```sql
-- Admin full access
CREATE POLICY "Admin full access to vocabulary"
    ON multilingual_vocabulary FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Students read-only
CREATE POLICY "Students can read vocabulary"
    ON multilingual_vocabulary FOR SELECT
    USING (true);

-- Anonymous read-only
CREATE POLICY "Anon can read vocabulary"
    ON multilingual_vocabulary FOR SELECT TO anon
    USING (true);
```

---

## 📞 RPC Functions (5 total)

### 1. `get_vocabulary_filtered()`

**Purpose:** Fetch vocabulary with filters and pagination

**Parameters:**
- `p_search` TEXT (optional)
- `p_level` TEXT (optional)
- `p_difficulty` TEXT (optional)
- `p_frequency_min` INTEGER (optional)
- `p_frequency_max` INTEGER (optional)
- `p_limit` INTEGER (default: 20)
- `p_offset` INTEGER (default: 0)

**Returns:** SETOF multilingual_vocabulary

---

### 2. `get_vocabulary_stats()`

**Purpose:** Get statistics for dashboard

**Parameters:** None

**Returns:** JSON with:
```json
{
  "total": 1234,
  "by_level": { "A1": 100, "A2": 200, ... },
  "by_difficulty": { "easy": 500, "medium": 400, "hard": 334 },
  "avg_frequency": 3.45,
  "with_audio": { "en": 100, "de": 80, "es": 60, "ru": 40 }
}
```

---

### 3. `bulk_update_vocabulary()`

**Purpose:** Update multiple entries at once

**Parameters:**
- `p_ids` UUID[]
- `p_level` TEXT (optional)
- `p_difficulty` TEXT (optional)
- `p_frequency` INTEGER (optional)

**Returns:** INTEGER (number of rows updated)

**Security:** Admin-only (raises exception if not admin)

---

### 4. `bulk_delete_vocabulary()`

**Purpose:** Delete multiple entries

**Parameters:**
- `p_ids` UUID[]

**Returns:** INTEGER (number of rows deleted)

**Security:** Admin-only (raises exception if not admin)

---

### 5. `check_vocabulary_duplicate()`

**Purpose:** Check if entry already exists

**Parameters:**
- `p_greek_transcription` TEXT
- `p_level` TEXT
- `p_exclude_id` UUID (optional - for updates)

**Returns:** BOOLEAN (true if duplicate exists)

---

## 📊 CSV Format

**Column Order (18 columns):**

```
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

**Example Row:**
```csv
1,Γεια σου,yá su,Hello,Essential greeting used daily in informal settings,,Hallo,Grundlegende Begrüßung für informelle Situationen,,Hola,Saludo básico usado diariamente en contextos informales,,Привет,Основное приветствие для неформальных ситуаций,,A1,easy,5
```

---

## ✅ Summary

- ✅ **21 total columns** (18 content + 3 system fields)
- ✅ **4 languages** (EN, DE, ES, RU) with 3 fields each
- ✅ **9 indexes** (performance optimized)
- ✅ **3 RLS policies** (admin + student + anon)
- ✅ **5 RPC functions** (filter, stats, bulk update, bulk delete, duplicate check)
- ✅ **Unique constraint** on (greek_transcription, level)
- ✅ **Auto-update timestamp** trigger

**This schema is PERFECT. Do not change it.**

**ALL OTHER SYSTEMS MUST MATCH THIS EXACTLY.**

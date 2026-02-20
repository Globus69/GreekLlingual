# Daily Phrases Table Status

## Date: 2026-02-18

## Database Verification

### Table: `daily_phrases`

**Status:** ✅ EXISTS

**Source:** `database/test-data/039_insert_test_daily_phrases.sql`

### Current Schema (from migration):

```sql
CREATE TABLE IF NOT EXISTS public.daily_phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL,
    greek_phrase TEXT NOT NULL,
    english_translation TEXT NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Required Schema for Admin UI (Multilingual):

The current schema is INSUFFICIENT for the multilingual admin interface. We need to add columns for:

- **nr** (NUMBER) - Sequential number
- **greek_phonetic** (TEXT) - Phonetic transcription
- **ru_translation** (TEXT) - Russian translation
- **ru_importance_reason** (TEXT) - Why important (Russian)
- **ru_audio_url** (TEXT) - Audio file URL (Russian)
- **de_translation** (TEXT) - German translation
- **de_importance_reason** (TEXT) - Why important (German)
- **de_audio_url** (TEXT) - Audio file URL (German)
- **es_translation** (TEXT) - Spanish translation
- **es_importance_reason** (TEXT) - Why important (Spanish)
- **es_audio_url** (TEXT) - Audio file URL (Spanish)
- **en_importance_reason** (TEXT) - Why important (English)
- **en_audio_url** (TEXT) - Audio file URL (English)
- **level** (VARCHAR) - CEFR Level (A1-C2)
- **frequency** (INTEGER) - 1-5 star rating

### Migration Needed

**Action Required:** Create migration to alter `daily_phrases` table:

1. Rename `english_translation` → `en_translation`
2. Rename `greek_phrase` → `greek_transcription`
3. Add multilingual columns (DE, ES, RU)
4. Add phonetic, audio URLs, importance reasons
5. Add level and frequency columns
6. Remove or keep deck_id (optional - for backward compatibility)

### Alternative Approach

**Option 1:** Alter existing table (preserves data)
**Option 2:** Create new table `multilingual_daily_phrases` (clean slate)

## Recommendation

Use **Option 1** - Alter existing table with backward compatibility:
- Keep existing columns
- Add new columns with NULL defaults
- Update existing data to match new structure
- Create admin interface that uses new column names

## Next Steps

1. Create migration SQL file
2. Test migration locally
3. Implement admin UI (clone from /admin/vocab)
4. Import 10 sample phrases provided by user


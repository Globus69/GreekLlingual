-- ============================================================================
-- Migration 084: Add central audio_url column to vocabulary and phrases
-- ============================================================================
-- Purpose: Add audio_url field in core information (language-independent)
-- Date: 2026-02-18
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 084: Adding audio_url to vocab and phrases';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. Add audio_url to multilingual_vocabulary
-- ============================================================================

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'multilingual_vocabulary'
        AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE multilingual_vocabulary
        ADD COLUMN audio_url VARCHAR(500);

        RAISE NOTICE '✅ Added audio_url column to multilingual_vocabulary';
    ELSE
        RAISE NOTICE '⚠️  audio_url column already exists in multilingual_vocabulary';
    END IF;
END $$;

-- ============================================================================
-- 2. Add audio_url to daily_phrases
-- ============================================================================

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE daily_phrases
        ADD COLUMN audio_url VARCHAR(500);

        RAISE NOTICE '✅ Added audio_url column to daily_phrases';
    ELSE
        RAISE NOTICE '⚠️  audio_url column already exists in daily_phrases';
    END IF;
END $$;

-- ============================================================================
-- 3. Add indexes for audio_url (optional but recommended)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vocab_audio_url
ON multilingual_vocabulary(audio_url)
WHERE audio_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_phrases_audio_url
ON daily_phrases(audio_url)
WHERE audio_url IS NOT NULL;

-- ============================================================================
-- 4. Update RPC functions to include audio_url
-- ============================================================================

-- Drop and recreate admin_create_vocabulary function
DROP FUNCTION IF EXISTS admin_create_vocabulary;

CREATE OR REPLACE FUNCTION admin_create_vocabulary(
    p_greek_transcription VARCHAR,
    p_level VARCHAR,
    p_difficulty VARCHAR,
    p_frequency INTEGER,
    p_greek_phonetic VARCHAR DEFAULT NULL,
    p_audio_url VARCHAR DEFAULT NULL,
    p_en_translation TEXT DEFAULT NULL,
    p_en_importance_reason TEXT DEFAULT NULL,
    p_en_audio_url VARCHAR DEFAULT NULL,
    p_de_translation TEXT DEFAULT NULL,
    p_de_importance_reason TEXT DEFAULT NULL,
    p_de_audio_url VARCHAR DEFAULT NULL,
    p_es_translation TEXT DEFAULT NULL,
    p_es_importance_reason TEXT DEFAULT NULL,
    p_es_audio_url VARCHAR DEFAULT NULL,
    p_ru_translation TEXT DEFAULT NULL,
    p_ru_importance_reason TEXT DEFAULT NULL,
    p_ru_audio_url VARCHAR DEFAULT NULL,
    p_nr INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Authorize admin
    IF NOT (SELECT is_admin FROM auth.users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    INSERT INTO multilingual_vocabulary (
        greek_transcription, level, difficulty, frequency,
        greek_phonetic, audio_url,
        en_translation, en_importance_reason, en_audio_url,
        de_translation, de_importance_reason, de_audio_url,
        es_translation, es_importance_reason, es_audio_url,
        ru_translation, ru_importance_reason, ru_audio_url,
        nr
    ) VALUES (
        p_greek_transcription, p_level, p_difficulty, p_frequency,
        p_greek_phonetic, p_audio_url,
        p_en_translation, p_en_importance_reason, p_en_audio_url,
        p_de_translation, p_de_importance_reason, p_de_audio_url,
        p_es_translation, p_es_importance_reason, p_es_audio_url,
        p_ru_translation, p_ru_importance_reason, p_ru_audio_url,
        p_nr
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Drop and recreate admin_update_vocabulary function
DROP FUNCTION IF EXISTS admin_update_vocabulary;

CREATE OR REPLACE FUNCTION admin_update_vocabulary(
    p_id UUID,
    p_greek_transcription VARCHAR DEFAULT NULL,
    p_level VARCHAR DEFAULT NULL,
    p_difficulty VARCHAR DEFAULT NULL,
    p_frequency INTEGER DEFAULT NULL,
    p_greek_phonetic VARCHAR DEFAULT NULL,
    p_audio_url VARCHAR DEFAULT NULL,
    p_en_translation TEXT DEFAULT NULL,
    p_en_importance_reason TEXT DEFAULT NULL,
    p_en_audio_url VARCHAR DEFAULT NULL,
    p_de_translation TEXT DEFAULT NULL,
    p_de_importance_reason TEXT DEFAULT NULL,
    p_de_audio_url VARCHAR DEFAULT NULL,
    p_es_translation TEXT DEFAULT NULL,
    p_es_importance_reason TEXT DEFAULT NULL,
    p_es_audio_url VARCHAR DEFAULT NULL,
    p_ru_translation TEXT DEFAULT NULL,
    p_ru_importance_reason TEXT DEFAULT NULL,
    p_ru_audio_url VARCHAR DEFAULT NULL,
    p_nr INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Authorize admin
    IF NOT (SELECT is_admin FROM auth.users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE multilingual_vocabulary
    SET
        nr = COALESCE(p_nr, nr),
        greek_transcription = COALESCE(p_greek_transcription, greek_transcription),
        greek_phonetic = COALESCE(p_greek_phonetic, greek_phonetic),
        audio_url = COALESCE(p_audio_url, audio_url),
        en_translation = COALESCE(p_en_translation, en_translation),
        en_importance_reason = COALESCE(p_en_importance_reason, en_importance_reason),
        en_audio_url = COALESCE(p_en_audio_url, en_audio_url),
        de_translation = COALESCE(p_de_translation, de_translation),
        de_importance_reason = COALESCE(p_de_importance_reason, de_importance_reason),
        de_audio_url = COALESCE(p_de_audio_url, de_audio_url),
        es_translation = COALESCE(p_es_translation, es_translation),
        es_importance_reason = COALESCE(p_es_importance_reason, es_importance_reason),
        es_audio_url = COALESCE(p_es_audio_url, es_audio_url),
        ru_translation = COALESCE(p_ru_translation, ru_translation),
        ru_importance_reason = COALESCE(p_ru_importance_reason, ru_importance_reason),
        ru_audio_url = COALESCE(p_ru_audio_url, ru_audio_url),
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        frequency = COALESCE(p_frequency, frequency),
        updated_at = NOW()
    WHERE id = p_id;
END;
$$;

-- Drop and recreate admin_create_phrase function
DROP FUNCTION IF EXISTS admin_create_phrase;

CREATE OR REPLACE FUNCTION admin_create_phrase(
    p_greek_transcription VARCHAR,
    p_level VARCHAR,
    p_difficulty VARCHAR,
    p_frequency INTEGER,
    p_greek_phonetic VARCHAR DEFAULT NULL,
    p_audio_url VARCHAR DEFAULT NULL,
    p_en_translation TEXT DEFAULT NULL,
    p_en_importance_reason TEXT DEFAULT NULL,
    p_en_audio_url VARCHAR DEFAULT NULL,
    p_de_translation TEXT DEFAULT NULL,
    p_de_importance_reason TEXT DEFAULT NULL,
    p_de_audio_url VARCHAR DEFAULT NULL,
    p_es_translation TEXT DEFAULT NULL,
    p_es_importance_reason TEXT DEFAULT NULL,
    p_es_audio_url VARCHAR DEFAULT NULL,
    p_ru_translation TEXT DEFAULT NULL,
    p_ru_importance_reason TEXT DEFAULT NULL,
    p_ru_audio_url VARCHAR DEFAULT NULL,
    p_nr INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Authorize admin
    IF NOT (SELECT is_admin FROM auth.users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    INSERT INTO daily_phrases (
        greek_transcription, level, difficulty, frequency,
        greek_phonetic, audio_url,
        en_translation, en_importance_reason, en_audio_url,
        de_translation, de_importance_reason, de_audio_url,
        es_translation, es_importance_reason, es_audio_url,
        ru_translation, ru_importance_reason, ru_audio_url,
        nr
    ) VALUES (
        p_greek_transcription, p_level, p_difficulty, p_frequency,
        p_greek_phonetic, p_audio_url,
        p_en_translation, p_en_importance_reason, p_en_audio_url,
        p_de_translation, p_de_importance_reason, p_de_audio_url,
        p_es_translation, p_es_importance_reason, p_es_audio_url,
        p_ru_translation, p_ru_importance_reason, p_ru_audio_url,
        p_nr
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Drop and recreate admin_update_phrase function
DROP FUNCTION IF EXISTS admin_update_phrase;

CREATE OR REPLACE FUNCTION admin_update_phrase(
    p_id UUID,
    p_greek_transcription VARCHAR DEFAULT NULL,
    p_level VARCHAR DEFAULT NULL,
    p_difficulty VARCHAR DEFAULT NULL,
    p_frequency INTEGER DEFAULT NULL,
    p_greek_phonetic VARCHAR DEFAULT NULL,
    p_audio_url VARCHAR DEFAULT NULL,
    p_en_translation TEXT DEFAULT NULL,
    p_en_importance_reason TEXT DEFAULT NULL,
    p_en_audio_url VARCHAR DEFAULT NULL,
    p_de_translation TEXT DEFAULT NULL,
    p_de_importance_reason TEXT DEFAULT NULL,
    p_de_audio_url VARCHAR DEFAULT NULL,
    p_es_translation TEXT DEFAULT NULL,
    p_es_importance_reason TEXT DEFAULT NULL,
    p_es_audio_url VARCHAR DEFAULT NULL,
    p_ru_translation TEXT DEFAULT NULL,
    p_ru_importance_reason TEXT DEFAULT NULL,
    p_ru_audio_url VARCHAR DEFAULT NULL,
    p_nr INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Authorize admin
    IF NOT (SELECT is_admin FROM auth.users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE daily_phrases
    SET
        nr = COALESCE(p_nr, nr),
        greek_transcription = COALESCE(p_greek_transcription, greek_transcription),
        greek_phonetic = COALESCE(p_greek_phonetic, greek_phonetic),
        audio_url = COALESCE(p_audio_url, audio_url),
        en_translation = COALESCE(p_en_translation, en_translation),
        en_importance_reason = COALESCE(p_en_importance_reason, en_importance_reason),
        en_audio_url = COALESCE(p_en_audio_url, en_audio_url),
        de_translation = COALESCE(p_de_translation, de_translation),
        de_importance_reason = COALESCE(p_de_importance_reason, de_importance_reason),
        de_audio_url = COALESCE(p_de_audio_url, de_audio_url),
        es_translation = COALESCE(p_es_translation, es_translation),
        es_importance_reason = COALESCE(p_es_importance_reason, es_importance_reason),
        es_audio_url = COALESCE(p_es_audio_url, es_audio_url),
        ru_translation = COALESCE(p_ru_translation, ru_translation),
        ru_importance_reason = COALESCE(p_ru_importance_reason, ru_importance_reason),
        ru_audio_url = COALESCE(p_ru_audio_url, ru_audio_url),
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        frequency = COALESCE(p_frequency, frequency),
        updated_at = NOW()
    WHERE id = p_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_create_vocabulary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_vocabulary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_create_phrase TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_phrase TO anon, authenticated;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 084 COMPLETE';
    RAISE NOTICE '✅ Added audio_url to vocabulary and phrases tables';
    RAISE NOTICE '✅ Updated 4 RPC functions';
    RAISE NOTICE '✅ Created 2 indexes';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '';
END $$;

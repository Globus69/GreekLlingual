-- ========================================
-- MIGRATION: Multilingual Daily Phrases
-- ========================================
-- Date: 2026-02-18
-- Purpose: Extend daily_phrases table to support multilingual admin interface
--
-- This migration adds columns for EN, DE, ES, RU translations with
-- importance reasons and audio URLs, plus phonetic transcription,
-- CEFR level, and frequency rating (1-5 stars)
-- ========================================

-- Step 1: Add new columns to daily_phrases table
DO $$
BEGIN
    -- Add nr (sequential number)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'nr'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN nr INTEGER;
        RAISE NOTICE 'Added nr column';
    END IF;

    -- Add greek_phonetic
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'greek_phonetic'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN greek_phonetic TEXT;
        RAISE NOTICE 'Added greek_phonetic column';
    END IF;

    -- Add English columns (en_translation already exists as english_translation)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'en_translation'
    ) THEN
        -- Rename english_translation to en_translation
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'daily_phrases'
            AND column_name = 'english_translation'
        ) THEN
            ALTER TABLE public.daily_phrases RENAME COLUMN english_translation TO en_translation;
            RAISE NOTICE 'Renamed english_translation to en_translation';
        ELSE
            ALTER TABLE public.daily_phrases ADD COLUMN en_translation TEXT;
            RAISE NOTICE 'Added en_translation column';
        END IF;
    END IF;

    -- Add en_importance_reason
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'en_importance_reason'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN en_importance_reason TEXT;
        RAISE NOTICE 'Added en_importance_reason column';
    END IF;

    -- Add en_audio_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'en_audio_url'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN en_audio_url TEXT;
        RAISE NOTICE 'Added en_audio_url column';
    END IF;

    -- Add German columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'de_translation'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN de_translation TEXT;
        RAISE NOTICE 'Added de_translation column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'de_importance_reason'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN de_importance_reason TEXT;
        RAISE NOTICE 'Added de_importance_reason column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'de_audio_url'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN de_audio_url TEXT;
        RAISE NOTICE 'Added de_audio_url column';
    END IF;

    -- Add Spanish columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'es_translation'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN es_translation TEXT;
        RAISE NOTICE 'Added es_translation column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'es_importance_reason'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN es_importance_reason TEXT;
        RAISE NOTICE 'Added es_importance_reason column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'es_audio_url'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN es_audio_url TEXT;
        RAISE NOTICE 'Added es_audio_url column';
    END IF;

    -- Add Russian columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'ru_translation'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN ru_translation TEXT;
        RAISE NOTICE 'Added ru_translation column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'ru_importance_reason'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN ru_importance_reason TEXT;
        RAISE NOTICE 'Added ru_importance_reason column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'ru_audio_url'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN ru_audio_url TEXT;
        RAISE NOTICE 'Added ru_audio_url column';
    END IF;

    -- Add greek_transcription alias (rename greek_phrase to greek_transcription)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'greek_transcription'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'daily_phrases'
            AND column_name = 'greek_phrase'
        ) THEN
            ALTER TABLE public.daily_phrases RENAME COLUMN greek_phrase TO greek_transcription;
            RAISE NOTICE 'Renamed greek_phrase to greek_transcription';
        ELSE
            ALTER TABLE public.daily_phrases ADD COLUMN greek_transcription TEXT NOT NULL DEFAULT '';
            RAISE NOTICE 'Added greek_transcription column';
        END IF;
    END IF;

    -- Add level (CEFR: A1-C2)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'level'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN level VARCHAR(2) DEFAULT 'A2';
        RAISE NOTICE 'Added level column';
    END IF;

    -- Add frequency (1-5 stars)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'frequency'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN frequency INTEGER DEFAULT 3 CHECK (frequency >= 1 AND frequency <= 5);
        RAISE NOTICE 'Added frequency column';
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

    -- Add created_by for audit trail
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_phrases'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.daily_phrases ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column';
    END IF;

END $$;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_phrases_level ON public.daily_phrases(level);
CREATE INDEX IF NOT EXISTS idx_daily_phrases_difficulty ON public.daily_phrases(difficulty);
CREATE INDEX IF NOT EXISTS idx_daily_phrases_frequency ON public.daily_phrases(frequency);
CREATE INDEX IF NOT EXISTS idx_daily_phrases_greek_transcription ON public.daily_phrases(greek_transcription);
CREATE INDEX IF NOT EXISTS idx_daily_phrases_updated_at ON public.daily_phrases(updated_at);

-- Step 3: Make deck_id nullable for backward compatibility
ALTER TABLE public.daily_phrases ALTER COLUMN deck_id DROP NOT NULL;

-- Step 4: Update RLS policies if needed
-- The existing policy "Daily phrases are viewable by everyone" should remain

-- Step 5: Create helper function for stats (similar to vocabulary)
CREATE OR REPLACE FUNCTION get_phrases_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*)::INTEGER,
        'by_level', json_build_object(
            'A1', COUNT(*) FILTER (WHERE level = 'A1')::INTEGER,
            'A2', COUNT(*) FILTER (WHERE level = 'A2')::INTEGER,
            'B1', COUNT(*) FILTER (WHERE level = 'B1')::INTEGER,
            'B2', COUNT(*) FILTER (WHERE level = 'B2')::INTEGER,
            'C1', COUNT(*) FILTER (WHERE level = 'C1')::INTEGER,
            'C2', COUNT(*) FILTER (WHERE level = 'C2')::INTEGER
        ),
        'by_difficulty', json_build_object(
            'easy', COUNT(*) FILTER (WHERE difficulty = 'easy')::INTEGER,
            'medium', COUNT(*) FILTER (WHERE difficulty = 'medium')::INTEGER,
            'hard', COUNT(*) FILTER (WHERE difficulty = 'hard')::INTEGER
        ),
        'avg_frequency', COALESCE(AVG(frequency)::NUMERIC(3,2), 0),
        'with_audio', json_build_object(
            'en', COUNT(*) FILTER (WHERE en_audio_url IS NOT NULL AND en_audio_url != '')::INTEGER,
            'de', COUNT(*) FILTER (WHERE de_audio_url IS NOT NULL AND de_audio_url != '')::INTEGER,
            'es', COUNT(*) FILTER (WHERE es_audio_url IS NOT NULL AND es_audio_url != '')::INTEGER,
            'ru', COUNT(*) FILTER (WHERE ru_audio_url IS NOT NULL AND ru_audio_url != '')::INTEGER
        )
    ) INTO result
    FROM public.daily_phrases;

    RETURN result;
END;
$$;

-- Step 6: Create bulk update function
CREATE OR REPLACE FUNCTION bulk_update_phrases(
    p_ids UUID[],
    p_level VARCHAR DEFAULT NULL,
    p_difficulty VARCHAR DEFAULT NULL,
    p_frequency INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.daily_phrases
    SET
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        frequency = COALESCE(p_frequency, frequency),
        updated_at = NOW()
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$;

-- Step 7: Create bulk delete function
CREATE OR REPLACE FUNCTION bulk_delete_phrases(p_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM public.daily_phrases
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    RETURN rows_deleted;
END;
$$;

-- Step 8: Create duplicate check function
CREATE OR REPLACE FUNCTION check_phrases_duplicate(
    p_greek_transcription TEXT,
    p_level VARCHAR,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    duplicate_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM public.daily_phrases
        WHERE greek_transcription = p_greek_transcription
        AND level = p_level
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) INTO duplicate_exists;

    RETURN duplicate_exists;
END;
$$;

-- ========================================
-- Verification Queries
-- ========================================
-- Run these to verify the migration:
--
-- Check all columns:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'daily_phrases'
-- ORDER BY ordinal_position;
--
-- Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'daily_phrases';
--
-- Test stats function:
-- SELECT get_phrases_stats();
-- ========================================

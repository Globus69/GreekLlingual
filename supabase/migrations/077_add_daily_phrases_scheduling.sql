-- ========================================
-- DAILY PHRASES - ADD SCHEDULING & CONTEXT TAGS
-- Migration: 077_add_daily_phrases_scheduling.sql
-- Date: 2026-02-18
-- ========================================

-- Add scheduled_date column for calendar scheduling
ALTER TABLE phrases
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Add context_tags for categorization
ALTER TABLE phrases
ADD COLUMN IF NOT EXISTS context_tags TEXT[];

-- Add phonetic transcription
ALTER TABLE phrases
ADD COLUMN IF NOT EXISTS phonetic TEXT;

-- Add audio URL
ALTER TABLE phrases
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add audio file path (for Supabase Storage)
ALTER TABLE phrases
ADD COLUMN IF NOT EXISTS audio_file_path TEXT;

-- Add notes field for admin
ALTER TABLE phrases
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for scheduled_date lookups
CREATE INDEX IF NOT EXISTS idx_phrases_scheduled_date ON phrases(scheduled_date);

-- Create index for context_tags filtering (GIN index for array columns)
CREATE INDEX IF NOT EXISTS idx_phrases_context_tags ON phrases USING GIN(context_tags);

-- ========================================
-- RPC FUNCTION: Check 3-per-day limit
-- ========================================

CREATE OR REPLACE FUNCTION check_daily_phrase_limit(
    p_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM phrases
        WHERE scheduled_date = p_date
    );
END;
$$;

-- ========================================
-- RPC FUNCTION: Admin Create Daily Phrase
-- ========================================

CREATE OR REPLACE FUNCTION admin_create_daily_phrase(
    p_user_id UUID,
    p_deck_id UUID,
    p_greek TEXT,
    p_english TEXT,
    p_scheduled_date DATE,
    p_context_tags TEXT[] DEFAULT NULL,
    p_phonetic TEXT DEFAULT NULL,
    p_audio_url TEXT DEFAULT NULL,
    p_audio_file_path TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS SETOF phrases
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_phrase_count INTEGER;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT is_admin INTO v_is_admin
    FROM users
    WHERE id = p_user_id;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Check 3-per-day limit
    SELECT COUNT(*) INTO v_phrase_count
    FROM phrases
    WHERE scheduled_date = p_scheduled_date;

    IF v_phrase_count >= 3 THEN
        RAISE EXCEPTION '3-per-day limit reached for date: %', p_scheduled_date;
    END IF;

    -- Insert phrase
    RETURN QUERY
    INSERT INTO phrases (
        deck_id,
        greek,
        english,
        scheduled_date,
        context_tags,
        phonetic,
        audio_url,
        audio_file_path,
        category,
        difficulty,
        notes,
        created_at,
        updated_at
    )
    VALUES (
        p_deck_id,
        p_greek,
        p_english,
        p_scheduled_date,
        p_context_tags,
        p_phonetic,
        p_audio_url,
        p_audio_file_path,
        p_category,
        p_difficulty,
        p_notes,
        NOW(),
        NOW()
    )
    RETURNING *;
END;
$$;

-- ========================================
-- RPC FUNCTION: Admin Update Daily Phrase
-- ========================================

CREATE OR REPLACE FUNCTION admin_update_daily_phrase(
    p_user_id UUID,
    p_phrase_id UUID,
    p_greek TEXT,
    p_english TEXT,
    p_scheduled_date DATE,
    p_context_tags TEXT[] DEFAULT NULL,
    p_phonetic TEXT DEFAULT NULL,
    p_audio_url TEXT DEFAULT NULL,
    p_audio_file_path TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS SETOF phrases
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_phrase_count INTEGER;
    v_is_admin BOOLEAN;
    v_current_date DATE;
BEGIN
    -- Check if user is admin
    SELECT is_admin INTO v_is_admin
    FROM users
    WHERE id = p_user_id;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Get current scheduled_date
    SELECT scheduled_date INTO v_current_date
    FROM phrases
    WHERE id = p_phrase_id;

    -- Check 3-per-day limit (only if date is changing)
    IF v_current_date IS NULL OR v_current_date != p_scheduled_date THEN
        SELECT COUNT(*) INTO v_phrase_count
        FROM phrases
        WHERE scheduled_date = p_scheduled_date
        AND id != p_phrase_id;

        IF v_phrase_count >= 3 THEN
            RAISE EXCEPTION '3-per-day limit reached for date: %', p_scheduled_date;
        END IF;
    END IF;

    -- Update phrase
    RETURN QUERY
    UPDATE phrases
    SET
        greek = p_greek,
        english = p_english,
        scheduled_date = p_scheduled_date,
        context_tags = p_context_tags,
        phonetic = p_phonetic,
        audio_url = p_audio_url,
        audio_file_path = p_audio_file_path,
        category = p_category,
        difficulty = p_difficulty,
        notes = p_notes,
        updated_at = NOW()
    WHERE id = p_phrase_id
    RETURNING *;
END;
$$;

-- ========================================
-- RPC FUNCTION: Admin Delete Daily Phrase
-- ========================================

CREATE OR REPLACE FUNCTION admin_delete_daily_phrase(
    p_user_id UUID,
    p_phrase_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT is_admin INTO v_is_admin
    FROM users
    WHERE id = p_user_id;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Delete phrase
    DELETE FROM phrases
    WHERE id = p_phrase_id;

    RETURN FOUND;
END;
$$;

-- ========================================
-- RPC FUNCTION: Get Upcoming Phrases
-- ========================================

CREATE OR REPLACE FUNCTION get_upcoming_phrases(
    p_days INTEGER DEFAULT 30
)
RETURNS SETOF phrases
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM phrases
    WHERE scheduled_date >= CURRENT_DATE
    AND scheduled_date <= CURRENT_DATE + p_days
    ORDER BY scheduled_date ASC;
END;
$$;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION check_daily_phrase_limit(DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_create_daily_phrase(UUID, UUID, TEXT, TEXT, DATE, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_update_daily_phrase(UUID, UUID, TEXT, TEXT, DATE, TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_delete_daily_phrase(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_upcoming_phrases(INTEGER) TO authenticated, anon;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON COLUMN phrases.scheduled_date IS 'Date when this phrase should be shown to students';
COMMENT ON COLUMN phrases.context_tags IS 'Array of context/situation tags (e.g., greeting, shopping, restaurant)';
COMMENT ON COLUMN phrases.phonetic IS 'Phonetic transcription of Greek phrase';
COMMENT ON COLUMN phrases.audio_url IS 'External audio URL';
COMMENT ON COLUMN phrases.audio_file_path IS 'Path to audio file in Supabase Storage';
COMMENT ON COLUMN phrases.notes IS 'Admin notes for this phrase';

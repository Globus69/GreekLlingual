-- ============================================================================
-- Migration 083: Update RPC functions for multilingual_content table
-- ============================================================================
-- Purpose: Update admin CRUD RPC functions to work with multilingual_content
--          table instead of deprecated content table
--
-- Author: Agent 2 - State Management & API Specialist
-- Date: 2026-02-18
-- Related: Migration 082 (multilingual_content table creation)
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop old RPC functions
-- ============================================================================

DROP FUNCTION IF EXISTS admin_create_content(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_update_content(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_delete_content(UUID, UUID);
DROP FUNCTION IF EXISTS admin_bulk_import_content(UUID, JSONB);
DROP FUNCTION IF EXISTS admin_bulk_delete_content(UUID, UUID[]);

-- ============================================================================
-- STEP 2: Create RPC function for creating multilingual content
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_create_multilingual_content(
    p_user_id UUID,
    p_nr INTEGER DEFAULT NULL,
    p_type TEXT DEFAULT 'vocabulary',
    p_greek_transcription TEXT DEFAULT NULL,
    p_greek_phonetic TEXT DEFAULT NULL,
    p_en_translation TEXT DEFAULT NULL,
    p_en_importance_reason TEXT DEFAULT NULL,
    p_en_audio_url TEXT DEFAULT NULL,
    p_de_translation TEXT DEFAULT NULL,
    p_de_importance_reason TEXT DEFAULT NULL,
    p_de_audio_url TEXT DEFAULT NULL,
    p_es_translation TEXT DEFAULT NULL,
    p_es_importance_reason TEXT DEFAULT NULL,
    p_es_audio_url TEXT DEFAULT NULL,
    p_ru_translation TEXT DEFAULT NULL,
    p_ru_importance_reason TEXT DEFAULT NULL,
    p_ru_audio_url TEXT DEFAULT NULL,
    p_level TEXT DEFAULT 'A1',
    p_difficulty TEXT DEFAULT 'easy',
    p_frequency INTEGER DEFAULT 3
)
RETURNS multilingual_content AS $$
DECLARE
    new_content multilingual_content;
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can create content';
    END IF;

    -- Validate required fields
    IF p_greek_transcription IS NULL OR p_greek_transcription = '' THEN
        RAISE EXCEPTION 'greek_transcription is required';
    END IF;

    -- Insert content
    INSERT INTO multilingual_content (
        nr, type,
        greek_transcription, greek_phonetic,
        en_translation, en_importance_reason, en_audio_url,
        de_translation, de_importance_reason, de_audio_url,
        es_translation, es_importance_reason, es_audio_url,
        ru_translation, ru_importance_reason, ru_audio_url,
        level, difficulty, frequency
    ) VALUES (
        p_nr, p_type,
        p_greek_transcription, p_greek_phonetic,
        p_en_translation, p_en_importance_reason, p_en_audio_url,
        p_de_translation, p_de_importance_reason, p_de_audio_url,
        p_es_translation, p_es_importance_reason, p_es_audio_url,
        p_ru_translation, p_ru_importance_reason, p_ru_audio_url,
        p_level, p_difficulty, p_frequency
    ) RETURNING * INTO new_content;

    RETURN new_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_create_multilingual_content IS
    'Create multilingual content item (admin only). Supports Greek + EN, DE, ES, RU translations.';

-- ============================================================================
-- STEP 3: Create RPC function for updating multilingual content
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_update_multilingual_content(
    p_user_id UUID,
    p_content_id UUID,
    p_nr INTEGER DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_greek_transcription TEXT DEFAULT NULL,
    p_greek_phonetic TEXT DEFAULT NULL,
    p_en_translation TEXT DEFAULT NULL,
    p_en_importance_reason TEXT DEFAULT NULL,
    p_en_audio_url TEXT DEFAULT NULL,
    p_de_translation TEXT DEFAULT NULL,
    p_de_importance_reason TEXT DEFAULT NULL,
    p_de_audio_url TEXT DEFAULT NULL,
    p_es_translation TEXT DEFAULT NULL,
    p_es_importance_reason TEXT DEFAULT NULL,
    p_es_audio_url TEXT DEFAULT NULL,
    p_ru_translation TEXT DEFAULT NULL,
    p_ru_importance_reason TEXT DEFAULT NULL,
    p_ru_audio_url TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_frequency INTEGER DEFAULT NULL
)
RETURNS multilingual_content AS $$
DECLARE
    updated_content multilingual_content;
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can update content';
    END IF;

    -- Update content (only fields that are provided)
    UPDATE multilingual_content
    SET
        nr = COALESCE(p_nr, nr),
        type = COALESCE(p_type, type),
        greek_transcription = COALESCE(p_greek_transcription, greek_transcription),
        greek_phonetic = COALESCE(p_greek_phonetic, greek_phonetic),
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
    WHERE id = p_content_id
    RETURNING * INTO updated_content;

    IF updated_content IS NULL THEN
        RAISE EXCEPTION 'Content not found';
    END IF;

    RETURN updated_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_update_multilingual_content IS
    'Update multilingual content item (admin only). Partial updates supported.';

-- ============================================================================
-- STEP 4: Create RPC function for deleting multilingual content
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_delete_multilingual_content(
    p_user_id UUID,
    p_content_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can delete content';
    END IF;

    -- Delete content
    DELETE FROM multilingual_content WHERE id = p_content_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_delete_multilingual_content IS
    'Delete multilingual content item (admin only).';

-- ============================================================================
-- STEP 5: Create RPC function for bulk importing multilingual content
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_bulk_import_multilingual_content(
    p_user_id UUID,
    p_items JSONB
)
RETURNS TABLE(success_count INT, error_count INT, errors TEXT[]) AS $$
DECLARE
    item JSONB;
    success_cnt INT := 0;
    error_cnt INT := 0;
    error_messages TEXT[] := '{}';
    error_msg TEXT;
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can import content';
    END IF;

    -- Loop through items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            INSERT INTO multilingual_content (
                nr, type,
                greek_transcription, greek_phonetic,
                en_translation, en_importance_reason, en_audio_url,
                de_translation, de_importance_reason, de_audio_url,
                es_translation, es_importance_reason, es_audio_url,
                ru_translation, ru_importance_reason, ru_audio_url,
                level, difficulty, frequency
            ) VALUES (
                (item->>'nr')::INTEGER,
                item->>'type',
                item->>'greek_transcription',
                NULLIF(item->>'greek_phonetic', ''),
                NULLIF(item->>'en_translation', ''),
                NULLIF(item->>'en_importance_reason', ''),
                NULLIF(item->>'en_audio_url', ''),
                NULLIF(item->>'de_translation', ''),
                NULLIF(item->>'de_importance_reason', ''),
                NULLIF(item->>'de_audio_url', ''),
                NULLIF(item->>'es_translation', ''),
                NULLIF(item->>'es_importance_reason', ''),
                NULLIF(item->>'es_audio_url', ''),
                NULLIF(item->>'ru_translation', ''),
                NULLIF(item->>'ru_importance_reason', ''),
                NULLIF(item->>'ru_audio_url', ''),
                item->>'level',
                item->>'difficulty',
                COALESCE((item->>'frequency')::INTEGER, 3)
            );
            success_cnt := success_cnt + 1;
        EXCEPTION WHEN OTHERS THEN
            error_cnt := error_cnt + 1;
            error_msg := SQLERRM;
            error_messages := array_append(error_messages, error_msg);
        END;
    END LOOP;

    RETURN QUERY SELECT success_cnt, error_cnt, error_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_bulk_import_multilingual_content IS
    'Bulk import multilingual content from CSV (admin only).';

-- ============================================================================
-- STEP 6: Create RPC function for bulk deleting multilingual content
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_bulk_delete_multilingual_content(
    p_user_id UUID,
    p_content_ids UUID[]
)
RETURNS TABLE(deleted_count INT, error_count INT, errors TEXT[]) AS $$
DECLARE
    content_id UUID;
    deleted_cnt INT := 0;
    error_cnt INT := 0;
    error_messages TEXT[] := '{}';
    error_msg TEXT;
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can delete content';
    END IF;

    -- Loop through IDs
    FOREACH content_id IN ARRAY p_content_ids
    LOOP
        BEGIN
            DELETE FROM multilingual_content WHERE id = content_id;
            deleted_cnt := deleted_cnt + 1;
        EXCEPTION WHEN OTHERS THEN
            error_cnt := error_cnt + 1;
            error_msg := SQLERRM;
            error_messages := array_append(error_messages, error_msg);
        END;
    END LOOP;

    RETURN QUERY SELECT deleted_cnt, error_cnt, error_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_bulk_delete_multilingual_content IS
    'Bulk delete multilingual content items (admin only).';

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION admin_create_multilingual_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_multilingual_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_multilingual_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_import_multilingual_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_delete_multilingual_content TO anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '✅ MIGRATION 083 COMPLETE';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '✅ Dropped old RPC functions for content table';
    RAISE NOTICE '✅ Created 5 new RPC functions for multilingual_content:';
    RAISE NOTICE '   - admin_create_multilingual_content';
    RAISE NOTICE '   - admin_update_multilingual_content';
    RAISE NOTICE '   - admin_delete_multilingual_content';
    RAISE NOTICE '   - admin_bulk_import_multilingual_content';
    RAISE NOTICE '   - admin_bulk_delete_multilingual_content';
    RAISE NOTICE '✅ Granted permissions to anon and authenticated roles';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '   1. Test CRUD operations via API';
    RAISE NOTICE '   2. Test CSV import functionality';
    RAISE NOTICE '   3. Verify admin authorization checks';
    RAISE NOTICE '   4. Update frontend components if needed';
    RAISE NOTICE '';
END $$;

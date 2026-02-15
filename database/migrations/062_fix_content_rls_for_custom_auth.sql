-- ============================================================
-- Fix RLS for content table to work with custom auth
-- ============================================================
-- Problem: content table RLS uses auth.uid() but we use custom
-- PIN-based auth with public.users table
-- Solution: Create RPC functions for CRUD operations that:
-- 1. Take user_id as parameter
-- 2. Check if user is admin in public.users
-- 3. Use SECURITY DEFINER to bypass RLS
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read content" ON content;
DROP POLICY IF EXISTS "Allow admins to insert content" ON content;
DROP POLICY IF EXISTS "Allow admins to update content" ON content;
DROP POLICY IF EXISTS "Allow admins to delete content" ON content;

-- Create new simpler policies
-- 1. Everyone can read content (no auth needed for reading)
CREATE POLICY "Allow all to read content"
    ON content
    FOR SELECT
    USING (true);

-- 2. For Insert/Update/Delete: Use RPC functions instead of direct queries
-- These policies will only allow service_role to modify directly
-- (which our RPC functions will use)

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = p_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Create content (admin only)
CREATE OR REPLACE FUNCTION admin_create_content(
    p_user_id UUID,
    p_type TEXT,
    p_english TEXT,
    p_greek TEXT,
    p_level TEXT,
    p_difficulty TEXT,
    p_phonetic TEXT DEFAULT NULL,
    p_example_en TEXT DEFAULT NULL,
    p_example_gr TEXT DEFAULT NULL,
    p_audio_url TEXT DEFAULT NULL
)
RETURNS content AS $$
DECLARE
    new_content content;
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can create content';
    END IF;

    -- Insert content
    INSERT INTO content (
        type, english, greek, level, difficulty,
        phonetic, example_en, example_gr, audio_url
    ) VALUES (
        p_type, p_english, p_greek, p_level, p_difficulty,
        p_phonetic, p_example_en, p_example_gr, p_audio_url
    ) RETURNING * INTO new_content;

    RETURN new_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update content (admin only)
CREATE OR REPLACE FUNCTION admin_update_content(
    p_user_id UUID,
    p_content_id UUID,
    p_type TEXT,
    p_english TEXT,
    p_greek TEXT,
    p_level TEXT,
    p_difficulty TEXT,
    p_phonetic TEXT DEFAULT NULL,
    p_example_en TEXT DEFAULT NULL,
    p_example_gr TEXT DEFAULT NULL,
    p_audio_url TEXT DEFAULT NULL
)
RETURNS content AS $$
DECLARE
    updated_content content;
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can update content';
    END IF;

    -- Update content
    UPDATE content
    SET
        type = p_type,
        english = p_english,
        greek = p_greek,
        level = p_level,
        difficulty = p_difficulty,
        phonetic = p_phonetic,
        example_en = p_example_en,
        example_gr = p_example_gr,
        audio_url = p_audio_url,
        updated_at = NOW()
    WHERE id = p_content_id
    RETURNING * INTO updated_content;

    IF updated_content IS NULL THEN
        RAISE EXCEPTION 'Content not found';
    END IF;

    RETURN updated_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Delete content (admin only)
CREATE OR REPLACE FUNCTION admin_delete_content(
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
    DELETE FROM content WHERE id = p_content_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_create_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_content TO anon, authenticated;

-- RPC: Bulk import content (admin only)
CREATE OR REPLACE FUNCTION admin_bulk_import_content(
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
            INSERT INTO content (
                type, english, greek, level, difficulty,
                phonetic, example_en, example_gr, audio_url
            ) VALUES (
                item->>'type',
                item->>'english',
                item->>'greek',
                item->>'level',
                item->>'difficulty',
                NULLIF(item->>'phonetic', ''),
                NULLIF(item->>'example_en', ''),
                NULLIF(item->>'example_gr', ''),
                NULLIF(item->>'audio_url', '')
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_bulk_import_content TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION admin_create_content IS 'Create content item (admin only). Takes user_id from custom auth instead of auth.uid()';
COMMENT ON FUNCTION admin_update_content IS 'Update content item (admin only). Takes user_id from custom auth instead of auth.uid()';
COMMENT ON FUNCTION admin_delete_content IS 'Delete content item (admin only). Takes user_id from custom auth instead of auth.uid()';
COMMENT ON FUNCTION admin_bulk_import_content IS 'Bulk import content items from CSV (admin only). Takes user_id from custom auth instead of auth.uid()';

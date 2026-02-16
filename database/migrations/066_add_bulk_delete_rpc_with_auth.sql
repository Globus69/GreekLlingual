-- ============================================================
-- Add RPC function for bulk delete with admin authorization
-- ============================================================
-- Security fix: Ensures only admins can perform bulk delete operations
-- This function checks user permissions before allowing deletion
-- ============================================================

-- RPC: Bulk delete content (admin only)
CREATE OR REPLACE FUNCTION admin_bulk_delete_content(
    p_user_id UUID,
    p_content_ids UUID[]
)
RETURNS TABLE(deleted_count INT, errors TEXT[]) AS $$
DECLARE
    deleted_cnt INT := 0;
    error_messages TEXT[] := '{}';
    content_id UUID;
    error_msg TEXT;
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user(p_user_id) THEN
        RAISE EXCEPTION 'Only admins can bulk delete content';
    END IF;

    -- Validate input
    IF p_content_ids IS NULL OR array_length(p_content_ids, 1) = 0 THEN
        RAISE EXCEPTION 'No content IDs provided';
    END IF;

    IF array_length(p_content_ids, 1) > 100 THEN
        RAISE EXCEPTION 'Cannot delete more than 100 items at once';
    END IF;

    -- Delete each content item
    FOREACH content_id IN ARRAY p_content_ids
    LOOP
        BEGIN
            DELETE FROM content WHERE id = content_id;
            IF FOUND THEN
                deleted_cnt := deleted_cnt + 1;
            ELSE
                error_messages := array_append(
                    error_messages,
                    'Content not found: ' || content_id::TEXT
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_msg := SQLERRM;
            error_messages := array_append(
                error_messages,
                'Error deleting ' || content_id::TEXT || ': ' || error_msg
            );
        END;
    END LOOP;

    RETURN QUERY SELECT deleted_cnt, error_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_bulk_delete_content TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION admin_bulk_delete_content IS 'Bulk delete content items (admin only). Takes user_id from custom auth instead of auth.uid(). Max 100 items per call.';

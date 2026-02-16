-- ============================================================================
-- Migration 069: Create RPC for Practice-Enabled Items (Cache Bypass)
-- ============================================================================
-- Date: 2026-02-16
-- Purpose: Bypass Supabase PostgREST cache issues with filter-based queries
-- Related: TROUBLESHOOTING-Practice-Modes.md, IMPROVMENT-16-02-25.md
-- ============================================================================

-- Create RPC function to get practice-enabled items
-- This bypasses PostgREST cache and ensures fresh data
CREATE OR REPLACE FUNCTION get_practice_enabled_items()
RETURNS TABLE (
    id UUID,
    english TEXT,
    greek TEXT,
    level TEXT,
    difficulty TEXT,
    practice_modes_config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        li.id,
        li.english,
        li.greek,
        li.level,
        li.difficulty,
        li.practice_modes_config
    FROM learning_items li
    WHERE li.practice_modes_config IS NOT NULL
      AND li.practice_modes_config->>'enabled' = 'true'
      AND (li.practice_modes_config->'available_modes')::jsonb != '[]'::jsonb
    ORDER BY li.id ASC
    LIMIT 50;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_practice_enabled_items() TO authenticated;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Test the function (should return 5 items: Hello x3, Thank you, Water)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM get_practice_enabled_items();

    IF v_count > 0 THEN
        RAISE NOTICE '✅ RPC function works! Found % practice-enabled items', v_count;
    ELSE
        RAISE NOTICE '⚠️  RPC function created but no items found. Check practice_modes_config data.';
    END IF;
END $$;

-- Show sample results
SELECT id, english, practice_modes_config->>'enabled' as enabled
FROM get_practice_enabled_items()
LIMIT 5;

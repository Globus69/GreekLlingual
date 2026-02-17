-- ============================================================================
-- TEMPORARY FIX: Unlock ALL Practice Modes for Testing
-- ============================================================================
-- Date: 17. Februar 2026
-- Purpose: Set activation_threshold = 0 for all practice-enabled items
--          This unlocks all modes immediately for testing
-- ============================================================================

UPDATE learning_items
SET practice_modes_config = jsonb_set(
    practice_modes_config,
    '{activation_threshold}',
    '0'::jsonb
)
WHERE practice_modes_config->>'enabled' = 'true';

-- Verify the update
SELECT
    id,
    english,
    practice_modes_config->>'enabled' as enabled,
    practice_modes_config->>'activation_threshold' as threshold,
    practice_modes_config->'available_modes' as modes
FROM learning_items
WHERE practice_modes_config->>'enabled' = 'true';

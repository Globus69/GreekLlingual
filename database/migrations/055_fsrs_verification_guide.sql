-- ============================================================================
-- FSRS-6 Database Migration - Verification Guide
-- ============================================================================
-- ⚠️ DO NOT EXECUTE THIS ENTIRE FILE! ⚠️
--
-- This file contains verification queries to check if migrations 052-054
-- were executed correctly.
--
-- Usage:
-- 1. Copy individual queries below
-- 2. Replace placeholders like 'YOUR_USER_ID' with actual values
-- 3. Run queries one by one in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Verify FSRS fields were added to learning_items
-- ============================================================================
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'learning_items'
  AND column_name LIKE 'fsrs_%' OR column_name = 'phonetic'
ORDER BY column_name;

-- Expected: 8 columns (fsrs_difficulty, fsrs_stability, fsrs_last_review, fsrs_due, fsrs_reps, fsrs_lapses, fsrs_state, phonetic)

-- ============================================================================
-- 2. Verify fsrs_review_logs table exists
-- ============================================================================
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fsrs_review_logs'
ORDER BY ordinal_position;

-- Expected: 11 columns (id, user_id, card_id, rating, review_time, interval_days, old_difficulty, old_stability, new_difficulty, new_stability, created_at)

-- ============================================================================
-- 3. Verify indexes were created
-- ============================================================================
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'learning_items' OR tablename = 'fsrs_review_logs')
  AND indexname LIKE '%fsrs%'
ORDER BY tablename, indexname;

-- Expected: 7 indexes total (3 on learning_items, 4 on fsrs_review_logs)

-- ============================================================================
-- 4. Verify CHECK constraints
-- ============================================================================
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.learning_items'::regclass
  AND conname LIKE '%fsrs%'
ORDER BY conname;

-- Expected: 3 constraints (fsrs_state, fsrs_difficulty, fsrs_stability)

-- ============================================================================
-- 5. Verify RPC functions exist
-- ============================================================================
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%fsrs%'
ORDER BY routine_name;

-- Expected: 3 functions (get_due_cards_fsrs, update_card_fsrs, get_fsrs_stats)

-- ============================================================================
-- 6. Test get_due_cards_fsrs function
-- ============================================================================
-- ⚠️ Replace 'YOUR_USER_ID' with actual user UUID before running!
-- Example:
/*
SELECT * FROM get_due_cards_fsrs(
    'YOUR_USER_ID'::UUID,  -- p_user_id (replace with actual UUID)
    'A1',                   -- p_level (or NULL for all levels)
    10                      -- p_limit
);
*/

-- Expected: Returns cards that are due for review

-- ============================================================================
-- 7. Sample data check
-- ============================================================================
SELECT 
    id,
    type,
    english,
    greek,
    fsrs_difficulty,
    fsrs_stability,
    fsrs_state,
    fsrs_due
FROM public.learning_items
WHERE type IN ('vocabulary', 'daily-phrases')
LIMIT 5;

-- Expected: Shows existing cards with FSRS default values

-- ============================================================================
-- 8. Check RLS policies
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'fsrs_review_logs'
ORDER BY policyname;

-- Expected: 2 policies (SELECT and INSERT for users)

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- ✅ All 8 FSRS columns exist in learning_items
-- ✅ fsrs_review_logs table created with 11 columns
-- ✅ 7 indexes created (3 + 4)
-- ✅ 3 CHECK constraints on learning_items
-- ✅ 3 RPC functions created
-- ✅ 2 RLS policies on fsrs_review_logs
-- ✅ Sample queries return data without errors

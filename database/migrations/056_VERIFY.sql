-- Verification Queries for Migration 056
-- Run these in Supabase SQL Editor to check if migration worked

-- ============================================================================
-- Query 1: Check if student_progress table exists
-- ============================================================================
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'student_progress'
) AS table_exists;

-- Expected: true


-- ============================================================================
-- Query 2: List all columns in student_progress
-- ============================================================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_progress'
ORDER BY ordinal_position;

-- Expected: Should show id, item_id, student_id, correct_count, attempts,
--           AND the 9 FSRS columns (fsrs_difficulty, fsrs_stability, etc.)


-- ============================================================================
-- Query 3: Check specifically for the columns dashboard needs
-- ============================================================================
SELECT
    EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'student_progress'
            AND column_name = 'correct_count') AS has_correct_count,
    EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'student_progress'
            AND column_name = 'attempts') AS has_attempts,
    EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'student_progress'
            AND column_name = 'student_id') AS has_student_id;

-- Expected: All three should be true


-- ============================================================================
-- Query 4: Check if FSRS columns were added
-- ============================================================================
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_progress'
  AND column_name LIKE 'fsrs_%'
ORDER BY column_name;

-- Expected: 9 rows (fsrs_difficulty, fsrs_due, fsrs_elapsed_days,
--                    fsrs_lapses, fsrs_last_review, fsrs_reps,
--                    fsrs_scheduled_days, fsrs_stability, fsrs_state)


-- ============================================================================
-- Query 5: Count rows in student_progress
-- ============================================================================
SELECT COUNT(*) AS total_rows
FROM public.student_progress;

-- Expected: 0 or more (may be empty for new database)


-- ============================================================================
-- Query 6: Test the actual dashboard query
-- ============================================================================
-- Replace 'YOUR_USER_ID' with your actual user UUID
-- Get it from: SELECT id, name FROM public.users WHERE role = 'student';

SELECT correct_count, attempts
FROM public.student_progress
WHERE student_id = 'YOUR_USER_ID';

-- Expected: Empty result (0 rows) OR actual data
-- Should NOT give error 400

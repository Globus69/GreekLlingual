-- ============================================================================
-- Session Tracking System - Test Script
-- ============================================================================
-- Purpose: Verify that session tracking is working correctly
-- Date: 2026-02-15
-- Usage: Run this in Supabase SQL Editor to test session tracking
-- ============================================================================

-- PREREQUISITE: Replace 'YOUR-USER-ID-HERE' with your actual user UUID
-- You can get your user ID from the users table or from the app console

-- ============================================================================
-- 1. Check if table exists
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'learning_sessions'
    ) THEN
        RAISE NOTICE '✅ learning_sessions table exists';
    ELSE
        RAISE EXCEPTION '❌ learning_sessions table NOT FOUND. Please run migration 059 first.';
    END IF;
END $$;

-- ============================================================================
-- 2. Check if RPC functions exist
-- ============================================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc
    WHERE proname IN (
        'start_learning_session',
        'end_learning_session',
        'get_session_stats',
        'get_recent_sessions'
    );

    IF v_count = 4 THEN
        RAISE NOTICE '✅ All 4 RPC functions exist';
    ELSE
        RAISE EXCEPTION '❌ Missing RPC functions. Found % of 4. Please run migration 059.', v_count;
    END IF;
END $$;

-- ============================================================================
-- 3. Test: Start a learning session
-- ============================================================================
-- IMPORTANT: Replace 'YOUR-USER-ID-HERE' with your actual UUID

DO $$
DECLARE
    v_user_id UUID := 'YOUR-USER-ID-HERE'; -- ⚠️ REPLACE THIS
    v_session_id UUID;
BEGIN
    -- Start session
    v_session_id := start_learning_session(v_user_id, 'vocabulary');

    IF v_session_id IS NOT NULL THEN
        RAISE NOTICE '✅ Session started successfully: %', v_session_id;
        RAISE NOTICE '   User ID: %', v_user_id;
        RAISE NOTICE '   Type: vocabulary';

        -- Store session ID for next test (you'll need to copy this)
        RAISE NOTICE '';
        RAISE NOTICE '📋 COPY THIS SESSION ID for the next test:';
        RAISE NOTICE '   %', v_session_id;
    ELSE
        RAISE EXCEPTION '❌ Failed to start session';
    END IF;
END $$;

-- ============================================================================
-- 4. View your active sessions
-- ============================================================================
-- IMPORTANT: Replace 'YOUR-USER-ID-HERE' with your actual UUID

SELECT
    id AS session_id,
    session_type,
    started_at,
    ended_at,
    duration_seconds,
    cards_reviewed,
    cards_correct,
    completed
FROM learning_sessions
WHERE student_id = 'YOUR-USER-ID-HERE' -- ⚠️ REPLACE THIS
ORDER BY started_at DESC
LIMIT 5;

-- ============================================================================
-- 5. Test: End the learning session
-- ============================================================================
-- IMPORTANT: Replace 'YOUR-SESSION-ID-HERE' with the session ID from step 3

SELECT * FROM end_learning_session(
    'YOUR-SESSION-ID-HERE'::UUID, -- ⚠️ REPLACE THIS with session ID from step 3
    10,  -- cards_reviewed
    8    -- cards_correct (80% accuracy)
);

-- Expected output:
-- session_id | duration_seconds | duration_minutes
-- -----------|------------------|------------------
-- [uuid]     | 30               | 0.5

-- ============================================================================
-- 6. Verify session was updated
-- ============================================================================
-- Check that the session now has ended_at and duration_seconds

SELECT
    id AS session_id,
    session_type,
    started_at,
    ended_at,
    duration_seconds,
    ROUND((duration_seconds / 60.0)::NUMERIC, 1) AS duration_minutes,
    cards_reviewed,
    cards_correct,
    CASE
        WHEN cards_reviewed > 0
        THEN ROUND((cards_correct::NUMERIC / cards_reviewed::NUMERIC) * 100, 1)
        ELSE 0
    END AS accuracy_percentage,
    completed
FROM learning_sessions
WHERE id = 'YOUR-SESSION-ID-HERE'::UUID; -- ⚠️ REPLACE THIS

-- Expected:
-- - ended_at: Should have a timestamp
-- - duration_seconds: Should be > 0
-- - duration_minutes: Should match (duration_seconds / 60)
-- - cards_reviewed: 10
-- - cards_correct: 8
-- - accuracy_percentage: 80.0
-- - completed: true

-- ============================================================================
-- 7. Test: Get session statistics
-- ============================================================================
-- Get aggregated stats for last 30 days

SELECT * FROM get_session_stats(
    'YOUR-USER-ID-HERE'::UUID, -- ⚠️ REPLACE THIS
    30  -- last 30 days
);

-- Expected output:
-- total_sessions | total_time_minutes | avg_session_minutes | total_cards_reviewed | ...
-- ---------------|--------------------|--------------------|---------------------|-----
-- 1              | 0                  | 0.5                | 10                   | ...

-- ============================================================================
-- 8. Test: Get recent sessions
-- ============================================================================
-- Get last 10 completed sessions

SELECT * FROM get_recent_sessions(
    'YOUR-USER-ID-HERE'::UUID, -- ⚠️ REPLACE THIS
    10  -- limit
);

-- Expected: List of recent sessions with duration and stats

-- ============================================================================
-- 9. Create multiple test sessions
-- ============================================================================
-- This creates 3 test sessions with different types and stats

DO $$
DECLARE
    v_user_id UUID := 'YOUR-USER-ID-HERE'::UUID; -- ⚠️ REPLACE THIS
    v_session_id UUID;
    v_session_types TEXT[] := ARRAY['vocabulary', 'grammar', 'daily_phrases'];
    v_type TEXT;
    v_reviewed INTEGER;
    v_correct INTEGER;
BEGIN
    FOREACH v_type IN ARRAY v_session_types
    LOOP
        -- Start session
        v_session_id := start_learning_session(v_user_id, v_type);
        RAISE NOTICE 'Started session: % (type: %)', v_session_id, v_type;

        -- Wait a bit (simulate study time)
        PERFORM pg_sleep(2); -- 2 seconds

        -- Random stats
        v_reviewed := 5 + (random() * 15)::INTEGER; -- 5-20 cards
        v_correct := (v_reviewed * (0.6 + random() * 0.3))::INTEGER; -- 60-90% accuracy

        -- End session
        PERFORM end_learning_session(v_session_id, v_reviewed, v_correct);
        RAISE NOTICE 'Ended session: % (reviewed: %, correct: %)', v_session_id, v_reviewed, v_correct;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Created 3 test sessions';
END $$;

-- ============================================================================
-- 10. View all your sessions with formatted output
-- ============================================================================
SELECT
    session_type AS "Type",
    TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI') AS "Started",
    CASE
        WHEN duration_seconds < 60 THEN duration_seconds || 's'
        WHEN duration_seconds < 3600 THEN
            FLOOR(duration_seconds / 60) || 'm ' ||
            (duration_seconds % 60) || 's'
        ELSE
            FLOOR(duration_seconds / 3600) || 'h ' ||
            FLOOR((duration_seconds % 3600) / 60) || 'm'
    END AS "Duration",
    cards_reviewed AS "Cards",
    cards_correct AS "Correct",
    CASE
        WHEN cards_reviewed > 0
        THEN ROUND((cards_correct::NUMERIC / cards_reviewed::NUMERIC) * 100, 1) || '%'
        ELSE '0%'
    END AS "Accuracy",
    CASE WHEN completed THEN '✅' ELSE '⏳' END AS "Status"
FROM learning_sessions
WHERE student_id = 'YOUR-USER-ID-HERE'::UUID -- ⚠️ REPLACE THIS
ORDER BY started_at DESC
LIMIT 20;

-- ============================================================================
-- 11. Summary Statistics
-- ============================================================================
WITH stats AS (
    SELECT
        COUNT(*) AS total_sessions,
        SUM(duration_seconds) AS total_seconds,
        AVG(duration_seconds) AS avg_seconds,
        SUM(cards_reviewed) AS total_cards,
        SUM(cards_correct) AS total_correct,
        MAX(duration_seconds) AS longest_session,
        MIN(duration_seconds) AS shortest_session
    FROM learning_sessions
    WHERE student_id = 'YOUR-USER-ID-HERE'::UUID -- ⚠️ REPLACE THIS
      AND completed = true
)
SELECT
    total_sessions AS "Total Sessions",
    FLOOR(total_seconds / 60) || 'm' AS "Total Time",
    FLOOR(avg_seconds / 60) || 'm' AS "Avg Time/Session",
    total_cards AS "Total Cards",
    total_correct AS "Total Correct",
    ROUND((total_correct::NUMERIC / total_cards::NUMERIC) * 100, 1) || '%' AS "Overall Accuracy",
    FLOOR(longest_session / 60) || 'm' AS "Longest Session",
    FLOOR(shortest_session / 60) || 'm' AS "Shortest Session"
FROM stats;

-- ============================================================================
-- 12. Cleanup: Delete test sessions (optional)
-- ============================================================================
-- Uncomment to delete all test sessions created in this script

/*
DELETE FROM learning_sessions
WHERE student_id = 'YOUR-USER-ID-HERE'::UUID -- ⚠️ REPLACE THIS
  AND started_at > NOW() - INTERVAL '5 minutes';

RAISE NOTICE '✅ Test sessions deleted';
*/

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- If all tests pass, you should see:
-- ✅ Table exists
-- ✅ Functions exist
-- ✅ Session started successfully
-- ✅ Session ended with duration > 0
-- ✅ Stats show at least 1 session
-- ✅ Recent sessions query returns data
-- ✅ Test sessions created successfully
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==================================================';
    RAISE NOTICE '🎉  SESSION TRACKING TEST COMPLETE';
    RAISE NOTICE '🎉 ==================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ If you see no errors above, session tracking is working!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Next steps:';
    RAISE NOTICE '   1. Test from the app (open a learning dialog)';
    RAISE NOTICE '   2. Check browser console for session logs';
    RAISE NOTICE '   3. Query database to verify sessions were recorded';
    RAISE NOTICE '';
END $$;

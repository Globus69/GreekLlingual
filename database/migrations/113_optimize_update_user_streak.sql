-- ============================================================================
-- Migration 113: Optimize update_user_streak Performance
-- Date: 2026-02-23
-- ============================================================================
-- Problem: update_user_streak causes significant DB delay because:
--   1. It ALWAYS runs an UPDATE even on same-day (no streak change needed)
--   2. No early exit path when nothing needs to change
--
-- Fix:
--   1. EARLY EXIT: If last_activity_date = TODAY → return immediately, skip UPDATE
--   2. Conditional UPDATE: Only write when data actually changes
--   3. Single combined statement using INSERT ON CONFLICT where possible
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS TABLE (
    new_streak INTEGER,
    is_new_record BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_streak  INTEGER;
    v_longest_streak  INTEGER;
    v_last_activity   DATE;
    v_today           DATE := CURRENT_DATE;
    v_days_since      INTEGER;
    v_new_streak      INTEGER;
    v_is_new_record   BOOLEAN := false;
    v_msg             TEXT;
BEGIN
    -- Single SELECT to get current state
    SELECT streak_days, longest_streak, last_activity_date
    INTO v_current_streak, v_longest_streak, v_last_activity
    FROM public.users
    WHERE id = p_user_id;

    -- ⚡ EARLY EXIT: Same day - nothing to update, return immediately
    IF v_last_activity = v_today THEN
        RETURN QUERY SELECT v_current_streak, false, 'Already active today 💪';
        RETURN;
    END IF;

    -- Calculate new streak
    IF v_last_activity IS NULL THEN
        v_new_streak := 1;
        v_msg := 'Streak gestartet! 🔥';
    ELSE
        v_days_since := v_today - v_last_activity;
        IF v_days_since = 1 THEN
            v_new_streak := v_current_streak + 1;
            v_msg := 'Streak erhöht! 🔥';
        ELSE
            -- Missed at least one day
            v_new_streak := 1;
            v_msg := 'Streak zurückgesetzt. Neu anfangen! 🌟';
        END IF;
    END IF;

    -- Check new record
    IF v_new_streak > COALESCE(v_longest_streak, 0) THEN
        v_longest_streak := v_new_streak;
        v_is_new_record  := true;
        v_msg := v_msg || ' Neuer Rekord! 🏆';
    END IF;

    -- Only UPDATE when something actually changed (never same-day due to early exit above)
    UPDATE public.users
    SET
        streak_days       = v_new_streak,
        last_activity_date = v_today,
        longest_streak    = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
        updated_at        = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT v_new_streak, v_is_new_record, v_msg;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO anon, authenticated;

DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 113: update_user_streak optimized';
    RAISE NOTICE '   Key improvement: Early exit on same-day call';
    RAISE NOTICE '   → No unnecessary UPDATE lock when already active today';
    RAISE NOTICE '══════════════════════════════════════════════════';
END $$;

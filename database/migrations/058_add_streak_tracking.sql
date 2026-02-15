-- Migration 058: Add Streak Tracking to Users
-- Date: 2026-02-15
-- Purpose: Track consecutive days of learning for gamification

DO $$
BEGIN
    -- Add streak_days column (consecutive days of learning)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'streak_days'
    ) THEN
        ALTER TABLE public.users
            ADD COLUMN streak_days INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added streak_days column to users';
    ELSE
        RAISE NOTICE 'streak_days column already exists';
    END IF;

    -- Add last_activity_date (when user last studied)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'last_activity_date'
    ) THEN
        ALTER TABLE public.users
            ADD COLUMN last_activity_date DATE;
        RAISE NOTICE 'Added last_activity_date column to users';
    ELSE
        RAISE NOTICE 'last_activity_date column already exists';
    END IF;

    -- Add longest_streak (for achievements/stats)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'longest_streak'
    ) THEN
        ALTER TABLE public.users
            ADD COLUMN longest_streak INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added longest_streak column to users';
    ELSE
        RAISE NOTICE 'longest_streak column already exists';
    END IF;

    RAISE NOTICE '✅ Streak tracking columns added to users table';
END $$;

-- ============================================================================
-- Function: Update User Streak
-- ============================================================================
-- Call this function whenever user completes a learning activity
-- It will automatically maintain streak based on last activity date

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
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_last_activity DATE;
    v_today DATE := CURRENT_DATE;
    v_days_since_activity INTEGER;
    v_new_streak INTEGER;
    v_is_new_record BOOLEAN := false;
    v_message TEXT;
BEGIN
    -- Get current user data
    SELECT streak_days, longest_streak, last_activity_date
    INTO v_current_streak, v_longest_streak, v_last_activity
    FROM public.users
    WHERE id = p_user_id;

    -- If no previous activity, start streak at 1
    IF v_last_activity IS NULL THEN
        v_new_streak := 1;
        v_message := 'Streak started! 🔥';
    ELSE
        -- Calculate days since last activity
        v_days_since_activity := v_today - v_last_activity;

        CASE
            -- Same day - no change to streak
            WHEN v_days_since_activity = 0 THEN
                v_new_streak := v_current_streak;
                v_message := 'Keep going today! 💪';

            -- Next day - increment streak
            WHEN v_days_since_activity = 1 THEN
                v_new_streak := v_current_streak + 1;
                v_message := 'Streak increased! 🔥';

            -- Missed days - reset to 1
            ELSE
                v_new_streak := 1;
                v_message := 'Streak reset. Start fresh! 🌟';
        END CASE;
    END IF;

    -- Check if new record
    IF v_new_streak > v_longest_streak THEN
        v_longest_streak := v_new_streak;
        v_is_new_record := true;
        v_message := v_message || ' New record! 🏆';
    END IF;

    -- Update user
    UPDATE public.users
    SET
        streak_days = v_new_streak,
        last_activity_date = v_today,
        longest_streak = v_longest_streak,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Return results
    RETURN QUERY SELECT v_new_streak, v_is_new_record, v_message;
END;
$$;

-- ============================================================================
-- Function: Get User Streak Info
-- ============================================================================
-- Returns streak information for display in dashboard

CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    last_activity DATE,
    streak_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_streak INTEGER;
    v_longest INTEGER;
    v_last_activity DATE;
    v_today DATE := CURRENT_DATE;
    v_days_since INTEGER;
    v_status TEXT;
BEGIN
    -- Get user data
    SELECT streak_days, users.longest_streak, last_activity_date
    INTO v_streak, v_longest, v_last_activity
    FROM public.users
    WHERE id = p_user_id;

    -- Determine status
    IF v_last_activity IS NULL THEN
        v_status := 'inactive';
    ELSE
        v_days_since := v_today - v_last_activity;
        CASE
            WHEN v_days_since = 0 THEN v_status := 'active_today';
            WHEN v_days_since = 1 THEN v_status := 'at_risk';
            ELSE v_status := 'broken';
        END CASE;
    END IF;

    -- Return results
    RETURN QUERY SELECT v_streak, v_longest, v_last_activity, v_status;
END;
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Streak tracking system created successfully';
    RAISE NOTICE '   - 3 columns added: streak_days, last_activity_date, longest_streak';
    RAISE NOTICE '   - 2 RPC functions created:';
    RAISE NOTICE '     • update_user_streak() - Call after learning activity';
    RAISE NOTICE '     • get_user_streak() - Fetch streak info for dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Usage:';
    RAISE NOTICE '   SELECT * FROM update_user_streak(''user-uuid'');';
    RAISE NOTICE '   SELECT * FROM get_user_streak(''user-uuid'');';
END $$;

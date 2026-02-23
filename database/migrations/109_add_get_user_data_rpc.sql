-- Migration 109: Add RPC function to fetch user data safely
-- Date: 2026-02-23
-- Purpose: Allow students (anon users) to refresh their own data without RLS restrictions on the users table.

CREATE OR REPLACE FUNCTION get_user_data(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    level TEXT,
    difficulty TEXT,
    performance_index TEXT,
    preferred_locale TEXT,
    acknowledged_manual_version TEXT,
    acknowledged_swipe_tutorial_version TEXT,
    streak_days INTEGER,
    longest_streak INTEGER,
    last_activity_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id, u.name, u.email, u.role, u.level, u.difficulty, 
        u.performance_index, u.preferred_locale, 
        u.acknowledged_manual_version, u.acknowledged_swipe_tutorial_version,
        u.streak_days, u.longest_streak, u.last_activity_date
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to both anon and authenticated
GRANT EXECUTE ON FUNCTION get_user_data(UUID) TO anon, authenticated;

COMMENT ON FUNCTION get_user_data IS 'Fetches public user profile data. SECURITY DEFINER bypasses RLS to allow students to refresh their own profile.';

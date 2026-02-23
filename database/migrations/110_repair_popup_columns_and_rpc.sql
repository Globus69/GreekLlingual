-- Migration 110: Repair Popup Columns and RPCs
-- Date: 2026-02-23
-- Purpose: Ensure all necessary columns exist and RPCs are correctly defined to fix the "column does not exist" error.

-- 1. Ensure columns exist in users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS acknowledged_manual_version TEXT DEFAULT '0.0.0';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS acknowledged_swipe_tutorial_version TEXT DEFAULT '0.0.0';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 2. Repair update_user_metadata RPC (Security Definer)
CREATE OR REPLACE FUNCTION update_user_metadata(
    p_user_id UUID,
    p_manual_version TEXT DEFAULT NULL,
    p_swipe_version TEXT DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE public.users SET
        acknowledged_manual_version = COALESCE(p_manual_version, acknowledged_manual_version),
        acknowledged_swipe_tutorial_version = COALESCE(p_swipe_version, acknowledged_swipe_tutorial_version),
        device_fingerprint = COALESCE(p_fingerprint, device_fingerprint),
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Repair get_user_data RPC (Security Definer)
-- This version is more robust and handles missing values gracefully
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
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.level, 
        u.difficulty, 
        u.performance_index, 
        u.preferred_locale, 
        u.acknowledged_manual_version, 
        u.acknowledged_swipe_tutorial_version,
        u.streak_days, 
        u.longest_streak, 
        u.last_activity_date
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-grant permissions
GRANT EXECUTE ON FUNCTION update_user_metadata TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_data TO anon, authenticated;

-- 5. Final check/comment
COMMENT ON FUNCTION get_user_data IS 'Bypasses RLS to allow students to sync their profile data including popup versions.';

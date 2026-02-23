-- Migration 108: Add RPC function for updating user metadata (acknowledgments & fingerprint)
-- Date: 2026-02-23
-- Purpose: Allow students/admins to update their own acknowledgment state for popups without RLS issues.

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

-- Grant permissions to both anon and authenticated
GRANT EXECUTE ON FUNCTION update_user_metadata TO anon, authenticated;

COMMENT ON FUNCTION update_user_metadata IS 'Updates non-sensitive user metadata like popup version acknowledgments and device fingerprints. SECURITY DEFINER bypasses RLS to allow students (who are anon in Supabase) to persist these settings.';

-- Migration: 076_fix_is_pin_taken_for_students.sql
-- Description: Update is_pin_taken to check 'pin' field (for 4-digit student PINs)
-- Date: 2026-02-19

-- Update is_pin_taken to check 'pin' field instead of 'pin_4digit'
CREATE OR REPLACE FUNCTION is_pin_taken(p_pin TEXT, p_exclude_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE pin = p_pin
          AND (p_exclude_user_id IS NULL OR id != p_exclude_user_id)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION is_pin_taken(TEXT, UUID) TO anon, authenticated;

-- Migration 076 completed

-- ============================================================================
-- RESET SCRIPT: User 2098 (Lukas Braun)
-- ============================================================================
-- User-ID: 1c14edac-0fd8-4a6d-9163-ccd2a59d82b4
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID := '1c14edac-0fd8-4a6d-9163-ccd2a59d82b4';
BEGIN
    RAISE NOTICE '🚀 Starte Reset für User 2098...';

    -- 1. Lösche alle Fortschrittsdaten
    DELETE FROM public.fsrs_review_logs WHERE user_id = v_user_id;
    DELETE FROM public.user_vocabulary_progress WHERE user_id = v_user_id;
    DELETE FROM public.student_progress WHERE student_id = v_user_id;
    DELETE FROM public.learning_sessions WHERE student_id = v_user_id;
    DELETE FROM public.practice_attempts WHERE user_id = v_user_id;

    -- 2. Setze User-Profil in der 'users' Tabelle zurück
    UPDATE public.users
    SET 
        streak_days = 0,
        longest_streak = 0,
        last_activity_date = NULL,
        level = 'A1',
        difficulty = 'easy',
        performance_index = 'A1-easy'
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Reset erfolgreich abgeschlossen.';
END $$;

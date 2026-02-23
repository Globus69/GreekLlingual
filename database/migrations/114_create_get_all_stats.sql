-- ============================================================================
-- Migration 114: Consolidated get_all_stats RPC
-- Date: 2026-02-23
-- ============================================================================
-- Problem: use-stats-data.ts fired 11 parallel DB calls per stats load,
--   including 4 zombie calls (non-existent tables/functions) and
--   1 duplicate get_user_streak call.
--
-- Fix: Single JSONB-returning function that aggregates all required stats
--   in one DB round-trip:
--   • Streak + Level         → FROM public.users  (1 row lookup)
--   • Due Count              → FROM student_progress WHERE next_review <= NOW()
--   • Total Words            → FROM student_progress WHERE correct_count > 0
--   • Total Correct          → SUM(correct_count) → mastery_progress %
--   • Weak Count             → accuracy < 60%
--   • Review Count           → items with scheduled next_review
--   • Progress Overview      → calls existing get_progress_overview RPC
--   • Learning Trends        → calls existing get_learning_trends RPC
--   • Weekly Activity        → calls existing get_weekly_activity RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_all_stats(
    p_user_id UUID,
    p_days    INTEGER DEFAULT 30,
    p_weeks   INTEGER DEFAULT 4
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_streak         INTEGER := 0;
    v_level          TEXT    := 'A1';
    -- Total variables (student_progress + user_vocabulary_progress)
    v_total_words   INTEGER := 0;
    v_sp_words      INTEGER := 0;
    v_uvp_words     INTEGER := 0;

    v_total_correct INTEGER := 0;

    v_due_count     INTEGER := 0;
    v_sp_due        INTEGER := 0;
    v_uvp_due       INTEGER := 0;

    v_weak_count    INTEGER := 0;
    v_review_count  INTEGER := 0;
    v_mastery_pct    INTEGER := 0;
    v_progress       JSONB;
    v_trends         JSONB;
    v_weekly         JSONB;
BEGIN
    -- ── 1. Single users row lookup (streak + level) ──────────────────────────
    SELECT
        COALESCE(streak_days, 0),
        COALESCE(level, 'A1')
    INTO v_streak, v_level
    FROM public.users
    WHERE id = p_user_id;

    -- ── 2a. student_progress aggregates (Phrases & Lessons) ───────────────
    SELECT
        COUNT(*) FILTER (WHERE next_review IS NOT NULL AND next_review <= NOW()),
        COUNT(*) FILTER (WHERE correct_count > 0),
        COALESCE(SUM(correct_count) FILTER (WHERE correct_count > 0), 0)
    INTO
        v_sp_due,
        v_sp_words,
        v_total_correct
    FROM public.student_progress
    WHERE student_id = p_user_id;

    -- ── 2b. user_vocabulary_progress aggregates (Vocabulary) ───────────────
    SELECT
        COUNT(*) FILTER (WHERE fsrs_due IS NOT NULL AND fsrs_due <= NOW()),
        COUNT(*) FILTER (WHERE fsrs_reps > 0)
    INTO
        v_uvp_due,
        v_uvp_words
    FROM public.user_vocabulary_progress
    WHERE user_id = p_user_id;

    -- Combine the counts
    v_due_count := v_sp_due + v_uvp_due;
    v_total_words := v_sp_words + v_uvp_words;

    -- ── 2c. Fetch Weak and Review counts exactly as the UI previously did ──
    v_weak_count := public.get_weak_vocabulary_count(p_user_id);
    v_review_count := public.get_review_vocabulary_count(p_user_id);

    -- Mastery progress: correct answers out of 120-word target (capped at 100%)
    v_mastery_pct := LEAST(100, ROUND(v_total_correct * 100.0 / 120)::INTEGER);

    -- ── 3. Progress Overview (existing RPC) ───────────────────────────────────
    SELECT row_to_json(t)::JSONB
    INTO v_progress
    FROM public.get_progress_overview(p_user_id, p_days) t
    LIMIT 1;

    -- ── 4. Learning Trends (existing RPC) ────────────────────────────────────
    SELECT COALESCE(json_agg(t)::JSONB, '[]'::JSONB)
    INTO v_trends
    FROM public.get_learning_trends(p_user_id, 7) t;

    -- ── 5. Weekly Activity (existing RPC) ────────────────────────────────────
    SELECT COALESCE(json_agg(t)::JSONB, '[]'::JSONB)
    INTO v_weekly
    FROM public.get_weekly_activity(p_user_id, p_weeks) t;

    -- ── 6. Build and return the consolidated result ───────────────────────────
    RETURN jsonb_build_object(
        'streak',          v_streak,
        'level',           v_level,
        'due_count',       v_due_count,
        'total_words',     v_total_words,
        'total_correct',   v_total_correct,
        'mastery_progress',v_mastery_pct,
        'weak_count',      v_weak_count,
        'review_count',    v_review_count,
        'progress',        v_progress,
        'trends',          v_trends,
        'weekly',          v_weekly
    );
END;
$$;

-- Grant access to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_all_stats(UUID, INTEGER, INTEGER) TO anon, authenticated;

DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 114: get_all_stats created';
    RAISE NOTICE '   Consolidates 11 parallel DB calls → 1 RPC round-trip';
    RAISE NOTICE '   Eliminates 4 zombie calls + 1 duplicate streak call';
    RAISE NOTICE '   Adds mastery_progress %% calculation server-side';
    RAISE NOTICE '══════════════════════════════════════════════════════════';
END $$;

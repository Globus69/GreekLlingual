-- Migration 059: Add Session Time Tracking
-- Date: 2026-02-15
-- Purpose: Track learning session duration for analytics and stats

-- ============================================================================
-- Create learning_sessions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    session_type TEXT NOT NULL,  -- 'vocabulary', 'grammar', 'comprehension', 'listening'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,  -- Calculated when session ends
    cards_reviewed INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_sessions_student_id
    ON public.learning_sessions (student_id);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_started_at
    ON public.learning_sessions (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_student_started
    ON public.learning_sessions (student_id, started_at DESC);

-- Enable RLS
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can only see their own sessions
CREATE POLICY "Students see own sessions"
    ON public.learning_sessions
    FOR SELECT
    USING (student_id = auth.uid() OR student_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Students can insert their own sessions
CREATE POLICY "Students insert own sessions"
    ON public.learning_sessions
    FOR INSERT
    WITH CHECK (student_id = auth.uid() OR student_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Students can update their own sessions
CREATE POLICY "Students update own sessions"
    ON public.learning_sessions
    FOR UPDATE
    USING (student_id = auth.uid() OR student_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================================
-- Function: Start Learning Session
-- ============================================================================
CREATE OR REPLACE FUNCTION start_learning_session(
    p_student_id UUID,
    p_session_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Create new session
    INSERT INTO public.learning_sessions (student_id, session_type, started_at)
    VALUES (p_student_id, p_session_type, NOW())
    RETURNING id INTO v_session_id;

    RAISE NOTICE 'Session started: %', v_session_id;
    RETURN v_session_id;
END;
$$;

-- ============================================================================
-- Function: End Learning Session
-- ============================================================================
CREATE OR REPLACE FUNCTION end_learning_session(
    p_session_id UUID,
    p_cards_reviewed INTEGER DEFAULT 0,
    p_cards_correct INTEGER DEFAULT 0
)
RETURNS TABLE (
    session_id UUID,
    duration_seconds INTEGER,
    duration_minutes NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_started_at TIMESTAMPTZ;
    v_ended_at TIMESTAMPTZ;
    v_duration_seconds INTEGER;
    v_duration_minutes NUMERIC;
BEGIN
    -- Get session start time
    SELECT started_at INTO v_started_at
    FROM public.learning_sessions
    WHERE id = p_session_id;

    IF v_started_at IS NULL THEN
        RAISE EXCEPTION 'Session not found: %', p_session_id;
    END IF;

    -- Calculate duration
    v_ended_at := NOW();
    v_duration_seconds := EXTRACT(EPOCH FROM (v_ended_at - v_started_at))::INTEGER;
    v_duration_minutes := ROUND((v_duration_seconds / 60.0)::NUMERIC, 1);

    -- Update session
    UPDATE public.learning_sessions
    SET
        ended_at = v_ended_at,
        duration_seconds = v_duration_seconds,
        cards_reviewed = p_cards_reviewed,
        cards_correct = p_cards_correct,
        completed = true
    WHERE id = p_session_id;

    RAISE NOTICE 'Session ended: % (% minutes)', p_session_id, v_duration_minutes;

    -- Return results
    RETURN QUERY SELECT p_session_id, v_duration_seconds, v_duration_minutes;
END;
$$;

-- ============================================================================
-- Function: Get Session Statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_session_stats(
    p_student_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_sessions INTEGER,
    total_time_minutes INTEGER,
    avg_session_minutes NUMERIC,
    total_cards_reviewed INTEGER,
    total_cards_correct INTEGER,
    accuracy_percentage NUMERIC,
    longest_session_minutes INTEGER,
    shortest_session_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_sessions,
        COALESCE(SUM(duration_seconds) / 60, 0)::INTEGER AS total_time_minutes,
        COALESCE(ROUND(AVG(duration_seconds) / 60.0, 1), 0) AS avg_session_minutes,
        COALESCE(SUM(cards_reviewed), 0)::INTEGER AS total_cards_reviewed,
        COALESCE(SUM(cards_correct), 0)::INTEGER AS total_cards_correct,
        CASE
            WHEN SUM(cards_reviewed) > 0
            THEN ROUND((SUM(cards_correct)::NUMERIC / SUM(cards_reviewed)::NUMERIC) * 100, 1)
            ELSE 0
        END AS accuracy_percentage,
        COALESCE(MAX(duration_seconds) / 60, 0)::INTEGER AS longest_session_minutes,
        COALESCE(MIN(duration_seconds) / 60, 0)::INTEGER AS shortest_session_minutes
    FROM public.learning_sessions
    WHERE student_id = p_student_id
      AND completed = true
      AND started_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- ============================================================================
-- Function: Get Recent Sessions
-- ============================================================================
CREATE OR REPLACE FUNCTION get_recent_sessions(
    p_student_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    session_id UUID,
    session_type TEXT,
    started_at TIMESTAMPTZ,
    duration_minutes NUMERIC,
    cards_reviewed INTEGER,
    cards_correct INTEGER,
    accuracy_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        id AS session_id,
        learning_sessions.session_type,
        learning_sessions.started_at,
        ROUND((duration_seconds / 60.0)::NUMERIC, 1) AS duration_minutes,
        learning_sessions.cards_reviewed,
        learning_sessions.cards_correct,
        CASE
            WHEN learning_sessions.cards_reviewed > 0
            THEN ROUND((learning_sessions.cards_correct::NUMERIC / learning_sessions.cards_reviewed::NUMERIC) * 100, 1)
            ELSE 0
        END AS accuracy_percentage
    FROM public.learning_sessions
    WHERE student_id = p_student_id
      AND completed = true
    ORDER BY started_at DESC
    LIMIT p_limit;
END;
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Session tracking system created successfully';
    RAISE NOTICE '   - Table: learning_sessions';
    RAISE NOTICE '   - 4 RPC functions created:';
    RAISE NOTICE '     • start_learning_session() - Start a new session';
    RAISE NOTICE '     • end_learning_session() - End session with stats';
    RAISE NOTICE '     • get_session_stats() - Get aggregated statistics';
    RAISE NOTICE '     • get_recent_sessions() - Get recent session history';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Usage:';
    RAISE NOTICE '   -- Start session';
    RAISE NOTICE '   SELECT start_learning_session(''user-uuid'', ''vocabulary'');';
    RAISE NOTICE '';
    RAISE NOTICE '   -- End session';
    RAISE NOTICE '   SELECT * FROM end_learning_session(''session-uuid'', 10, 8);';
    RAISE NOTICE '';
    RAISE NOTICE '   -- Get stats';
    RAISE NOTICE '   SELECT * FROM get_session_stats(''user-uuid'', 30);';
END $$;

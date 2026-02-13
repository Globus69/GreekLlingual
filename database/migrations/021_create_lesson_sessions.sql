-- ============================================================
-- Migration: lesson_sessions + lesson_vocabulary Tabellen
-- Unterrichtssitzungen pro Schueler mit Datum, Thema, Vokabeln
-- Idempotent – kann beliebig oft sicher ausgefuehrt werden
-- ============================================================

-- 1. Extensions sicherstellen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabelle lesson_sessions (Unterrichtssitzungen)
CREATE TABLE IF NOT EXISTS public.lesson_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, date)
);

-- Index fuer schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_student ON public.lesson_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_date ON public.lesson_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_student_date ON public.lesson_sessions(student_id, date DESC);

-- 3. Tabelle lesson_vocabulary (Vokabelliste pro Sitzung)
CREATE TABLE IF NOT EXISTS public.lesson_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.lesson_sessions(id) ON DELETE CASCADE,
    source_word TEXT NOT NULL DEFAULT '',
    greek_word TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index fuer schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary_session ON public.lesson_vocabulary(session_id);
CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary_order ON public.lesson_vocabulary(session_id, sort_order);

-- 4. Trigger: updated_at automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_lesson_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_lesson_session_ts ON public.lesson_sessions;
CREATE TRIGGER trg_update_lesson_session_ts
    BEFORE UPDATE ON public.lesson_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_session_timestamp();

-- 5. RLS-Policies aktivieren
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_vocabulary ENABLE ROW LEVEL SECURITY;

-- lesson_sessions Policies
DROP POLICY IF EXISTS "Admin full access lesson_sessions" ON public.lesson_sessions;
CREATE POLICY "Admin full access lesson_sessions" ON public.lesson_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Students read own sessions" ON public.lesson_sessions;
CREATE POLICY "Students read own sessions" ON public.lesson_sessions
    FOR SELECT
    USING (student_id = auth.uid() OR true);

DROP POLICY IF EXISTS "Anon access lesson_sessions" ON public.lesson_sessions;
CREATE POLICY "Anon access lesson_sessions" ON public.lesson_sessions
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- lesson_vocabulary Policies
DROP POLICY IF EXISTS "Admin full access lesson_vocabulary" ON public.lesson_vocabulary;
CREATE POLICY "Admin full access lesson_vocabulary" ON public.lesson_vocabulary
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Students read own vocabulary" ON public.lesson_vocabulary;
CREATE POLICY "Students read own vocabulary" ON public.lesson_vocabulary
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anon access lesson_vocabulary" ON public.lesson_vocabulary;
CREATE POLICY "Anon access lesson_vocabulary" ON public.lesson_vocabulary
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 6. RPC-Funktionen (SECURITY DEFINER – umgehen RLS sicher)

-- 6a. Unterrichtssitzungen eines Schuelers abrufen
CREATE OR REPLACE FUNCTION get_lesson_sessions(p_student_id UUID)
RETURNS TABLE(
    session_id UUID,
    session_date DATE,
    session_topic TEXT,
    vocab_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ls.id AS session_id,
        ls.date AS session_date,
        ls.topic AS session_topic,
        COUNT(lv.id) AS vocab_count,
        ls.created_at,
        ls.updated_at
    FROM public.lesson_sessions ls
    LEFT JOIN public.lesson_vocabulary lv ON lv.session_id = ls.id
    WHERE ls.student_id = p_student_id
    GROUP BY ls.id, ls.date, ls.topic, ls.created_at, ls.updated_at
    ORDER BY ls.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_lesson_sessions TO anon;
GRANT EXECUTE ON FUNCTION get_lesson_sessions TO authenticated;

-- 6b. Einzelne Sitzung mit Vokabeln abrufen
CREATE OR REPLACE FUNCTION get_lesson_detail(p_session_id UUID)
RETURNS JSON AS $$
DECLARE
    v_session RECORD;
    v_vocabs JSON;
BEGIN
    SELECT id, student_id, date, topic, created_at, updated_at
    INTO v_session
    FROM public.lesson_sessions
    WHERE id = p_session_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Session not found');
    END IF;

    SELECT json_agg(
        json_build_object(
            'id', lv.id,
            'source_word', lv.source_word,
            'greek_word', lv.greek_word,
            'sort_order', lv.sort_order
        ) ORDER BY lv.sort_order
    )
    INTO v_vocabs
    FROM public.lesson_vocabulary lv
    WHERE lv.session_id = p_session_id;

    RETURN json_build_object(
        'success', true,
        'session', json_build_object(
            'id', v_session.id,
            'student_id', v_session.student_id,
            'date', v_session.date,
            'topic', v_session.topic,
            'created_at', v_session.created_at,
            'updated_at', v_session.updated_at
        ),
        'vocabulary', COALESCE(v_vocabs, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_lesson_detail TO anon;
GRANT EXECUTE ON FUNCTION get_lesson_detail TO authenticated;

-- 6c. Sitzung erstellen oder aktualisieren (upsert)
CREATE OR REPLACE FUNCTION upsert_lesson_session(
    p_student_id UUID,
    p_date DATE,
    p_topic TEXT
)
RETURNS JSON AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Upsert: Insert oder Update bei gleichem student_id + date
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (p_student_id, p_date, p_topic)
    ON CONFLICT (student_id, date)
    DO UPDATE SET topic = EXCLUDED.topic, updated_at = now()
    RETURNING id INTO v_session_id;

    RETURN json_build_object('success', true, 'session_id', v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_lesson_session TO anon;
GRANT EXECUTE ON FUNCTION upsert_lesson_session TO authenticated;

-- 6d. Vokabeln zu einer Sitzung setzen (alte loeschen, neue einfuegen)
CREATE OR REPLACE FUNCTION set_lesson_vocabulary(
    p_session_id UUID,
    p_vocabulary JSON
)
RETURNS JSON AS $$
DECLARE
    v_item JSON;
    v_count INTEGER := 0;
BEGIN
    -- Alle alten Vokabeln der Sitzung loeschen
    DELETE FROM public.lesson_vocabulary WHERE session_id = p_session_id;

    -- Neue Vokabeln einfuegen
    FOR v_item IN SELECT * FROM json_array_elements(p_vocabulary)
    LOOP
        INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order)
        VALUES (
            p_session_id,
            COALESCE(v_item->>'source_word', ''),
            COALESCE(v_item->>'greek_word', ''),
            COALESCE((v_item->>'sort_order')::INTEGER, v_count)
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN json_build_object('success', true, 'count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_lesson_vocabulary TO anon;
GRANT EXECUTE ON FUNCTION set_lesson_vocabulary TO authenticated;

-- 6e. Sitzung loeschen (mit allen Vokabeln via CASCADE)
CREATE OR REPLACE FUNCTION delete_lesson_session(p_session_id UUID)
RETURNS JSON AS $$
BEGIN
    DELETE FROM public.lesson_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Session not found');
    END IF;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_lesson_session TO anon;
GRANT EXECUTE ON FUNCTION delete_lesson_session TO authenticated;

-- Fertig!
-- HINWEIS: Diese Datei im Supabase SQL Editor ausfuehren!

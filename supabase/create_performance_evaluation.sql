-- ============================================================
-- Aufgabe 16: Automatische Leistungsstufen-Anpassung
-- ============================================================
-- Erstellt:
--   1. performance_log Tabelle (Verlauf der Aenderungen)
--   2. evaluate_student_performance() RPC-Funktion
--      - Berechnet Korrektquote ueber die letzten N Versuche
--      - Passt difficulty automatisch an:
--        > 80% ueber 50+ Karten → Schwierigkeit erhoehen
--        < 40% ueber 50+ Karten → Schwierigkeit senken
--      - Gibt Feedback zurueck (ob Aenderung stattfand)
--   3. get_student_stats() RPC-Funktion fuer Admin-Dashboard
-- ============================================================

-- ── 1. Extensions sicherstellen ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Performance-Log Tabelle ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.performance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    old_level TEXT,
    new_level TEXT,
    old_difficulty TEXT,
    new_difficulty TEXT,
    old_index TEXT,
    new_index TEXT,
    correct_rate FLOAT,         -- Korrektquote zum Zeitpunkt der Aenderung
    total_attempts INTEGER,     -- Gesamtzahl Versuche (Basis der Berechnung)
    reason TEXT,                -- z.B. "auto_upgrade", "auto_downgrade", "admin_change"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index fuer schnelle Abfragen pro Student
CREATE INDEX IF NOT EXISTS idx_performance_log_student ON public.performance_log (student_id);
CREATE INDEX IF NOT EXISTS idx_performance_log_created ON public.performance_log (created_at DESC);

-- RLS
ALTER TABLE public.performance_log ENABLE ROW LEVEL SECURITY;

-- Admin darf alles lesen
DROP POLICY IF EXISTS "Admin can read performance_log" ON public.performance_log;
CREATE POLICY "Admin can read performance_log" ON public.performance_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Anon darf lesen (fuer RPC-Funktionen)
DROP POLICY IF EXISTS "Anon can read performance_log" ON public.performance_log;
CREATE POLICY "Anon can read performance_log" ON public.performance_log
    FOR SELECT
    TO anon
    USING (true);

-- Anon darf schreiben (fuer RPC-Funktionen via SECURITY DEFINER)
DROP POLICY IF EXISTS "Allow insert performance_log" ON public.performance_log;
CREATE POLICY "Allow insert performance_log" ON public.performance_log
    FOR INSERT
    WITH CHECK (true);

-- ── 3. RPC: evaluate_student_performance ─────────────────────
-- Berechnet Korrektquote und passt Schwierigkeit automatisch an
-- Parameter:
--   p_student_id: UUID des Schuelers
--   p_min_attempts: Mindestanzahl Versuche fuer Bewertung (default: 50)
-- Returns JSON mit:
--   evaluated: boolean (ob genug Daten vorhanden)
--   correct_rate: float (aktuelle Korrektquote)
--   total_attempts: int (Gesamtversuche)
--   changed: boolean (ob Stufe geaendert wurde)
--   old_difficulty / new_difficulty: string
--   old_level / new_level: string
--   message: string (Beschreibung der Aenderung)
CREATE OR REPLACE FUNCTION evaluate_student_performance(
    p_student_id UUID,
    p_min_attempts INTEGER DEFAULT 50
) RETURNS JSON AS $$
DECLARE
    v_total_attempts INTEGER;
    v_total_correct INTEGER;
    v_correct_rate FLOAT;
    v_current_level TEXT;
    v_current_difficulty TEXT;
    v_new_level TEXT;
    v_new_difficulty TEXT;
    v_changed BOOLEAN := false;
    v_reason TEXT;
    v_message TEXT;
BEGIN
    -- 1. Korrektquote aus student_progress berechnen
    SELECT
        COALESCE(SUM(attempts), 0),
        COALESCE(SUM(correct_count), 0)
    INTO v_total_attempts, v_total_correct
    FROM public.student_progress
    WHERE student_id = p_student_id;

    -- Nicht genug Daten? → Abbrechen
    IF v_total_attempts < p_min_attempts THEN
        RETURN json_build_object(
            'evaluated', false,
            'correct_rate', CASE WHEN v_total_attempts > 0 THEN ROUND((v_total_correct::float / v_total_attempts * 100)::numeric, 1) ELSE 0 END,
            'total_attempts', v_total_attempts,
            'min_required', p_min_attempts,
            'changed', false,
            'message', 'Not enough attempts for evaluation (' || v_total_attempts || '/' || p_min_attempts || ')'
        );
    END IF;

    -- 2. Korrektquote berechnen
    v_correct_rate := ROUND((v_total_correct::float / v_total_attempts * 100)::numeric, 1);

    -- 3. Aktuelles Level + Difficulty des Schuelers laden
    SELECT level, difficulty
    INTO v_current_level, v_current_difficulty
    FROM public.users
    WHERE id = p_student_id AND role = 'student';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'evaluated', false,
            'changed', false,
            'message', 'Student not found'
        );
    END IF;

    v_new_level := v_current_level;
    v_new_difficulty := v_current_difficulty;

    -- 4. Schwierigkeit anpassen basierend auf Korrektquote
    IF v_correct_rate > 80 THEN
        -- > 80% → Schwierigkeit erhoehen
        IF v_current_difficulty = 'easy' THEN
            v_new_difficulty := 'middle';
            v_changed := true;
            v_reason := 'auto_upgrade';
            v_message := 'Excellent performance! Difficulty upgraded: easy → middle';
        ELSIF v_current_difficulty = 'middle' THEN
            v_new_difficulty := 'hard';
            v_changed := true;
            v_reason := 'auto_upgrade';
            v_message := 'Excellent performance! Difficulty upgraded: middle → hard';
        ELSIF v_current_difficulty = 'hard' THEN
            -- Bereits auf hard → Level erhoehen und Difficulty zuruecksetzen
            IF v_current_level = 'A1' THEN
                v_new_level := 'A2';
                v_new_difficulty := 'easy';
                v_changed := true;
                v_reason := 'auto_level_up';
                v_message := 'Outstanding! Level upgraded: A1-hard → A2-easy';
            ELSIF v_current_level = 'A2' THEN
                v_new_level := 'B1';
                v_new_difficulty := 'easy';
                v_changed := true;
                v_reason := 'auto_level_up';
                v_message := 'Outstanding! Level upgraded: A2-hard → B1-easy';
            ELSIF v_current_level = 'B1' THEN
                v_new_level := 'B2';
                v_new_difficulty := 'easy';
                v_changed := true;
                v_reason := 'auto_level_up';
                v_message := 'Outstanding! Level upgraded: B1-hard → B2-easy';
            ELSE
                -- B2-hard = Maximum
                v_message := 'Maximum level reached (B2-hard). Keep it up!';
            END IF;
        END IF;
    ELSIF v_correct_rate < 40 THEN
        -- < 40% → Schwierigkeit senken
        IF v_current_difficulty = 'hard' THEN
            v_new_difficulty := 'middle';
            v_changed := true;
            v_reason := 'auto_downgrade';
            v_message := 'Difficulty adjusted: hard → middle. Keep practicing!';
        ELSIF v_current_difficulty = 'middle' THEN
            v_new_difficulty := 'easy';
            v_changed := true;
            v_reason := 'auto_downgrade';
            v_message := 'Difficulty adjusted: middle → easy. Keep practicing!';
        ELSIF v_current_difficulty = 'easy' THEN
            -- Bereits auf easy → Level senken (wenn moeglich)
            IF v_current_level = 'B2' THEN
                v_new_level := 'B1';
                v_new_difficulty := 'hard';
                v_changed := true;
                v_reason := 'auto_level_down';
                v_message := 'Level adjusted: B2-easy → B1-hard. Review previous material.';
            ELSIF v_current_level = 'B1' THEN
                v_new_level := 'A2';
                v_new_difficulty := 'hard';
                v_changed := true;
                v_reason := 'auto_level_down';
                v_message := 'Level adjusted: B1-easy → A2-hard. Review previous material.';
            ELSIF v_current_level = 'A2' THEN
                v_new_level := 'A1';
                v_new_difficulty := 'hard';
                v_changed := true;
                v_reason := 'auto_level_down';
                v_message := 'Level adjusted: A2-easy → A1-hard. Review previous material.';
            ELSE
                -- A1-easy = Minimum
                v_message := 'Minimum level (A1-easy). Extra practice recommended.';
            END IF;
        END IF;
    ELSE
        -- 40-80% → Keine Aenderung
        v_message := 'Performance is on track (' || v_correct_rate || '%). Keep going!';
    END IF;

    -- 5. Aenderung durchfuehren
    IF v_changed THEN
        -- User-Tabelle aktualisieren (Trigger setzt performance_index)
        UPDATE public.users
        SET level = v_new_level,
            difficulty = v_new_difficulty
        WHERE id = p_student_id;

        -- Log-Eintrag erstellen
        INSERT INTO public.performance_log (
            student_id, old_level, new_level, old_difficulty, new_difficulty,
            old_index, new_index, correct_rate, total_attempts, reason
        ) VALUES (
            p_student_id,
            v_current_level, v_new_level,
            v_current_difficulty, v_new_difficulty,
            v_current_level || '-' || v_current_difficulty,
            v_new_level || '-' || v_new_difficulty,
            v_correct_rate, v_total_attempts, v_reason
        );
    END IF;

    -- 6. Ergebnis zurueckgeben
    RETURN json_build_object(
        'evaluated', true,
        'correct_rate', v_correct_rate,
        'total_attempts', v_total_attempts,
        'changed', v_changed,
        'old_level', v_current_level,
        'new_level', v_new_level,
        'old_difficulty', v_current_difficulty,
        'new_difficulty', v_new_difficulty,
        'old_index', v_current_level || '-' || v_current_difficulty,
        'new_index', v_new_level || '-' || v_new_difficulty,
        'reason', COALESCE(v_reason, 'none'),
        'message', v_message
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'evaluated', false,
        'changed', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION evaluate_student_performance TO anon;
GRANT EXECUTE ON FUNCTION evaluate_student_performance TO authenticated;

-- ── 4. RPC: get_student_stats ────────────────────────────────
-- Gibt Statistiken fuer einen Schueler zurueck (fuer Admin-Dashboard)
CREATE OR REPLACE FUNCTION get_student_stats(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_attempts INTEGER;
    v_total_correct INTEGER;
    v_correct_rate FLOAT;
    v_items_learned INTEGER;
    v_items_total INTEGER;
    v_last_activity TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Gesamtstatistik
    SELECT
        COALESCE(SUM(attempts), 0),
        COALESCE(SUM(correct_count), 0),
        COUNT(*) FILTER (WHERE ease_factor >= 2.5 AND attempts >= 3),
        COUNT(*),
        MAX(last_attempt)
    INTO v_total_attempts, v_total_correct, v_items_learned, v_items_total, v_last_activity
    FROM public.student_progress
    WHERE student_id = p_student_id;

    v_correct_rate := CASE
        WHEN v_total_attempts > 0
        THEN ROUND((v_total_correct::float / v_total_attempts * 100)::numeric, 1)
        ELSE 0
    END;

    RETURN json_build_object(
        'total_attempts', v_total_attempts,
        'total_correct', v_total_correct,
        'correct_rate', v_correct_rate,
        'items_learned', v_items_learned,
        'items_practiced', v_items_total,
        'last_activity', v_last_activity
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_student_stats TO anon;
GRANT EXECUTE ON FUNCTION get_student_stats TO authenticated;

-- ── FERTIG ──────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '✅ Performance-Evaluation erstellt:';
    RAISE NOTICE '   - Tabelle: performance_log';
    RAISE NOTICE '   - Funktion: evaluate_student_performance(student_id, min_attempts)';
    RAISE NOTICE '   - Funktion: get_student_stats(student_id)';
    RAISE NOTICE '   - Regeln: >80%% ueber 50 Karten → upgrade, <40%% → downgrade';
END $$;

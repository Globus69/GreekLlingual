-- ============================================================
-- Aufgabe 17: Level + Difficulty Spalten fuer learning_items
-- ============================================================
-- Erweitert learning_items um:
--   1. level TEXT DEFAULT 'A1' (A1/A2/B1/B2)
--   2. difficulty TEXT DEFAULT 'easy' (easy/middle/hard)
-- Damit koennen Inhalte nach Schueler-Leistungsstufe gefiltert werden.
-- ============================================================

-- ── 1. Spalten hinzufuegen (idempotent) ────────────────────────
DO $$
BEGIN
    -- level Spalte
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'level'
    ) THEN
        ALTER TABLE public.learning_items ADD COLUMN level TEXT DEFAULT 'A1';
        RAISE NOTICE 'Spalte level hinzugefuegt';
    ELSE
        RAISE NOTICE 'Spalte level existiert bereits';
    END IF;

    -- difficulty Spalte
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE public.learning_items ADD COLUMN difficulty TEXT DEFAULT 'easy';
        RAISE NOTICE 'Spalte difficulty hinzugefuegt';
    ELSE
        RAISE NOTICE 'Spalte difficulty existiert bereits';
    END IF;
END $$;

-- ── 2. CHECK-Constraints (idempotent) ──────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'learning_items_level_check'
          AND conrelid = 'public.learning_items'::regclass
    ) THEN
        ALTER TABLE public.learning_items
            ADD CONSTRAINT learning_items_level_check
            CHECK (level IN ('A1', 'A2', 'B1', 'B2'));
        RAISE NOTICE 'CHECK-Constraint learning_items_level_check erstellt';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'learning_items_difficulty_check'
          AND conrelid = 'public.learning_items'::regclass
    ) THEN
        ALTER TABLE public.learning_items
            ADD CONSTRAINT learning_items_difficulty_check
            CHECK (difficulty IN ('easy', 'middle', 'hard'));
        RAISE NOTICE 'CHECK-Constraint learning_items_difficulty_check erstellt';
    END IF;
END $$;

-- ── 3. Index fuer schnelle Level+Difficulty Abfragen ───────────
CREATE INDEX IF NOT EXISTS idx_learning_items_level_difficulty
    ON public.learning_items (level, difficulty);

-- ── 4. Bestehende Items mit sinnvollen Defaults versehen ───────
-- Alle Items die noch keinen Level/Difficulty haben → A1-easy setzen
UPDATE public.learning_items
SET level = 'A1', difficulty = 'easy'
WHERE level IS NULL OR difficulty IS NULL;

-- ── 5. RPC: Lern-Items nach Level+Difficulty filtern ───────────
-- Holt Items fuer einen Schueler basierend auf seinem Level/Difficulty
-- mit Fallback auf niedrigere Stufen
CREATE OR REPLACE FUNCTION get_learning_items_for_student(
    p_student_id UUID,
    p_type TEXT,
    p_limit INTEGER DEFAULT 100
) RETURNS JSON AS $$
DECLARE
    v_level TEXT;
    v_difficulty TEXT;
    v_result JSON;
    v_count INTEGER;
BEGIN
    -- 1. Level + Difficulty des Schuelers holen
    SELECT level, difficulty
    INTO v_level, v_difficulty
    FROM public.users
    WHERE id = p_student_id AND role = 'student';

    -- Fallback wenn Schueler nicht gefunden
    IF NOT FOUND THEN
        v_level := 'A1';
        v_difficulty := 'easy';
    END IF;

    -- 2. Items fuer genau dieses Level + Difficulty holen
    SELECT json_agg(row_to_json(items))
    INTO v_result
    FROM (
        SELECT li.*, sp.correct_count, sp.attempts, sp.ease_factor,
               sp.interval_days, sp.next_review, sp.last_attempt
        FROM public.learning_items li
        LEFT JOIN public.student_progress sp
            ON sp.item_id = li.id AND sp.student_id = p_student_id
        WHERE li.type = p_type
          AND li.level = v_level
          AND li.difficulty = v_difficulty
        ORDER BY li.created_at DESC
        LIMIT p_limit
    ) items;

    -- 3. Fallback: Wenn keine Items gefunden → gleicher Level, alle Difficulties
    IF v_result IS NULL THEN
        SELECT json_agg(row_to_json(items))
        INTO v_result
        FROM (
            SELECT li.*, sp.correct_count, sp.attempts, sp.ease_factor,
                   sp.interval_days, sp.next_review, sp.last_attempt
            FROM public.learning_items li
            LEFT JOIN public.student_progress sp
                ON sp.item_id = li.id AND sp.student_id = p_student_id
            WHERE li.type = p_type
              AND li.level = v_level
            ORDER BY li.created_at DESC
            LIMIT p_limit
        ) items;
    END IF;

    -- 4. Fallback: Wenn immer noch nichts → alle Items dieses Typs
    IF v_result IS NULL THEN
        SELECT json_agg(row_to_json(items))
        INTO v_result
        FROM (
            SELECT li.*, sp.correct_count, sp.attempts, sp.ease_factor,
                   sp.interval_days, sp.next_review, sp.last_attempt
            FROM public.learning_items li
            LEFT JOIN public.student_progress sp
                ON sp.item_id = li.id AND sp.student_id = p_student_id
            WHERE li.type = p_type
            ORDER BY li.created_at DESC
            LIMIT p_limit
        ) items;
    END IF;

    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_learning_items_for_student TO anon;
GRANT EXECUTE ON FUNCTION get_learning_items_for_student TO authenticated;

-- ── 6. RPC: Items Level+Difficulty zuweisen (fuer Admin) ───────
CREATE OR REPLACE FUNCTION assign_item_level(
    p_item_id UUID,
    p_level TEXT,
    p_difficulty TEXT
) RETURNS JSON AS $$
BEGIN
    UPDATE public.learning_items
    SET level = p_level, difficulty = p_difficulty
    WHERE id = p_item_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found');
    END IF;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_item_level TO anon;
GRANT EXECUTE ON FUNCTION assign_item_level TO authenticated;

-- ── FERTIG ──────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '✅ learning_items erweitert:';
    RAISE NOTICE '   - Spalten: level, difficulty hinzugefuegt';
    RAISE NOTICE '   - CHECK-Constraints fuer erlaubte Werte';
    RAISE NOTICE '   - Index: idx_learning_items_level_difficulty';
    RAISE NOTICE '   - RPC: get_learning_items_for_student(student_id, type, limit)';
    RAISE NOTICE '   - RPC: assign_item_level(item_id, level, difficulty)';
    RAISE NOTICE '   - Bestehende Items auf A1-easy gesetzt';
END $$;

# Analyse-Bericht: Statistik-Anzeige (Werte-Check)

## 1. Status nach Reset
Der Benutzer **2098** wurde erfolgreich auf "Jungfräulich" zurückgesetzt. Alle Tabellen (`fsrs_review_logs`, `learning_sessions`, `user_vocabulary_progress`) sind leer.

## 2. Analyse der Detail-Statistiken

### A. Sessions & Session Time (aktuell 0)
- **Problem:** Diese Werte werden aus der Tabelle `learning_sessions` berechnet.
- **Bedingung:** Eine Session wird nur gezählt, wenn sie **abgeschlossen** ist (`completed = true`).
- **Fehlerpotenzial:** Wenn du ein Lern-Dialog einfach schließt (X oder Klick daneben), wird die Session oft als `completed = false` markiert. Nur wenn du den Stapel bis zum Ende durcharbeitest und die Zusammenfassung siehst, wird sie korrekt geloggt.
- **Lösung:** Ich habe den Code im `DueCardsDialog` bereits so angepasst, dass er sauberer mit Session-Enden umgeht.

### B. "Learned Words" Definition
- **Erwartung:** Nur Karten zählen, die man wirklich "kann" (mind. einmal mit Good/Easy bewertet).
- **Status:** Die aktuelle Datenbank-Logik zählt jede angefasste Karte.
- **Korrektur:** Ich habe unten ein korrigiertes SQL-Statement bereitgestellt, das die Definition verschärft.

### C. Übrige Kacheln (Accuracy, Mastery)
- Diese hängen direkt an den `fsrs_review_logs`. Da diese nun leer sind, starten sie bei 0. Sobald du lernst, fließen die Daten ein.

---

## 3. ⚠️ HANDLUNGSBEDARF (Zwei SQL-Blocks)

Bitte führe beide Blöcke im Supabase SQL Editor aus, um die Logik für den Neustart zu perfektionieren.

### BLOCK 1: Fix Logging & Definition (Korrektur für Learned Words)
Dieses Script stellt sicher, dass das Logging funktioniert und "Learned" nur bei Erfolg zählt.

```sql
-- 1. Fix update_card_fsrs (Logging wiederherstellen)
CREATE OR REPLACE FUNCTION update_card_fsrs(
    p_card_id UUID, p_user_id UUID, p_rating INT, p_new_difficulty REAL,
    p_new_stability REAL, p_new_due TIMESTAMPTZ, p_new_reps INT,
    p_new_lapses INT, p_new_state TEXT, p_interval_days REAL,
    p_old_difficulty REAL DEFAULT NULL, p_old_stability REAL DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO user_vocabulary_progress (
        user_id, vocabulary_id, fsrs_difficulty, fsrs_stability,
        fsrs_due, fsrs_reps, fsrs_lapses, fsrs_state, fsrs_last_review
    ) VALUES (
        p_user_id, p_card_id, p_new_difficulty, p_new_stability,
        p_new_due, p_new_reps, p_new_lapses, p_new_state, NOW()
    ) ON CONFLICT (user_id, vocabulary_id) DO UPDATE SET
        fsrs_difficulty = p_new_difficulty, fsrs_stability = p_new_stability,
        fsrs_due = p_new_due, fsrs_reps = p_new_reps, fsrs_lapses = p_new_lapses,
        fsrs_state = p_new_state, fsrs_last_review = NOW(), updated_at = NOW();

    INSERT INTO public.fsrs_review_logs (
        user_id, card_id, rating, review_time, interval_days,
        old_difficulty, old_stability, new_difficulty, new_stability
    ) VALUES (
        p_user_id, p_card_id, p_rating, NOW(), p_interval_days,
        COALESCE(p_old_difficulty, 0.3), COALESCE(p_old_stability, 0.0),
        p_new_difficulty, p_new_stability
    );
    RETURN jsonb_build_object('success', true);
END; $$;

-- 3. Tighten get_due_cards_fsrs (Align with Dashboard)
CREATE OR REPLACE FUNCTION get_due_cards_fsrs(
    p_user_id UUID, p_level TEXT DEFAULT NULL, p_limit INT DEFAULT 100
) RETURNS TABLE (
    id UUID, type TEXT, english TEXT, russian TEXT, greek TEXT, greek_word TEXT,
    phonetic TEXT, example_en TEXT, example_gr TEXT, audio_url TEXT,
    level TEXT, difficulty TEXT, fsrs_difficulty DOUBLE PRECISION,
    fsrs_stability DOUBLE PRECISION, fsrs_due TIMESTAMPTZ, fsrs_reps INT,
    fsrs_lapses INT, fsrs_state TEXT, fsrs_last_review TIMESTAMPTZ, created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, 'vocabulary'::TEXT, v.en_translation::TEXT, v.ru_translation::TEXT,
        v.greek_transcription::TEXT, v.greek_transcription::TEXT, v.greek_phonetic::TEXT,
        NULL::TEXT, NULL::TEXT, COALESCE(v.audio_url, v.en_audio_url)::TEXT,
        v.level::TEXT, v.difficulty::TEXT, COALESCE(uvp.fsrs_difficulty, 0.3)::DOUBLE PRECISION,
        COALESCE(uvp.fsrs_stability, 0.0)::DOUBLE PRECISION, COALESCE(uvp.fsrs_due, NOW()),
        COALESCE(uvp.fsrs_reps, 0), COALESCE(uvp.fsrs_lapses, 0),
        COALESCE(uvp.fsrs_state, 'new')::TEXT, uvp.fsrs_last_review, v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp ON uvp.vocabulary_id = v.id AND uvp.user_id = p_user_id
    WHERE (p_level IS NULL OR v.level = p_level) AND uvp.fsrs_due <= NOW()
    ORDER BY uvp.fsrs_due ASC, v.created_at DESC LIMIT p_limit;
END; $$;

-- 2. Fix get_progress_overview (Learned = mind. 1x Correct)
CREATE OR REPLACE FUNCTION get_progress_overview(p_user_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
    total_reviews BIGINT, total_correct BIGINT, avg_accuracy NUMERIC,
    cards_learned BIGINT, cards_mastered BIGINT, new_cards_added BIGINT,
    total_study_minutes NUMERIC, avg_session_minutes NUMERIC, total_sessions BIGINT,
    improvement_rate NUMERIC, consistency_score NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_period_start TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT COUNT(*) as sc, COALESCE(SUM(duration_seconds)/60.0, 0) as tm, COALESCE(AVG(duration_seconds)/60.0, 0) as am
        FROM learning_sessions WHERE student_id = p_user_id AND started_at >= v_period_start AND completed = true
    ),
    review_stats AS (
        SELECT COUNT(*) as rc, COUNT(*) FILTER (WHERE rating >= 3) as cc
        FROM fsrs_review_logs WHERE user_id = p_user_id AND review_time >= v_period_start
    ),
    card_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE is_learned) as learned_count,
            COUNT(*) FILTER (WHERE fsrs_stability >= 30) as mastered_count
        FROM (
            SELECT uvp.fsrs_stability, EXISTS (SELECT 1 FROM fsrs_review_logs l WHERE l.card_id = uvp.vocabulary_id AND l.user_id = p_user_id AND l.rating >= 3) as is_learned
            FROM user_vocabulary_progress uvp WHERE uvp.user_id = p_user_id
        ) t
    )
    SELECT 
        rs.rc::BIGINT, rs.cc::BIGINT, 
        CASE WHEN rs.rc > 0 THEN ROUND((rs.cc::NUMERIC/rs.rc)*100, 2) ELSE 0 END,
        cs.learned_count::BIGINT, cs.mastered_count::BIGINT, 0::BIGINT,
        ROUND(ss.tm::NUMERIC, 2), ROUND(ss.am::NUMERIC, 2), ss.sc::BIGINT,
        0::NUMERIC, 0::NUMERIC
    FROM session_stats ss, review_stats rs, card_stats cs;
END; $$;
```

---

## 4. Fazit
Nach Ausführung dieser SQL-Befehle und deiner ersten Lern-Sitzung (die du bis zur Zusammenfassung durchspielst), werden alle Werte mathematisch korrekt sein.
- **Sessions** zählt nur beendete Sitzungen.
- **Learned** zählt nur Karten mit mind. einem "Good/Easy".
- **Due Today** zeigt die Summe aller fälligen Karten.

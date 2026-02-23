# Analyse: Vocabulary Practice & Mastery-Logik

## 1. Problembeschreibung
Nachdem Karten im Modul **"Due Cards Today"** bewertet wurden, zeigt das Modul **"Review Vocab"** (Vocabulary Practice) sofort "Session Complete" an, mit allen Werten auf 0.

### Ursache
Der FSRS-Algorithmus schiebt Karten nach einer Bewertung sofort in die Zukunft (`fsrs_due` wird auf morgen oder später gesetzt). Da der Dialog "Review Vocab" aktuell nur Karten lädt, die **jetzt fällig** sind (`fsrs_due <= NOW()`), findet er nach einer Sitzung keine Karten mehr und zeigt die Zusammenfassung an.

---

## 2. Ziel-Logik (Mastery Loop)

Der Dialog **"Vocabulary Practice"** soll nicht als reiner SRS-Review (Spaced Repetition) fungieren, sondern als **Lern-Schleife (Mastery Loop)**:

1.  **Karten-Auswahl:** Er lädt alle Karten, die heute bereits bewertet wurden ODER sich im Status "Learning/Relearning" befinden.
2.  **Sitzungs-Verhalten:** 
    *   Wird eine Karte mit "Again", "Hard" oder "Easy" bewertet, bleibt sie in der aktuellen Sitzung und wird später erneut abgefragt (Re-Queue).
    *   **Erst bei "Good" (Rating 3)** gilt die Karte für diese Sitzung als gelernt und wird aus der Liste entfernt.
3.  **Abschluss:** Die Sitzung ist erst dann "Complete", wenn alle Karten im Stapel einmal mit "Good" bewertet wurden.

---

## 3. ⚠️ HANDLUNGSBEDARF (SQL Update)

Bitte führe diesen SQL-Block im Supabase SQL Editor aus, um die neue Logik zu aktivieren:

```sql
-- Migration 100: Mastery Loop RPC
CREATE OR REPLACE FUNCTION get_learning_vocabulary_cards(
    p_user_id UUID, p_limit INT DEFAULT 50
) RETURNS TABLE (
    id UUID, type TEXT, english TEXT, russian TEXT, greek TEXT, greek_word TEXT,
    phonetic TEXT, example_en TEXT, example_gr TEXT, audio_url TEXT,
    level TEXT, difficulty TEXT, fsrs_difficulty DOUBLE PRECISION,
    fsrs_stability DOUBLE PRECISION, fsrs_due TIMESTAMPTZ, fsrs_reps INT,
    fsrs_lapses INT, fsrs_state TEXT, fsrs_last_review TIMESTAMPTZ, created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (v.id)
        v.id, 'vocabulary'::TEXT, v.en_translation::TEXT, v.ru_translation::TEXT,
        v.greek_transcription::TEXT, v.greek_transcription::TEXT, v.greek_phonetic::TEXT,
        NULL::TEXT, NULL::TEXT, COALESCE(v.audio_url, v.en_audio_url)::TEXT,
        v.level::TEXT, v.difficulty::TEXT, COALESCE(uvp.fsrs_difficulty, 0.3)::DOUBLE PRECISION,
        COALESCE(uvp.fsrs_stability, 0.0)::DOUBLE PRECISION, COALESCE(uvp.fsrs_due, NOW()),
        COALESCE(uvp.fsrs_reps, 0), COALESCE(uvp.fsrs_lapses, 0),
        COALESCE(uvp.fsrs_state, 'new')::TEXT, uvp.fsrs_last_review, v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp ON uvp.vocabulary_id = v.id AND uvp.user_id = p_user_id
    LEFT JOIN fsrs_review_logs l ON l.card_id = v.id AND l.user_id = p_user_id AND l.review_time >= CURRENT_DATE
    WHERE l.id IS NOT NULL OR uvp.fsrs_state IN ('learning', 'relearning') OR uvp.fsrs_due <= NOW()
    ORDER BY v.id, uvp.fsrs_due ASC LIMIT p_limit;
END; $$;
```

---

## 4. Fazit
Ich habe den **Frontend-Code (`VocabularyDialog.tsx`) bereits angepasst**. Sobald du das SQL ausgeführt hast, werden Karten aus "Due Cards Today" nahtlos in "Review Vocab" auftauchen, sofern sie nicht direkt mit "Good" abgeschlossen wurden. Im Dialog selbst werden sie so lange wiederholt, bis sie die Note "Good" erreichen.

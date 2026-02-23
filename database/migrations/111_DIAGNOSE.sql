-- ============================================================================
-- DIAGNOSE: Warum zeigt Brain Gym keine schwachen Wörter?
-- Bitte ersetze 'DEINE-USER-ID-HIER' mit deiner echten User-ID.
-- Diese findest du z.B. in der Tabelle "users" oder in der Browser-Konsole.
-- ============================================================================

-- SCHRITT 1: Zeige alle Einträge in fsrs_review_logs für diesen User
SELECT 
    'fsrs_review_logs' AS source,
    card_id,
    rating,
    review_time
FROM fsrs_review_logs
WHERE user_id = 'DEINE-USER-ID-HIER'
ORDER BY review_time DESC
LIMIT 20;

-- SCHRITT 2: Zeige alle Einträge in student_progress für diesen User
SELECT 
    'student_progress' AS source,
    item_id,
    fsrs_difficulty,
    fsrs_lapses,
    fsrs_state,
    ease_factor,
    fsrs_last_review
FROM student_progress
WHERE student_id = 'DEINE-USER-ID-HIER'
ORDER BY fsrs_lapses DESC, fsrs_difficulty DESC
LIMIT 20;

-- SCHRITT 3: Teste den RPC direkt
SELECT * FROM get_weak_vocabulary_cards('DEINE-USER-ID-HIER', 20);

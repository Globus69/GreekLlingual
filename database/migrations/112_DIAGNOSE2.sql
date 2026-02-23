-- ============================================================================
-- DIAGNOSE 2: Warum zeigt Brain Gym keine Schwachen Wörter?
-- Ersetze 'DEINE-USER-ID' mit der echten User-ID.
-- ============================================================================

-- TEST 1: Direkt aus user_vocabulary_progress - was hat fsrs_lapses >= 2?
SELECT 
    vocabulary_id,
    fsrs_lapses,
    fsrs_difficulty,
    fsrs_state,
    fsrs_last_review,
    user_id
FROM user_vocabulary_progress
WHERE user_id = 'DEINE-USER-ID'
  AND fsrs_lapses >= 2
ORDER BY fsrs_lapses DESC;

-- TEST 2: Zählwert - soll 11 zurückgeben
SELECT get_weak_vocabulary_count('DEINE-USER-ID');

-- TEST 3: Der RPC direkt - soll Karten zurückgeben
SELECT id, english, greek, fsrs_lapses FROM get_weak_vocabulary_cards('DEINE-USER-ID', 20);

-- TEST 4: Prüfe ob die user_id in user_vocabulary_progress mit dem übergebenen Wert übereinstimmt
SELECT DISTINCT user_id FROM user_vocabulary_progress LIMIT 5;

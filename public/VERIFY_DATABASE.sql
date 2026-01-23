-- ========================================
-- DATABASE VERIFICATION QUERIES
-- ========================================

-- 1. Check vocabs count for deck
SELECT COUNT(*) as vocab_count
FROM vocabs
WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e';

-- 2. View all vocabs for deck
SELECT
    id,
    english,
    greek,
    difficulty,
    created_at
FROM vocabs
WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e'
ORDER BY created_at DESC;

-- 3. Check daily_phrases count for deck
SELECT COUNT(*) as phrases_count
FROM daily_phrases
WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e';

-- 4. View latest 3 daily phrases
SELECT
    id,
    greek_phrase,
    english_translation,
    category,
    difficulty,
    created_at
FROM daily_phrases
WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e'
ORDER BY created_at DESC
LIMIT 3;

-- 5. Check student_progress table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'student_progress'
ORDER BY ordinal_position;

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- vocab_count: 10
-- phrases_count: 13 (10 from CREATE_TABLE.sql + 3 from INSERT_DAILY_PHRASES.sql)
-- Both tables should show proper Greek text (not German)

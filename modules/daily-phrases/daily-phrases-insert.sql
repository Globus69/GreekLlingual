-- ========================================
-- INSERT 3 DAILY PHRASES
-- ========================================
-- These phrases are translated from the German originals to Modern Greek

INSERT INTO daily_phrases (deck_id, greek_phrase, english_translation, category, difficulty) VALUES
('c8852ed2-ebb9-414c-ac90-4867c562561e',
 'Αυτή είναι μια όμορφη μέρα.',
 'This is a beautiful day.',
 'daily',
 'easy'),

('c8852ed2-ebb9-414c-ac90-4867c562561e',
 'Ο ήλιος δύει.',
 'The sun is setting.',
 'nature',
 'easy'),

('c8852ed2-ebb9-414c-ac90-4867c562561e',
 'Το φεγγάρι ανατέλλει.',
 'The moon is rising.',
 'nature',
 'medium');

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Run this to verify the inserts:
-- SELECT greek_phrase, english_translation, category
-- FROM daily_phrases
-- WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e'
-- ORDER BY created_at DESC
-- LIMIT 3;

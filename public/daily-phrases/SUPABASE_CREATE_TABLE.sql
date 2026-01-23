-- ========================================
-- DAILY PHRASES - SUPABASE TABLE
-- ========================================

-- Table: daily_phrases (stores Greek phrases and English translations)
CREATE TABLE IF NOT EXISTS daily_phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL,
    greek_phrase TEXT NOT NULL,
    english_translation TEXT NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_daily_phrases_deck ON daily_phrases(deck_id);
CREATE INDEX idx_daily_phrases_created ON daily_phrases(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_phrases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read daily phrases
CREATE POLICY "Daily phrases are viewable by everyone"
ON daily_phrases FOR SELECT
USING (true);

-- Sample data (insert some daily phrases)
INSERT INTO daily_phrases (deck_id, greek_phrase, english_translation, category, difficulty) VALUES
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Καλημέρα!' || E'\n' || 'Πώς είσαι;', 'Good morning!' || E'\n' || 'How are you?', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Ευχαριστώ πολύ.' || E'\n' || 'Είσαι πολύ ευγενικός.', 'Thank you very much.' || E'\n' || 'You are very kind.', 'courtesy', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Θα ήθελα ένα καφέ,' || E'\n' || 'παρακαλώ.', 'I would like a coffee,' || E'\n' || 'please.', 'ordering', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πού είναι η τουαλέτα,' || E'\n' || 'παρακαλώ;', 'Where is the restroom,' || E'\n' || 'please?', 'directions', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μιλάτε αγγλικά;' || E'\n' || 'Δεν καταλαβαίνω.', 'Do you speak English?' || E'\n' || 'I don''t understand.', 'communication', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πόσο κάνει αυτό;' || E'\n' || 'Μπορώ να πληρώσω με κάρτα;', 'How much is this?' || E'\n' || 'Can I pay by card?', 'shopping', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Συγνώμη, μπορείτε' || E'\n' || 'να με βοηθήσετε;', 'Excuse me, can you' || E'\n' || 'help me?', 'assistance', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι ώρα είναι;' || E'\n' || 'Τι μέρα είναι σήμερα;', 'What time is it?' || E'\n' || 'What day is today?', 'time', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Έχετε κάτι για' || E'\n' || 'χορτοφάγους;', 'Do you have something for' || E'\n' || 'vegetarians?', 'food', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μπορώ να έχω τον λογαριασμό,' || E'\n' || 'παρακαλώ;', 'Can I have the bill,' || E'\n' || 'please?', 'restaurant', 'easy');

-- ========================================
-- STUDENT_PROGRESS TABLE (If not exists)
-- ========================================
-- Note: The student_progress table should already exist for vocabulary
-- We'll add a phrase_id column if it doesn't exist

-- Add phrase_id column to student_progress (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'student_progress' AND column_name = 'phrase_id'
    ) THEN
        ALTER TABLE student_progress
        ADD COLUMN phrase_id UUID REFERENCES daily_phrases(id) ON DELETE CASCADE;

        CREATE INDEX idx_student_progress_phrase ON student_progress(phrase_id);
    END IF;
END $$;

-- Update UNIQUE constraint to handle both vocab_id and phrase_id
-- (One of them should be NULL, the other should have a value)
ALTER TABLE student_progress
DROP CONSTRAINT IF EXISTS student_progress_student_id_vocab_id_key;

ALTER TABLE student_progress
DROP CONSTRAINT IF EXISTS student_progress_student_id_phrase_id_key;

-- Create composite unique constraint that allows NULL
-- We use a partial unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS student_progress_vocab_unique
ON student_progress(student_id, vocab_id)
WHERE vocab_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS student_progress_phrase_unique
ON student_progress(student_id, phrase_id)
WHERE phrase_id IS NOT NULL;

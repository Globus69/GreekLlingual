-- ========================================
-- DAILY PHRASES - SUPABASE TABLES
-- ========================================

-- Table 1: phrases (stores the Greek phrases and English translations)
CREATE TABLE IF NOT EXISTS phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL,
    greek TEXT NOT NULL,
    english TEXT NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: phrase_progress (stores student progress for each phrase)
CREATE TABLE IF NOT EXISTS phrase_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
    ease DECIMAL(3,2) DEFAULT 2.5,
    interval INTEGER DEFAULT 1,
    due_date DATE DEFAULT CURRENT_DATE,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    correct_count INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, phrase_id)
);

-- Indexes for better performance
CREATE INDEX idx_phrases_deck ON phrases(deck_id);
CREATE INDEX idx_phrase_progress_student ON phrase_progress(student_id);
CREATE INDEX idx_phrase_progress_due ON phrase_progress(due_date);

-- Sample data (insert some daily phrases)
INSERT INTO phrases (deck_id, greek, english, category, difficulty) VALUES
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Καλημέρα!' || E'\n' || 'Πώς είσαι;', 'Good morning!' || E'\n' || 'How are you?', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Ευχαριστώ πολύ.' || E'\n' || 'Είσαι πολύ ευγενικός.', 'Thank you very much.' || E'\n' || 'You are very kind.', 'courtesy', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Θα ήθελα ένα καφέ,' || E'\n' || 'παρακαλώ.', 'I would like a coffee,' || E'\n' || 'please.', 'ordering', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πού είναι η τουαλέτα,' || E'\n' || 'παρακαλώ;', 'Where is the restroom,' || E'\n' || 'please?', 'directions', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μιλάτε αγγλικά;' || E'\n' || 'Δεν καταλαβαίνω.', 'Do you speak English?' || E'\n' || 'I don''t understand.', 'communication', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πόσο κάνει αυτό;' || E'\n' || 'Μπορώ να πληρώσω με κάρτα;', 'How much is this?' || E'\n' || 'Can I pay by card?', 'shopping', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Συγνώμη, μπορείτε' || E'\n' || 'να με βοηθήσετε;', 'Excuse me, can you' || E'\n' || 'help me?', 'assistance', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι ώρα είναι;' || E'\n' || 'Τι μέρα είναι σήμερα;', 'What time is it?' || E'\n' || 'What day is today?', 'time', 'easy');

-- Enable Row Level Security (RLS)
ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phrases (everyone can read)
CREATE POLICY "Public phrases are viewable by everyone"
ON phrases FOR SELECT
USING (true);

-- RLS Policies for phrase_progress (users can only access their own progress)
CREATE POLICY "Users can view own phrase progress"
ON phrase_progress FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own phrase progress"
ON phrase_progress FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own phrase progress"
ON phrase_progress FOR UPDATE
USING (auth.uid() = student_id);

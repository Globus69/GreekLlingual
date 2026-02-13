-- ========================================
-- TEST DATA FOR DAILY PHRASES
-- ========================================
-- This script creates the daily_phrases table (if it doesn't exist) and inserts test data
-- Run this in your Supabase SQL editor to populate the database with test data
--
-- IMPORTANT: If you get errors about student_id or student_progress table,
-- first run: supabase/setup_student_progress_for_phrases.sql
-- ========================================

-- Create the daily_phrases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.daily_phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL,
    greek_phrase TEXT NOT NULL,
    english_translation TEXT NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_phrases_deck ON public.daily_phrases(deck_id);
CREATE INDEX IF NOT EXISTS idx_daily_phrases_created ON public.daily_phrases(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_phrases ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Daily phrases are viewable by everyone" ON public.daily_phrases;
CREATE POLICY "Daily phrases are viewable by everyone"
ON public.daily_phrases FOR SELECT
USING (true);

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.daily_phrases WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e';

-- Insert test daily phrases
INSERT INTO public.daily_phrases (deck_id, greek_phrase, english_translation, category, difficulty)
VALUES 
-- Greetings & Basic Communication
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Καλημέρα!', 'Good morning!', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Καλησπέρα!', 'Good evening!', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Καληνύχτα!', 'Good night!', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πώς είσαι;', 'How are you?', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι κάνεις;', 'What are you doing?', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Είμαι καλά, ευχαριστώ.', 'I am fine, thank you.', 'greetings', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Χαίρομαι που σε γνωρίζω.', 'Nice to meet you.', 'greetings', 'medium'),

-- Courtesy & Politeness
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Ευχαριστώ πολύ.', 'Thank you very much.', 'courtesy', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Παρακαλώ.', 'Please / You are welcome.', 'courtesy', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Συγγνώμη.', 'Sorry / Excuse me.', 'courtesy', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Δεν πειράζει.', 'No problem / It does not matter.', 'courtesy', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Είσαι πολύ ευγενικός.', 'You are very kind.', 'courtesy', 'medium'),

-- Asking for Help & Directions
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μπορείτε να με βοηθήσετε;', 'Can you help me?', 'assistance', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πού είναι η τουαλέτα;', 'Where is the restroom?', 'directions', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πού είναι ο σταθμός;', 'Where is the station?', 'directions', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πώς πάω στο...;', 'How do I get to...?', 'directions', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Είναι μακριά;', 'Is it far?', 'directions', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πώς λέγεται αυτό;', 'What is this called?', 'assistance', 'medium'),

-- Communication
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μιλάτε αγγλικά;', 'Do you speak English?', 'communication', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Δεν καταλαβαίνω.', 'I do not understand.', 'communication', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μπορείτε να το επαναλάβετε;', 'Can you repeat that?', 'communication', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μιλάτε πιο αργά, παρακαλώ.', 'Please speak more slowly.', 'communication', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι είπατε;', 'What did you say?', 'communication', 'easy'),

-- Restaurant & Food
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Θα ήθελα ένα καφέ, παρακαλώ.', 'I would like a coffee, please.', 'ordering', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μπορώ να δω το μενού;', 'Can I see the menu?', 'restaurant', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι προτείνετε;', 'What do you recommend?', 'restaurant', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Έχετε κάτι για χορτοφάγους;', 'Do you have something for vegetarians?', 'food', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μπορώ να έχω τον λογαριασμό, παρακαλώ;', 'Can I have the bill, please?', 'restaurant', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Είναι νόστιμο!', 'It is delicious!', 'food', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Θα ήθελα νερό, παρακαλώ.', 'I would like water, please.', 'ordering', 'easy'),

-- Shopping
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πόσο κάνει αυτό;', 'How much is this?', 'shopping', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μπορώ να το δοκιμάσω;', 'Can I try it on?', 'shopping', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μπορώ να πληρώσω με κάρτα;', 'Can I pay by card?', 'shopping', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Έχετε αυτό σε άλλο μέγεθος;', 'Do you have this in another size?', 'shopping', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Είναι πολύ ακριβό.', 'It is very expensive.', 'shopping', 'easy'),

-- Time & Dates
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι ώρα είναι;', 'What time is it?', 'time', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι μέρα είναι σήμερα;', 'What day is today?', 'time', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πότε;', 'When?', 'time', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Σήμερα.', 'Today.', 'time', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Αύριο.', 'Tomorrow.', 'time', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Χθες.', 'Yesterday.', 'time', 'easy'),

-- Emergency & Health
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Βοήθεια!', 'Help!', 'emergency', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Καλέστε έναν γιατρό!', 'Call a doctor!', 'emergency', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πού είναι το νοσοκομείο;', 'Where is the hospital?', 'emergency', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Αισθάνομαι άσχημα.', 'I feel bad.', 'health', 'medium'),

-- Travel & Transportation
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πού είναι το αεροδρόμιο;', 'Where is the airport?', 'travel', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πόσο κοστίζει το εισιτήριο;', 'How much does the ticket cost?', 'travel', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πότε φεύγει το τρένο;', 'When does the train leave?', 'travel', 'medium'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Πού είναι το ξενοδοχείο;', 'Where is the hotel?', 'travel', 'easy'),

-- Weather & Nature
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Τι καιρός κάνει;', 'What is the weather like?', 'weather', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Είναι ζεστά σήμερα.', 'It is warm today.', 'weather', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Βρέχει.', 'It is raining.', 'weather', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Ο ήλιος λάμπει.', 'The sun is shining.', 'weather', 'easy'),

-- Common Expressions
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Συγνώμη, μπορείτε να με βοηθήσετε;', 'Excuse me, can you help me?', 'assistance', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Δεν ξέρω.', 'I do not know.', 'common', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Ναι.', 'Yes.', 'common', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Όχι.', 'No.', 'common', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Μάλλον.', 'Maybe / Probably.', 'common', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Φυσικά!', 'Of course!', 'common', 'easy'),
('c8852ed2-ebb9-414c-ac90-4867c562561e', 'Εντάξει.', 'Okay / Alright.', 'common', 'easy');

-- ========================================
-- Verification Query
-- ========================================
-- Run this to verify the data was inserted:
-- SELECT COUNT(*) FROM public.daily_phrases WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e';
-- SELECT * FROM public.daily_phrases WHERE deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e' ORDER BY created_at DESC LIMIT 10;

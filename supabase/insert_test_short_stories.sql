-- ========================================
-- SHORT STORIES – Table & Test Data
-- ========================================
-- Creates short_stories table and inserts demo rows.
-- Each row: greek_text (upper frame), english_text (lower frame), audio_url (MP3).
-- Run in Supabase SQL Editor.
--
-- Audio: Place audio files in public/audio/short-stories/ (e.g. 1.mp3, 2.mp3)
--        and use URLs like /audio/short-stories/1.mp3, or use absolute URLs.
--
-- Bewertungen: Pro Abschnitt Hard/Good/Easy → short_story_section_ratings.
-- ========================================

CREATE TABLE IF NOT EXISTS public.short_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    greek_text TEXT NOT NULL,
    english_text TEXT NOT NULL,
    audio_url TEXT,
    title VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_stories_created ON public.short_stories(created_at);

ALTER TABLE public.short_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Short stories are viewable by everyone" ON public.short_stories;
CREATE POLICY "Short stories are viewable by everyone"
ON public.short_stories FOR SELECT
USING (true);

-- Demo data. Replace audio_url with your MP3 paths (e.g. /audio/short-stories/1.mp3).
INSERT INTO public.short_stories (greek_text, english_text, audio_url, title)
VALUES
(
    'Καλημέρα! Ονομάζομαι Μαρία. Μιλάω ελληνικά και αγγλικά. Σήμερα η μέρα είναι όμορφη.',
    'Good morning! My name is Maria. I speak Greek and English. Today the weather is beautiful.',
    '/audio/short-stories/1.mp3',
    'Maria says hello'
),
(
    'Πώς σε λένε; Είμαι από την Ελλάδα. Μου αρέσει η θάλασσα και το φαγητό.',
    'What is your name? I am from Greece. I like the sea and the food.',
    '/audio/short-stories/2.mp3',
    'Introduction'
),
(
    'Πού μένεις; Εγώ μένω στην Αθήνα. Το σπίτι μου είναι κοντά στην ακρόπολη.',
    'Where do you live? I live in Athens. My house is near the Acropolis.',
    '/audio/short-stories/3.mp3',
    'Where you live'
),
(
    'Τι ώρα είναι; Θέλω να πάω στο καφενείο. Ο καφές εδώ είναι πολύ καλός.',
    'What time is it? I want to go to the café. The coffee here is very good.',
    '/audio/short-stories/4.mp3',
    'Time and café'
),
(
    'Συγγνώμη, πού είναι η τουαλέτα; Ευχαριστώ πολύ. Είσαι πολύ ευγενικός.',
    'Excuse me, where is the restroom? Thank you very much. You are very kind.',
    '/audio/short-stories/5.mp3',
    'Asking for help'
);

-- ========================================
-- SHORT STORY SECTION RATINGS (Hard / Good / Easy pro Abschnitt)
-- ========================================
CREATE TABLE IF NOT EXISTS public.short_story_section_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    story_id UUID NOT NULL REFERENCES public.short_stories(id) ON DELETE CASCADE,
    section_index INT NOT NULL,
    rating TEXT NOT NULL CHECK (rating IN ('hard', 'good', 'easy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, story_id, section_index)
);

CREATE INDEX IF NOT EXISTS idx_short_story_section_ratings_story
    ON public.short_story_section_ratings(story_id);
CREATE INDEX IF NOT EXISTS idx_short_story_section_ratings_student
    ON public.short_story_section_ratings(student_id);

ALTER TABLE public.short_story_section_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own section ratings" ON public.short_story_section_ratings;
CREATE POLICY "Users manage own section ratings"
ON public.short_story_section_ratings FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Verification:
-- SELECT * FROM public.short_stories ORDER BY created_at;
-- SELECT * FROM public.short_story_section_ratings;

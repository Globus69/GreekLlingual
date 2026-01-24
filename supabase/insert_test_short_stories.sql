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

-- Alle Stories löschen (Ratings werden per CASCADE mitgelöscht).
DELETE FROM public.short_stories;

-- Eine Story mit genau 5 Abschnitten. Trennzeichen: |||SECTION|||
-- Lorem Ipsum Platzhalter zum Testen. Ein Abschnitt = ein Druck auf ▲/▼.
-- Jeder Abschnitt max. 100 Zeichen.
INSERT INTO public.short_stories (greek_text, english_text, audio_url, title)
VALUES (
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.|||SECTION|||Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.|||SECTION|||Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.|||SECTION|||Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.|||SECTION|||Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.|||SECTION|||Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.|||SECTION|||Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.|||SECTION|||Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.|||SECTION|||Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.',
    '/audio/short-stories/1.mp3',
    '5 Abschnitte – Lorem Ipsum'
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

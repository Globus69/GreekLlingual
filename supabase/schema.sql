-- GreekLingua Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL, -- 4-6 digit pin stored as text
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STUDENTS (Profiles/Courses)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    page_slug TEXT UNIQUE NOT NULL, -- used for dynamic routing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VOCABS (The "Brain")
CREATE TABLE IF NOT EXISTS public.vocabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    term TEXT NOT NULL, -- The English/Greek word
    translation TEXT NOT NULL,
    example_sentence_term TEXT,
    example_sentence_translation TEXT,
    
    -- Spaced Repetition Data (SRT)
    due_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_interval INTEGER DEFAULT 0, -- Days until next review
    repetition_count INTEGER DEFAULT 0, -- How many times reviewed
    ease_factor FLOAT DEFAULT 2.5, -- SM2 algorithm constant
    
    -- Assets
    audio_url TEXT,
    video_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS POLICIES

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabs ENABLE ROW LEVEL SECURITY;

-- Note: In a real app, users would only see their own data. 
-- For this MVP/Mockup phase, we might simplify or use Service Role.
-- Here are the standard policies:

CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can manage their own students" ON public.students 
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage vocabs through their students" ON public.vocabs 
    FOR ALL USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_vocabs_student_id ON public.vocabs(student_id);
CREATE INDEX IF NOT EXISTS idx_vocabs_due_date ON public.vocabs(due_date);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

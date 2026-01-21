-- Create learning_items table
CREATE TABLE IF NOT EXISTS public.learning_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    english TEXT NOT NULL,
    greek TEXT NOT NULL,
    example_en TEXT,
    example_gr TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create student_progress table for SRS tracking
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES public.learning_items(id) ON DELETE CASCADE,
    student_id UUID NOT NULL, -- Linked to the user or student account
    correct_count INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    interval_days FLOAT DEFAULT 1.0,
    ease_factor FLOAT DEFAULT 2.5,
    UNIQUE(item_id, student_id)
);

-- Enable RLS (simplified for the web prototype)
ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read learning_items" ON public.learning_items FOR SELECT USING (true);
CREATE POLICY "Allow all edit student_progress" ON public.student_progress FOR ALL USING (true);

-- Seed learning_items
INSERT INTO public.learning_items (type, english, greek, example_en, example_gr)
VALUES 
('vocabulary', 'Hello', 'Γεια σου', 'Hello friend', 'Γεια σου φίλε'),
('vocabulary', 'Thank you', 'Ευχαριστώ', 'Thank you very much', 'Ευχαριστώ πολύ'),
('vocabulary', 'Water', 'Νερό', 'I want water', 'Θέλω νερό'),
('vocabulary', 'Bread', 'Ψωμί', 'Fresh bread', 'Φρέσκο ψωμί'),
('vocabulary', 'God', 'Θεός', 'Oh my God', 'Ω Θεέ μου'),
('vocabulary', 'Love', 'Αγάπη', 'I love you', 'Σ''αγαπώ'),
('vocabulary', 'Friend', 'Φίλος', 'Best friend', 'Καλύτερος φίλος'),
('vocabulary', 'City', 'Πόλη', 'Beautiful city', 'Όμορφη πόλη'),
('vocabulary', 'Beach', 'Παραλία', 'Go to the beach', 'Πάω στην παραλία'),
('vocabulary', 'Coffee', 'Καφές', 'Drink coffee', 'Πίνω καφέ');

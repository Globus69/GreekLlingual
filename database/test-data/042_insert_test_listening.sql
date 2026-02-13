-- ========================================
-- TEST LISTENING FOR GREEK LINGUA
-- ========================================
-- This script inserts test listening exercises into the learning_items table
-- Run this in your Supabase SQL editor to populate the database with test data
-- ========================================
-- Note: example_en contains JSON with options array and correct answer index
-- Format: {"options": ["Option 1", "Option 2", "Option 3"], "correct": 0}
-- ========================================

-- Add audio_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'learning_items'
        AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE public.learning_items
        ADD COLUMN audio_url TEXT;
        
        RAISE NOTICE 'Added audio_url column to learning_items table';
    ELSE
        RAISE NOTICE 'audio_url column already exists';
    END IF;
END $$;

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.learning_items WHERE type = 'listening';

-- Insert test listening exercises
INSERT INTO public.learning_items (type, english, greek, example_en, example_gr, audio_url)
VALUES 
-- Basic Greetings
('listening', 'Listen and choose what you hear', 'Γεια σου', 
 '{"options": ["Hello", "Thank you", "Goodbye"], "correct": 0}',
 'Thank you',
 'https://example.com/audio/gia-sou.mp3'),

('listening', 'Listen and choose what you hear', 'Ευχαριστώ', 
 '{"options": ["Hello", "Thank you", "Please"], "correct": 1}',
 'Please',
 'https://example.com/audio/efharisto.mp3'),

('listening', 'Listen and choose what you hear', 'Αντίο', 
 '{"options": ["Hello", "Thank you", "Goodbye"], "correct": 2}',
 'Hello',
 'https://example.com/audio/antio.mp3'),

('listening', 'Listen and choose what you hear', 'Παρακαλώ', 
 '{"options": ["Please", "Thank you", "Sorry"], "correct": 0}',
 'Thank you',
 'https://example.com/audio/parakalo.mp3'),

('listening', 'Listen and choose what you hear', 'Συγγνώμη', 
 '{"options": ["Please", "Thank you", "Sorry"], "correct": 2}',
 'Please',
 'https://example.com/audio/siggnomi.mp3'),

-- Numbers
('listening', 'Listen and choose the number you hear', 'Ένα', 
 '{"options": ["One", "Two", "Three"], "correct": 0}',
 'Two',
 'https://example.com/audio/ena.mp3'),

('listening', 'Listen and choose the number you hear', 'Δύο', 
 '{"options": ["One", "Two", "Three"], "correct": 1}',
 'Three',
 'https://example.com/audio/dio.mp3'),

('listening', 'Listen and choose the number you hear', 'Τρία', 
 '{"options": ["One", "Two", "Three"], "correct": 2}',
 'One',
 'https://example.com/audio/tria.mp3'),

('listening', 'Listen and choose the number you hear', 'Δέκα', 
 '{"options": ["Five", "Ten", "Twenty"], "correct": 1}',
 'Five',
 'https://example.com/audio/deka.mp3'),

('listening', 'Listen and choose the number you hear', 'Είκοσι', 
 '{"options": ["Five", "Ten", "Twenty"], "correct": 2}',
 'Ten',
 'https://example.com/audio/eikosi.mp3'),

-- Common Words - Food
('listening', 'Listen and choose what you hear', 'Νερό', 
 '{"options": ["Water", "Bread", "Coffee"], "correct": 0}',
 'Bread',
 'https://example.com/audio/nero.mp3'),

('listening', 'Listen and choose what you hear', 'Ψωμί', 
 '{"options": ["Water", "Bread", "Coffee"], "correct": 1}',
 'Coffee',
 'https://example.com/audio/psomi.mp3'),

('listening', 'Listen and choose what you hear', 'Καφές', 
 '{"options": ["Water", "Bread", "Coffee"], "correct": 2}',
 'Water',
 'https://example.com/audio/kafes.mp3'),

('listening', 'Listen and choose what you hear', 'Τυρί', 
 '{"options": ["Cheese", "Meat", "Fish"], "correct": 0}',
 'Meat',
 'https://example.com/audio/tiri.mp3'),

('listening', 'Listen and choose what you hear', 'Κρέας', 
 '{"options": ["Cheese", "Meat", "Fish"], "correct": 1}',
 'Fish',
 'https://example.com/audio/kreas.mp3'),

('listening', 'Listen and choose what you hear', 'Ψάρι', 
 '{"options": ["Cheese", "Meat", "Fish"], "correct": 2}',
 'Cheese',
 'https://example.com/audio/psari.mp3'),

-- Common Words - People & Family
('listening', 'Listen and choose what you hear', 'Φίλος', 
 '{"options": ["Friend", "Family", "Mother"], "correct": 0}',
 'Family',
 'https://example.com/audio/filos.mp3'),

('listening', 'Listen and choose what you hear', 'Οικογένεια', 
 '{"options": ["Friend", "Family", "Mother"], "correct": 1}',
 'Mother',
 'https://example.com/audio/oikogeneia.mp3'),

('listening', 'Listen and choose what you hear', 'Μητέρα', 
 '{"options": ["Friend", "Family", "Mother"], "correct": 2}',
 'Friend',
 'https://example.com/audio/mitera.mp3'),

('listening', 'Listen and choose what you hear', 'Πατέρας', 
 '{"options": ["Father", "Mother", "Brother"], "correct": 0}',
 'Mother',
 'https://example.com/audio/pateras.mp3'),

-- Time & Days
('listening', 'Listen and choose what you hear', 'Καλημέρα', 
 '{"options": ["Good morning", "Good evening", "Good night"], "correct": 0}',
 'Good evening',
 'https://example.com/audio/kalimera.mp3'),

('listening', 'Listen and choose what you hear', 'Καλησπέρα', 
 '{"options": ["Good morning", "Good evening", "Good night"], "correct": 1}',
 'Good night',
 'https://example.com/audio/kalispera.mp3'),

('listening', 'Listen and choose what you hear', 'Καληνύχτα', 
 '{"options": ["Good morning", "Good evening", "Good night"], "correct": 2}',
 'Good morning',
 'https://example.com/audio/kalinyhta.mp3'),

-- Questions
('listening', 'Listen and choose what you hear', 'Πώς σε λένε;', 
 '{"options": ["What is your name?", "How are you?", "Where are you from?"], "correct": 0}',
 'How are you?',
 'https://example.com/audio/pos-se-lene.mp3'),

('listening', 'Listen and choose what you hear', 'Πώς είσαι;', 
 '{"options": ["What is your name?", "How are you?", "Where are you from?"], "correct": 1}',
 'Where are you from?',
 'https://example.com/audio/pos-eisai.mp3'),

('listening', 'Listen and choose what you hear', 'Από πού είσαι;', 
 '{"options": ["What is your name?", "How are you?", "Where are you from?"], "correct": 2}',
 'What is your name?',
 'https://example.com/audio/apo-pou-eisai.mp3'),

-- Verbs
('listening', 'Listen and choose what you hear', 'Κάνω', 
 '{"options": ["I do", "I go", "I see"], "correct": 0}',
 'I go',
 'https://example.com/audio/kano.mp3'),

('listening', 'Listen and choose what you hear', 'Πάω', 
 '{"options": ["I do", "I go", "I see"], "correct": 1}',
 'I see',
 'https://example.com/audio/pao.mp3'),

('listening', 'Listen and choose what you hear', 'Βλέπω', 
 '{"options": ["I do", "I go", "I see"], "correct": 2}',
 'I do',
 'https://example.com/audio/vlepo.mp3'),

('listening', 'Listen and choose what you hear', 'Είμαι', 
 '{"options": ["I am", "I have", "I want"], "correct": 0}',
 'I have',
 'https://example.com/audio/eimai.mp3'),

('listening', 'Listen and choose what you hear', 'Έχω', 
 '{"options": ["I am", "I have", "I want"], "correct": 1}',
 'I want',
 'https://example.com/audio/echo.mp3'),

('listening', 'Listen and choose what you hear', 'Θέλω', 
 '{"options": ["I am", "I have", "I want"], "correct": 2}',
 'I am',
 'https://example.com/audio/thelo.mp3'),

-- Places
('listening', 'Listen and choose what you hear', 'Σπίτι', 
 '{"options": ["House", "School", "Shop"], "correct": 0}',
 'School',
 'https://example.com/audio/spiti.mp3'),

('listening', 'Listen and choose what you hear', 'Σχολείο', 
 '{"options": ["House", "School", "Shop"], "correct": 1}',
 'Shop',
 'https://example.com/audio/scholeio.mp3'),

('listening', 'Listen and choose what you hear', 'Κατάστημα', 
 '{"options": ["House", "School", "Shop"], "correct": 2}',
 'House',
 'https://example.com/audio/katastima.mp3'),

-- Colors
('listening', 'Listen and choose what you hear', 'Κόκκινο', 
 '{"options": ["Red", "Blue", "Green"], "correct": 0}',
 'Blue',
 'https://example.com/audio/kokkino.mp3'),

('listening', 'Listen and choose what you hear', 'Μπλε', 
 '{"options": ["Red", "Blue", "Green"], "correct": 1}',
 'Green',
 'https://example.com/audio/mple.mp3'),

('listening', 'Listen and choose what you hear', 'Πράσινο', 
 '{"options": ["Red", "Blue", "Green"], "correct": 2}',
 'Red',
 'https://example.com/audio/prasino.mp3');

-- ========================================
-- Note: 
-- - audio_url contains placeholder URLs. Replace with actual MP3 file URLs.
-- - The correct answer index (0, 1, or 2) corresponds to the position in the options array.
-- - Wrong answers are automatically tracked in student_progress for later review.
-- ========================================

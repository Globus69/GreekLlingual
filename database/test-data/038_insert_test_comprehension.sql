-- ========================================
-- TEST COMPREHENSION FOR GREEK LINGUA
-- ========================================
-- This script inserts test comprehension items into the learning_items table
-- Run this in your Supabase SQL editor to populate the database with test data
-- ========================================

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.learning_items WHERE type = 'comprehension';

-- Insert test comprehension items
INSERT INTO public.learning_items (type, english, greek, example_en, example_gr)
VALUES 
-- Basic Questions & Responses
('comprehension', 'What is your name?', 'Πώς σε λένε;', 'What is your name?', 'Πώς σε λένε; Με λένε Μαρία.'),
('comprehension', 'How are you?', 'Πώς είσαι;', 'How are you?', 'Πώς είσαι; Είμαι καλά, ευχαριστώ.'),
('comprehension', 'Where are you from?', 'Από πού είσαι;', 'Where are you from?', 'Από πού είσαι; Είμαι από την Ελλάδα.'),
('comprehension', 'How old are you?', 'Πόσων χρονών είσαι;', 'How old are you?', 'Πόσων χρονών είσαι; Είμαι είκοσι πέντε χρονών.'),
('comprehension', 'What do you do?', 'Τι κάνεις;', 'What do you do? (profession)', 'Τι κάνεις; Είμαι δάσκαλος.'),
('comprehension', 'Where do you live?', 'Πού μένεις;', 'Where do you live?', 'Πού μένεις; Μένω στην Αθήνα.'),
('comprehension', 'Do you speak Greek?', 'Μιλάς ελληνικά;', 'Do you speak Greek?', 'Μιλάς ελληνικά; Ναι, μιλάω λίγα ελληνικά.'),
('comprehension', 'What time is it?', 'Τι ώρα είναι;', 'What time is it?', 'Τι ώρα είναι; Είναι τρεις η ώρα.'),

-- Understanding & Communication
('comprehension', 'I understand', 'Καταλαβαίνω', 'I understand', 'Καταλαβαίνω τι λες.'),
('comprehension', 'I don''t understand', 'Δεν καταλαβαίνω', 'I don''t understand', 'Δεν καταλαβαίνω τι λες.'),
('comprehension', 'Can you repeat?', 'Μπορείς να επαναλάβεις;', 'Can you repeat?', 'Μπορείς να επαναλάβεις, παρακαλώ;'),
('comprehension', 'What does this mean?', 'Τι σημαίνει αυτό;', 'What does this mean?', 'Τι σημαίνει αυτή η λέξη;'),
('comprehension', 'Can you speak slower?', 'Μπορείς να μιλήσεις πιο αργά;', 'Can you speak slower?', 'Μπορείς να μιλήσεις πιο αργά, παρακαλώ;'),
('comprehension', 'Can you speak louder?', 'Μπορείς να μιλήσεις πιο δυνατά;', 'Can you speak louder?', 'Μπορείς να μιλήσεις πιο δυνατά, παρακαλώ;'),
('comprehension', 'I need help', 'Χρειάζομαι βοήθεια', 'I need help', 'Χρειάζομαι βοήθεια με αυτό.'),
('comprehension', 'Can you help me?', 'Μπορείς να με βοηθήσεις;', 'Can you help me?', 'Μπορείς να με βοηθήσεις, παρακαλώ;'),

-- Confirmation & Agreement
('comprehension', 'That''s correct', 'Αυτό είναι σωστό', 'That''s correct', 'Αυτό είναι σωστό, μπράβο!'),
('comprehension', 'That''s wrong', 'Αυτό είναι λάθος', 'That''s wrong', 'Αυτό είναι λάθος, δοκίμασε ξανά.'),
('comprehension', 'I agree', 'Συμφωνώ', 'I agree', 'Συμφωνώ μαζί σου.'),
('comprehension', 'I disagree', 'Διαφωνώ', 'I disagree', 'Διαφωνώ μαζί σου.'),
('comprehension', 'That''s right', 'Αυτό είναι σωστό', 'That''s right', 'Αυτό είναι σωστό.'),
('comprehension', 'Exactly', 'Ακριβώς', 'Exactly', 'Ακριβώς, έτσι είναι.'),

-- Requests & Instructions
('comprehension', 'Can you show me?', 'Μπορείς να μου δείξεις;', 'Can you show me?', 'Μπορείς να μου δείξεις πώς γίνεται;'),
('comprehension', 'Can you explain?', 'Μπορείς να εξηγήσεις;', 'Can you explain?', 'Μπορείς να εξηγήσεις αυτό;'),
('comprehension', 'What should I do?', 'Τι πρέπει να κάνω;', 'What should I do?', 'Τι πρέπει να κάνω τώρα;'),
('comprehension', 'How do I do this?', 'Πώς το κάνω αυτό;', 'How do I do this?', 'Πώς το κάνω αυτό;'),
('comprehension', 'Can you write it?', 'Μπορείς να το γράψεις;', 'Can you write it?', 'Μπορείς να το γράψεις, παρακαλώ;'),
('comprehension', 'Can you read it?', 'Μπορείς να το διαβάσεις;', 'Can you read it?', 'Μπορείς να το διαβάσεις, παρακαλώ;'),

-- Feelings & Opinions
('comprehension', 'I like it', 'Μου αρέσει', 'I like it', 'Μου αρέσει πολύ.'),
('comprehension', 'I don''t like it', 'Δεν μου αρέσει', 'I don''t like it', 'Δεν μου αρέσει καθόλου.'),
('comprehension', 'I love it', 'Το αγαπώ', 'I love it', 'Το αγαπώ πολύ.'),
('comprehension', 'I hate it', 'Το μισώ', 'I hate it', 'Το μισώ.'),
('comprehension', 'I think so', 'Νομίζω ότι ναι', 'I think so', 'Νομίζω ότι ναι.'),
('comprehension', 'I don''t think so', 'Δεν νομίζω', 'I don''t think so', 'Δεν νομίζω ότι είναι έτσι.'),

-- Time & Schedule
('comprehension', 'What day is it?', 'Τι μέρα είναι;', 'What day is it?', 'Τι μέρα είναι σήμερα;'),
('comprehension', 'What date is it?', 'Τι ημερομηνία είναι;', 'What date is it?', 'Τι ημερομηνία είναι σήμερα;'),
('comprehension', 'When?', 'Πότε;', 'When?', 'Πότε θα έρθεις;'),
('comprehension', 'How long?', 'Πόσο καιρό;', 'How long?', 'Πόσο καιρό θα κάνεις;'),
('comprehension', 'How often?', 'Πόσο συχνά;', 'How often?', 'Πόσο συχνά το κάνεις;'),

-- Location & Directions
('comprehension', 'Where is...?', 'Πού είναι...;', 'Where is...?', 'Πού είναι το σούπερ μάρκετ;'),
('comprehension', 'How do I get there?', 'Πώς πάω εκεί;', 'How do I get there?', 'Πώς πάω εκεί;'),
('comprehension', 'Is it far?', 'Είναι μακριά;', 'Is it far?', 'Είναι μακριά από εδώ;'),
('comprehension', 'Is it near?', 'Είναι κοντά;', 'Is it near?', 'Είναι κοντά εδώ;'),
('comprehension', 'Turn left', 'Στρίψε αριστερά', 'Turn left', 'Στρίψε αριστερά στο επόμενο δρόμο.'),
('comprehension', 'Turn right', 'Στρίψε δεξιά', 'Turn right', 'Στρίψε δεξιά στο επόμενο δρόμο.'),

-- Shopping & Money
('comprehension', 'How much does it cost?', 'Πόσο κοστίζει;', 'How much does it cost?', 'Πόσο κοστίζει αυτό;'),
('comprehension', 'I want to buy', 'Θέλω να αγοράσω', 'I want to buy', 'Θέλω να αγοράσω αυτό.'),
('comprehension', 'Do you have...?', 'Έχετε...;', 'Do you have...?', 'Έχετε αυτό το βιβλίο;'),
('comprehension', 'It''s too expensive', 'Είναι πολύ ακριβό', 'It''s too expensive', 'Είναι πολύ ακριβό για μένα.'),
('comprehension', 'It''s cheap', 'Είναι φθηνό', 'It''s cheap', 'Είναι φθηνό.'),
('comprehension', 'Can I pay by card?', 'Μπορώ να πληρώσω με κάρτα;', 'Can I pay by card?', 'Μπορώ να πληρώσω με κάρτα;'),

-- Food & Dining
('comprehension', 'I''m hungry', 'Πεινάω', 'I''m hungry', 'Πεινάω πολύ.'),
('comprehension', 'I''m thirsty', 'Διψάω', 'I''m thirsty', 'Διψάω, θέλω νερό.'),
('comprehension', 'What would you like?', 'Τι θα θέλατε;', 'What would you like?', 'Τι θα θέλατε να φάτε;'),
('comprehension', 'I would like...', 'Θα ήθελα...', 'I would like...', 'Θα ήθελα ένα καφέ, παρακαλώ.'),
('comprehension', 'The bill, please', 'Τον λογαριασμό, παρακαλώ', 'The bill, please', 'Τον λογαριασμό, παρακαλώ.'),
('comprehension', 'It''s delicious', 'Είναι νόστιμο', 'It''s delicious', 'Είναι πολύ νόστιμο!'),

-- Health & Emergency
('comprehension', 'I feel sick', 'Αισθάνομαι άρρωστος', 'I feel sick', 'Αισθάνομαι άρρωστος.'),
('comprehension', 'I need a doctor', 'Χρειάζομαι γιατρό', 'I need a doctor', 'Χρειάζομαι γιατρό, παρακαλώ.'),
('comprehension', 'Where is the hospital?', 'Πού είναι το νοσοκομείο;', 'Where is the hospital?', 'Πού είναι το πλησιέστερο νοσοκομείο;'),
('comprehension', 'Call an ambulance', 'Καλέστε ασθενοφόρο', 'Call an ambulance', 'Καλέστε ασθενοφόρο, παρακαλώ.'),
('comprehension', 'I have a headache', 'Πονάει το κεφάλι μου', 'I have a headache', 'Πονάει το κεφάλι μου.'),

-- Weather & Nature
('comprehension', 'What''s the weather like?', 'Πώς είναι ο καιρός;', 'What''s the weather like?', 'Πώς είναι ο καιρός σήμερα;'),
('comprehension', 'It''s sunny', 'Είναι ηλιόλουστο', 'It''s sunny', 'Είναι ηλιόλουστο σήμερα.'),
('comprehension', 'It''s raining', 'Βρέχει', 'It''s raining', 'Βρέχει πολύ.'),
('comprehension', 'It''s cold', 'Είναι κρύο', 'It''s cold', 'Είναι πολύ κρύο σήμερα.'),
('comprehension', 'It''s hot', 'Είναι ζεστό', 'It''s hot', 'Είναι πολύ ζεστό σήμερα.');

-- ========================================
-- Note: After inserting, you may want to create student_progress entries
-- for testing. You can use the setup_student_progress_for_phrases.sql
-- as a template, but change 'phrases' to 'comprehension' in the WHERE clause.
-- ========================================

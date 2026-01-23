-- ========================================
-- TEST GRAMMAR FOR GREEK LINGUA
-- ========================================
-- This script inserts test grammar items into the learning_items table
-- Run this in your Supabase SQL editor to populate the database with test data
-- ========================================

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.learning_items WHERE type = 'grammar';

-- Insert test grammar items
INSERT INTO public.learning_items (type, english, greek, example_en, example_gr)
VALUES 
-- Present Tense Conjugations
('grammar', 'Present Tense - First Person', 'Εγώ κάνω', 'I do / I make', 'Εγώ κάνω την εργασία'),
('grammar', 'Present Tense - Second Person', 'Εσύ κάνεις', 'You do / You make', 'Εσύ κάνεις καλά'),
('grammar', 'Present Tense - Third Person', 'Αυτός/Αυτή/Αυτό κάνει', 'He/She/It does', 'Αυτός κάνει δουλειά'),
('grammar', 'Present Tense - First Person Plural', 'Εμείς κάνουμε', 'We do / We make', 'Εμείς κάνουμε μαζί'),
('grammar', 'Present Tense - Second Person Plural', 'Εσείς κάνετε', 'You (plural) do', 'Εσείς κάνετε καλά'),
('grammar', 'Present Tense - Third Person Plural', 'Αυτοί/Αυτές/Αυτά κάνουν', 'They do', 'Αυτοί κάνουν δουλειά'),

-- Definite Articles
('grammar', 'Definite Article - Masculine Singular', 'Ο', 'The (masculine)', 'Ο άνθρωπος'),
('grammar', 'Definite Article - Feminine Singular', 'Η', 'The (feminine)', 'Η γυναίκα'),
('grammar', 'Definite Article - Neuter Singular', 'Το', 'The (neuter)', 'Το παιδί'),
('grammar', 'Definite Article - Masculine Plural', 'Οι', 'The (masculine plural)', 'Οι άνθρωποι'),
('grammar', 'Definite Article - Feminine Plural', 'Οι', 'The (feminine plural)', 'Οι γυναίκες'),
('grammar', 'Definite Article - Neuter Plural', 'Τα', 'The (neuter plural)', 'Τα παιδιά'),

-- Verb "to be" - Present Tense
('grammar', 'Verb "to be" - I am', 'Εγώ είμαι', 'I am', 'Εγώ είμαι εδώ'),
('grammar', 'Verb "to be" - You are', 'Εσύ είσαι', 'You are', 'Εσύ είσαι καλά'),
('grammar', 'Verb "to be" - He/She/It is', 'Αυτός/Αυτή/Αυτό είναι', 'He/She/It is', 'Αυτός είναι εδώ'),
('grammar', 'Verb "to be" - We are', 'Εμείς είμαστε', 'We are', 'Εμείς είμαστε φίλοι'),
('grammar', 'Verb "to be" - You (plural) are', 'Εσείς είστε', 'You (plural) are', 'Εσείς είστε εδώ'),
('grammar', 'Verb "to be" - They are', 'Αυτοί/Αυτές/Αυτά είναι', 'They are', 'Αυτοί είναι φίλοι'),

-- Verb "to have" - Present Tense
('grammar', 'Verb "to have" - I have', 'Εγώ έχω', 'I have', 'Εγώ έχω ένα βιβλίο'),
('grammar', 'Verb "to have" - You have', 'Εσύ έχεις', 'You have', 'Εσύ έχεις χρόνο'),
('grammar', 'Verb "to have" - He/She/It has', 'Αυτός/Αυτή/Αυτό έχει', 'He/She/It has', 'Αυτός έχει ένα αυτοκίνητο'),
('grammar', 'Verb "to have" - We have', 'Εμείς έχουμε', 'We have', 'Εμείς έχουμε φίλους'),
('grammar', 'Verb "to have" - You (plural) have', 'Εσείς έχετε', 'You (plural) have', 'Εσείς έχετε ερωτήσεις'),
('grammar', 'Verb "to have" - They have', 'Αυτοί/Αυτές/Αυτά έχουν', 'They have', 'Αυτοί έχουν βιβλία'),

-- Cases - Nominative
('grammar', 'Nominative Case - Masculine', 'Ο άνθρωπος', 'The man (subject)', 'Ο άνθρωπος διαβάζει'),
('grammar', 'Nominative Case - Feminine', 'Η γυναίκα', 'The woman (subject)', 'Η γυναίκα γράφει'),
('grammar', 'Nominative Case - Neuter', 'Το παιδί', 'The child (subject)', 'Το παιδί παίζει'),

-- Cases - Accusative
('grammar', 'Accusative Case - Masculine', 'Τον άνθρωπο', 'The man (object)', 'Βλέπω τον άνθρωπο'),
('grammar', 'Accusative Case - Feminine', 'Την γυναίκα', 'The woman (object)', 'Βλέπω την γυναίκα'),
('grammar', 'Accusative Case - Neuter', 'Το παιδί', 'The child (object)', 'Βλέπω το παιδί'),

-- Cases - Genitive
('grammar', 'Genitive Case - Masculine', 'Του ανθρώπου', 'Of the man', 'Το βιβλίο του ανθρώπου'),
('grammar', 'Genitive Case - Feminine', 'Της γυναίκας', 'Of the woman', 'Το σπίτι της γυναίκας'),
('grammar', 'Genitive Case - Neuter', 'Του παιδιού', 'Of the child', 'Το παιχνίδι του παιδιού'),

-- Personal Pronouns
('grammar', 'Personal Pronoun - I', 'Εγώ', 'I', 'Εγώ πηγαίνω'),
('grammar', 'Personal Pronoun - You', 'Εσύ', 'You', 'Εσύ έρχεσαι'),
('grammar', 'Personal Pronoun - He', 'Αυτός', 'He', 'Αυτός είναι'),
('grammar', 'Personal Pronoun - She', 'Αυτή', 'She', 'Αυτή είναι'),
('grammar', 'Personal Pronoun - It', 'Αυτό', 'It', 'Αυτό είναι'),
('grammar', 'Personal Pronoun - We', 'Εμείς', 'We', 'Εμείς πηγαίνουμε'),
('grammar', 'Personal Pronoun - You (plural)', 'Εσείς', 'You (plural)', 'Εσείς έρχεστε'),
('grammar', 'Personal Pronoun - They (masculine)', 'Αυτοί', 'They (masculine)', 'Αυτοί είναι'),
('grammar', 'Personal Pronoun - They (feminine)', 'Αυτές', 'They (feminine)', 'Αυτές είναι'),
('grammar', 'Personal Pronoun - They (neuter)', 'Αυτά', 'They (neuter)', 'Αυτά είναι'),

-- Past Tense - Aorist
('grammar', 'Past Tense (Aorist) - I did', 'Εγώ έκανα', 'I did', 'Εγώ έκανα την εργασία'),
('grammar', 'Past Tense (Aorist) - You did', 'Εσύ έκανες', 'You did', 'Εσύ έκανες καλά'),
('grammar', 'Past Tense (Aorist) - He/She/It did', 'Αυτός/Αυτή/Αυτό έκανε', 'He/She/It did', 'Αυτός έκανε δουλειά'),

-- Future Tense
('grammar', 'Future Tense - I will do', 'Εγώ θα κάνω', 'I will do', 'Εγώ θα κάνω την εργασία'),
('grammar', 'Future Tense - You will do', 'Εσύ θα κάνεις', 'You will do', 'Εσύ θα κάνεις καλά'),
('grammar', 'Future Tense - He/She/It will do', 'Αυτός/Αυτή/Αυτό θα κάνει', 'He/She/It will do', 'Αυτός θα κάνει δουλειά'),

-- Adjectives
('grammar', 'Adjective - Good (masculine)', 'Καλός', 'Good (masculine)', 'Καλός άνθρωπος'),
('grammar', 'Adjective - Good (feminine)', 'Καλή', 'Good (feminine)', 'Καλή γυναίκα'),
('grammar', 'Adjective - Good (neuter)', 'Καλό', 'Good (neuter)', 'Καλό παιδί'),
('grammar', 'Adjective - Good (plural)', 'Καλοί/Καλές/Καλά', 'Good (plural)', 'Καλοί άνθρωποι'),

-- Numbers
('grammar', 'Number - One (masculine)', 'Ένας', 'One (masculine)', 'Ένας άνθρωπος'),
('grammar', 'Number - One (feminine)', 'Μία', 'One (feminine)', 'Μία γυναίκα'),
('grammar', 'Number - One (neuter)', 'Ένα', 'One (neuter)', 'Ένα παιδί'),
('grammar', 'Number - Two', 'Δύο', 'Two', 'Δύο βιβλία'),
('grammar', 'Number - Three', 'Τρία', 'Three', 'Τρία παιδιά'),

-- Prepositions
('grammar', 'Preposition - In/On', 'Σε', 'In/On', 'Στο σπίτι'),
('grammar', 'Preposition - From', 'Από', 'From', 'Από την Αθήνα'),
('grammar', 'Preposition - With', 'Με', 'With', 'Με τον φίλο'),
('grammar', 'Preposition - For', 'Για', 'For', 'Για εσένα'),

-- Question Words
('grammar', 'Question Word - What', 'Τι', 'What', 'Τι κάνεις;'),
('grammar', 'Question Word - Who', 'Ποιος/Ποια/Ποιο', 'Who', 'Ποιος είναι;'),
('grammar', 'Question Word - Where', 'Πού', 'Where', 'Πού είσαι;'),
('grammar', 'Question Word - When', 'Πότε', 'When', 'Πότε έρχεσαι;'),
('grammar', 'Question Word - Why', 'Γιατί', 'Why', 'Γιατί δεν έρχεσαι;'),
('grammar', 'Question Word - How', 'Πώς', 'How', 'Πώς είσαι;');

-- ========================================
-- Note: After inserting, you may want to create student_progress entries
-- for testing. You can use the setup_student_progress_for_phrases.sql
-- as a template, but change 'phrases' to 'grammar' in the WHERE clause.
-- ========================================

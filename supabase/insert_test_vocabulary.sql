-- ========================================
-- TEST VOCABULARY FOR GREEK LINGUA
-- ========================================
-- This script inserts test vocabulary into the learning_items table
-- Run this in your Supabase SQL editor to populate the database with test data
-- ========================================

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.learning_items WHERE type = 'vocabulary';

-- Insert test vocabulary
INSERT INTO public.learning_items (type, english, greek, example_en, example_gr)
VALUES 
-- Basic Greetings & Common Phrases
('vocabulary', 'Hello', 'Γεια σου', 'Hello friend', 'Γεια σου φίλε'),
('vocabulary', 'Goodbye', 'Αντίο', 'Goodbye for now', 'Αντίο προς το παρόν'),
('vocabulary', 'Thank you', 'Ευχαριστώ', 'Thank you very much', 'Ευχαριστώ πολύ'),
('vocabulary', 'Please', 'Παρακαλώ', 'Please help me', 'Παρακαλώ βοήθησέ με'),
('vocabulary', 'Sorry', 'Συγγνώμη', 'I am sorry', 'Λυπάμαι'),
('vocabulary', 'Yes', 'Ναι', 'Yes, I agree', 'Ναι, συμφωνώ'),
('vocabulary', 'No', 'Όχι', 'No, thank you', 'Όχι, ευχαριστώ'),
('vocabulary', 'Excuse me', 'Συγγνώμη', 'Excuse me, please', 'Συγγνώμη, παρακαλώ'),

-- Numbers
('vocabulary', 'One', 'Ένα', 'One apple', 'Ένα μήλο'),
('vocabulary', 'Two', 'Δύο', 'Two books', 'Δύο βιβλία'),
('vocabulary', 'Three', 'Τρία', 'Three days', 'Τρεις ημέρες'),
('vocabulary', 'Four', 'Τέσσερα', 'Four friends', 'Τέσσερις φίλοι'),
('vocabulary', 'Five', 'Πέντε', 'Five minutes', 'Πέντε λεπτά'),
('vocabulary', 'Ten', 'Δέκα', 'Ten euros', 'Δέκα ευρώ'),
('vocabulary', 'Twenty', 'Είκοσι', 'Twenty years', 'Είκοσι χρόνια'),
('vocabulary', 'Hundred', 'Εκατό', 'One hundred', 'Εκατό'),

-- Common Nouns - Food & Drinks
('vocabulary', 'Water', 'Νερό', 'I want water', 'Θέλω νερό'),
('vocabulary', 'Bread', 'Ψωμί', 'Fresh bread', 'Φρέσκο ψωμί'),
('vocabulary', 'Coffee', 'Καφές', 'Drink coffee', 'Πίνω καφέ'),
('vocabulary', 'Wine', 'Κρασί', 'Greek wine', 'Ελληνικό κρασί'),
('vocabulary', 'Olive', 'Ελιά', 'Olive oil', 'Ελαιόλαδο'),
('vocabulary', 'Cheese', 'Τυρί', 'Feta cheese', 'Τυρί φέτα'),
('vocabulary', 'Fish', 'Ψάρι', 'Fresh fish', 'Φρέσκο ψάρι'),
('vocabulary', 'Meat', 'Κρέας', 'Grilled meat', 'Ψητό κρέας'),
('vocabulary', 'Fruit', 'Φρούτο', 'Fresh fruit', 'Φρέσκα φρούτα'),
('vocabulary', 'Vegetable', 'Λαχανικό', 'Fresh vegetables', 'Φρέσκα λαχανικά'),

-- Common Nouns - People & Family
('vocabulary', 'Friend', 'Φίλος', 'Best friend', 'Καλύτερος φίλος'),
('vocabulary', 'Family', 'Οικογένεια', 'My family', 'Η οικογένειά μου'),
('vocabulary', 'Mother', 'Μητέρα', 'My mother', 'Η μητέρα μου'),
('vocabulary', 'Father', 'Πατέρας', 'My father', 'Ο πατέρας μου'),
('vocabulary', 'Brother', 'Αδερφός', 'My brother', 'Ο αδερφός μου'),
('vocabulary', 'Sister', 'Αδερφή', 'My sister', 'Η αδερφή μου'),
('vocabulary', 'Child', 'Παιδί', 'The child plays', 'Το παιδί παίζει'),
('vocabulary', 'Man', 'Άντρας', 'The man works', 'Ο άντρας δουλεύει'),
('vocabulary', 'Woman', 'Γυναίκα', 'The woman reads', 'Η γυναίκα διαβάζει'),
('vocabulary', 'Person', 'Άνθρωπος', 'Good person', 'Καλός άνθρωπος'),

-- Common Nouns - Places
('vocabulary', 'City', 'Πόλη', 'Beautiful city', 'Όμορφη πόλη'),
('vocabulary', 'Beach', 'Παραλία', 'Go to the beach', 'Πάω στην παραλία'),
('vocabulary', 'House', 'Σπίτι', 'My house', 'Το σπίτι μου'),
('vocabulary', 'Street', 'Δρόμος', 'The street is busy', 'Ο δρόμος είναι πολυσύχναστος'),
('vocabulary', 'Shop', 'Κατάστημα', 'The shop is open', 'Το κατάστημα είναι ανοιχτό'),
('vocabulary', 'Restaurant', 'Εστιατόριο', 'Greek restaurant', 'Ελληνικό εστιατόριο'),
('vocabulary', 'Hotel', 'Ξενοδοχείο', 'Nice hotel', 'Ωραίο ξενοδοχείο'),
('vocabulary', 'Church', 'Εκκλησία', 'Ancient church', 'Αρχαία εκκλησία'),
('vocabulary', 'Island', 'Νησί', 'Beautiful island', 'Όμορφο νησί'),
('vocabulary', 'Mountain', 'Βουνό', 'High mountain', 'Υψηλό βουνό'),

-- Common Verbs
('vocabulary', 'To be', 'Είμαι', 'I am happy', 'Είμαι χαρούμενος'),
('vocabulary', 'To have', 'Έχω', 'I have a car', 'Έχω ένα αυτοκίνητο'),
('vocabulary', 'To go', 'Πάω', 'I go to work', 'Πάω στη δουλειά'),
('vocabulary', 'To come', 'Έρχομαι', 'I come from Greece', 'Έρχομαι από την Ελλάδα'),
('vocabulary', 'To see', 'Βλέπω', 'I see the sea', 'Βλέπω τη θάλασσα'),
('vocabulary', 'To know', 'Ξέρω', 'I know Greek', 'Ξέρω ελληνικά'),
('vocabulary', 'To want', 'Θέλω', 'I want to learn', 'Θέλω να μάθω'),
('vocabulary', 'To like', 'Μου αρέσει', 'I like music', 'Μου αρέσει η μουσική'),
('vocabulary', 'To love', 'Αγαπώ', 'I love you', 'Σ''αγαπώ'),
('vocabulary', 'To do', 'Κάνω', 'What are you doing?', 'Τι κάνεις;'),
('vocabulary', 'To make', 'Φτιάχνω', 'I make coffee', 'Φτιάχνω καφέ'),
('vocabulary', 'To say', 'Λέω', 'I say hello', 'Λέω γεια'),
('vocabulary', 'To speak', 'Μιλάω', 'I speak Greek', 'Μιλάω ελληνικά'),
('vocabulary', 'To understand', 'Καταλαβαίνω', 'I understand', 'Καταλαβαίνω'),
('vocabulary', 'To learn', 'Μαθαίνω', 'I learn Greek', 'Μαθαίνω ελληνικά'),
('vocabulary', 'To read', 'Διαβάζω', 'I read a book', 'Διαβάζω ένα βιβλίο'),
('vocabulary', 'To write', 'Γράφω', 'I write a letter', 'Γράφω μια επιστολή'),
('vocabulary', 'To eat', 'Τρώω', 'I eat bread', 'Τρώω ψωμί'),
('vocabulary', 'To drink', 'Πίνω', 'I drink water', 'Πίνω νερό'),
('vocabulary', 'To sleep', 'Κοιμάμαι', 'I sleep well', 'Κοιμάμαι καλά'),

-- Adjectives
('vocabulary', 'Good', 'Καλός', 'Good day', 'Καλή μέρα'),
('vocabulary', 'Bad', 'Κακός', 'Bad weather', 'Κακός καιρός'),
('vocabulary', 'Big', 'Μεγάλος', 'Big house', 'Μεγάλο σπίτι'),
('vocabulary', 'Small', 'Μικρός', 'Small car', 'Μικρό αυτοκίνητο'),
('vocabulary', 'Beautiful', 'Όμορφος', 'Beautiful woman', 'Όμορφη γυναίκα'),
('vocabulary', 'Ugly', 'Άσχημος', 'Ugly building', 'Άσχημο κτίριο'),
('vocabulary', 'New', 'Νέος', 'New car', 'Νέο αυτοκίνητο'),
('vocabulary', 'Old', 'Παλιός', 'Old house', 'Παλιό σπίτι'),
('vocabulary', 'Hot', 'Ζεστός', 'Hot coffee', 'Ζεστός καφές'),
('vocabulary', 'Cold', 'Κρύος', 'Cold water', 'Κρύο νερό'),
('vocabulary', 'Happy', 'Χαρούμενος', 'Happy person', 'Χαρούμενος άνθρωπος'),
('vocabulary', 'Sad', 'Λυπημένος', 'Sad news', 'Λυπημένα νέα'),
('vocabulary', 'Rich', 'Πλούσιος', 'Rich man', 'Πλούσιος άνθρωπος'),
('vocabulary', 'Poor', 'Φτωχός', 'Poor family', 'Φτωχή οικογένεια'),
('vocabulary', 'Easy', 'Εύκολος', 'Easy lesson', 'Εύκολο μάθημα'),
('vocabulary', 'Difficult', 'Δύσκολος', 'Difficult language', 'Δύσκολη γλώσσα'),

-- Time & Days
('vocabulary', 'Today', 'Σήμερα', 'Today is Monday', 'Σήμερα είναι Δευτέρα'),
('vocabulary', 'Tomorrow', 'Αύριο', 'See you tomorrow', 'Τα λέμε αύριο'),
('vocabulary', 'Yesterday', 'Χθες', 'Yesterday I went', 'Χθες πήγα'),
('vocabulary', 'Now', 'Τώρα', 'Right now', 'Αυτή τη στιγμή'),
('vocabulary', 'Morning', 'Πρωί', 'Good morning', 'Καλημέρα'),
('vocabulary', 'Afternoon', 'Απόγευμα', 'Good afternoon', 'Καλό απόγευμα'),
('vocabulary', 'Evening', 'Βράδυ', 'Good evening', 'Καλό βράδυ'),
('vocabulary', 'Night', 'Νύχτα', 'Good night', 'Καληνύχτα'),
('vocabulary', 'Day', 'Ημέρα', 'Every day', 'Κάθε ημέρα'),
('vocabulary', 'Week', 'Εβδομάδα', 'This week', 'Αυτή την εβδομάδα'),
('vocabulary', 'Month', 'Μήνας', 'Next month', 'Τον επόμενο μήνα'),
('vocabulary', 'Year', 'Χρόνος', 'This year', 'Φέτος'),

-- Colors
('vocabulary', 'Red', 'Κόκκινος', 'Red wine', 'Κόκκινο κρασί'),
('vocabulary', 'Blue', 'Μπλε', 'Blue sea', 'Μπλε θάλασσα'),
('vocabulary', 'Green', 'Πράσινος', 'Green tree', 'Πράσινο δέντρο'),
('vocabulary', 'Yellow', 'Κίτρινος', 'Yellow sun', 'Κίτρινος ήλιος'),
('vocabulary', 'White', 'Άσπρος', 'White house', 'Άσπρο σπίτι'),
('vocabulary', 'Black', 'Μαύρος', 'Black coffee', 'Μαύρος καφές'),

-- Body Parts
('vocabulary', 'Head', 'Κεφάλι', 'My head hurts', 'Πονάει το κεφάλι μου'),
('vocabulary', 'Eye', 'Μάτι', 'Beautiful eyes', 'Όμορφα μάτια'),
('vocabulary', 'Hand', 'Χέρι', 'Raise your hand', 'Σήκωσε το χέρι σου'),
('vocabulary', 'Foot', 'Πόδι', 'My foot', 'Το πόδι μου'),

-- Nature & Weather
('vocabulary', 'Sun', 'Ήλιος', 'The sun shines', 'Ο ήλιος λάμπει'),
('vocabulary', 'Moon', 'Φεγγάρι', 'Full moon', 'Πανσέληνος'),
('vocabulary', 'Star', 'Αστέρι', 'Bright star', 'Φωτεινό αστέρι'),
('vocabulary', 'Sea', 'Θάλασσα', 'Blue sea', 'Μπλε θάλασσα'),
('vocabulary', 'Tree', 'Δέντρο', 'Tall tree', 'Ψηλό δέντρο'),
('vocabulary', 'Flower', 'Λουλούδι', 'Beautiful flower', 'Όμορφο λουλούδι'),
('vocabulary', 'Rain', 'Βροχή', 'It is raining', 'Βρέχει'),
('vocabulary', 'Wind', 'Ανεμος', 'Strong wind', 'Δυνατός άνεμος'),

-- Abstract Concepts
('vocabulary', 'God', 'Θεός', 'Oh my God', 'Ω Θεέ μου'),
('vocabulary', 'Love', 'Αγάπη', 'I love you', 'Σ''αγαπώ'),
('vocabulary', 'Life', 'Ζωή', 'Beautiful life', 'Όμορφη ζωή'),
('vocabulary', 'Death', 'Θάνατος', 'Fear of death', 'Φόβος του θανάτου'),
('vocabulary', 'Time', 'Χρόνος', 'Time flies', 'Ο χρόνος πετάει'),
('vocabulary', 'Work', 'Δουλειά', 'I go to work', 'Πάω στη δουλειά'),
('vocabulary', 'Money', 'Χρήματα', 'I need money', 'Χρειάζομαι χρήματα'),
('vocabulary', 'Problem', 'Πρόβλημα', 'No problem', 'Κανένα πρόβλημα'),
('vocabulary', 'Question', 'Ερώτηση', 'Good question', 'Καλή ερώτηση'),
('vocabulary', 'Answer', 'Απάντηση', 'The answer is yes', 'Η απάντηση είναι ναι'),

-- Common Phrases & Expressions
('vocabulary', 'How are you?', 'Τι κάνεις;', 'How are you today?', 'Τι κάνεις σήμερα;'),
('vocabulary', 'I am fine', 'Καλά είμαι', 'I am fine, thank you', 'Καλά είμαι, ευχαριστώ'),
('vocabulary', 'What is your name?', 'Πώς σε λένε;', 'What is your name?', 'Πώς σε λένε;'),
('vocabulary', 'My name is', 'Με λένε', 'My name is Maria', 'Με λένε Μαρία'),
('vocabulary', 'Nice to meet you', 'Χαίρομαι', 'Nice to meet you', 'Χαίρομαι που σε γνώρισα'),
('vocabulary', 'I don''t understand', 'Δεν καταλαβαίνω', 'I don''t understand', 'Δεν καταλαβαίνω'),
('vocabulary', 'Can you help me?', 'Μπορείτε να με βοηθήσετε;', 'Can you help me please?', 'Μπορείτε να με βοηθήσετε παρακαλώ;'),
('vocabulary', 'I don''t know', 'Δεν ξέρω', 'I don''t know', 'Δεν ξέρω'),
('vocabulary', 'Where is...?', 'Πού είναι...;', 'Where is the bathroom?', 'Πού είναι το μπάνιο;'),
('vocabulary', 'How much?', 'Πόσο;', 'How much does it cost?', 'Πόσο κοστίζει;');

-- ========================================
-- Verification Query
-- ========================================
-- Run this to verify the data was inserted:
-- SELECT COUNT(*) FROM public.learning_items WHERE type = 'vocabulary';
-- SELECT * FROM public.learning_items WHERE type = 'vocabulary' ORDER BY created_at DESC LIMIT 10;

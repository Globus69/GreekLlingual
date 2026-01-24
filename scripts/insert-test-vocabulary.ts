/**
 * Script to insert test vocabulary into Supabase
 * 
 * Usage:
 * 1. Make sure your .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 2. Run: npx tsx scripts/insert-test-vocabulary.ts
 * 
 * Or use the SQL file directly in Supabase SQL Editor:
 * supabase/insert_test_vocabulary.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test vocabulary data
const testVocabulary = [
  // Basic Greetings & Common Phrases
  { type: 'vocabulary', english: 'Hello', greek: 'Γεια σου', example_en: 'Hello friend', example_gr: 'Γεια σου φίλε' },
  { type: 'vocabulary', english: 'Goodbye', greek: 'Αντίο', example_en: 'Goodbye for now', example_gr: 'Αντίο προς το παρόν' },
  { type: 'vocabulary', english: 'Thank you', greek: 'Ευχαριστώ', example_en: 'Thank you very much', example_gr: 'Ευχαριστώ πολύ' },
  { type: 'vocabulary', english: 'Please', greek: 'Παρακαλώ', example_en: 'Please help me', example_gr: 'Παρακαλώ βοήθησέ με' },
  { type: 'vocabulary', english: 'Sorry', greek: 'Συγγνώμη', example_en: 'I am sorry', example_gr: 'Λυπάμαι' },
  { type: 'vocabulary', english: 'Yes', greek: 'Ναι', example_en: 'Yes, I agree', example_gr: 'Ναι, συμφωνώ' },
  { type: 'vocabulary', english: 'No', greek: 'Όχι', example_en: 'No, thank you', example_gr: 'Όχι, ευχαριστώ' },
  
  // Numbers
  { type: 'vocabulary', english: 'One', greek: 'Ένα', example_en: 'One apple', example_gr: 'Ένα μήλο' },
  { type: 'vocabulary', english: 'Two', greek: 'Δύο', example_en: 'Two books', example_gr: 'Δύο βιβλία' },
  { type: 'vocabulary', english: 'Three', greek: 'Τρία', example_en: 'Three days', example_gr: 'Τρεις ημέρες' },
  { type: 'vocabulary', english: 'Four', greek: 'Τέσσερα', example_en: 'Four friends', example_gr: 'Τέσσερις φίλοι' },
  { type: 'vocabulary', english: 'Five', greek: 'Πέντε', example_en: 'Five minutes', example_gr: 'Πέντε λεπτά' },
  { type: 'vocabulary', english: 'Ten', greek: 'Δέκα', example_en: 'Ten euros', example_gr: 'Δέκα ευρώ' },
  
  // Food & Drinks
  { type: 'vocabulary', english: 'Water', greek: 'Νερό', example_en: 'I want water', example_gr: 'Θέλω νερό' },
  { type: 'vocabulary', english: 'Bread', greek: 'Ψωμί', example_en: 'Fresh bread', example_gr: 'Φρέσκο ψωμί' },
  { type: 'vocabulary', english: 'Coffee', greek: 'Καφές', example_en: 'Drink coffee', example_gr: 'Πίνω καφέ' },
  { type: 'vocabulary', english: 'Wine', greek: 'Κρασί', example_en: 'Greek wine', example_gr: 'Ελληνικό κρασί' },
  { type: 'vocabulary', english: 'Olive', greek: 'Ελιά', example_en: 'Olive oil', example_gr: 'Ελαιόλαδο' },
  { type: 'vocabulary', english: 'Cheese', greek: 'Τυρί', example_en: 'Feta cheese', example_gr: 'Τυρί φέτα' },
  { type: 'vocabulary', english: 'Fish', greek: 'Ψάρι', example_en: 'Fresh fish', example_gr: 'Φρέσκο ψάρι' },
  
  // People & Family
  { type: 'vocabulary', english: 'Friend', greek: 'Φίλος', example_en: 'Best friend', example_gr: 'Καλύτερος φίλος' },
  { type: 'vocabulary', english: 'Family', greek: 'Οικογένεια', example_en: 'My family', example_gr: 'Η οικογένειά μου' },
  { type: 'vocabulary', english: 'Mother', greek: 'Μητέρα', example_en: 'My mother', example_gr: 'Η μητέρα μου' },
  { type: 'vocabulary', english: 'Father', greek: 'Πατέρας', example_en: 'My father', example_gr: 'Ο πατέρας μου' },
  { type: 'vocabulary', english: 'Brother', greek: 'Αδερφός', example_en: 'My brother', example_gr: 'Ο αδερφός μου' },
  { type: 'vocabulary', english: 'Sister', greek: 'Αδερφή', example_en: 'My sister', example_gr: 'Η αδερφή μου' },
  
  // Places
  { type: 'vocabulary', english: 'City', greek: 'Πόλη', example_en: 'Beautiful city', example_gr: 'Όμορφη πόλη' },
  { type: 'vocabulary', english: 'Beach', greek: 'Παραλία', example_en: 'Go to the beach', example_gr: 'Πάω στην παραλία' },
  { type: 'vocabulary', english: 'House', greek: 'Σπίτι', example_en: 'My house', example_gr: 'Το σπίτι μου' },
  { type: 'vocabulary', english: 'Restaurant', greek: 'Εστιατόριο', example_en: 'Greek restaurant', example_gr: 'Ελληνικό εστιατόριο' },
  { type: 'vocabulary', english: 'Island', greek: 'Νησί', example_en: 'Beautiful island', example_gr: 'Όμορφο νησί' },
  
  // Common Verbs
  { type: 'vocabulary', english: 'To be', greek: 'Είμαι', example_en: 'I am happy', example_gr: 'Είμαι χαρούμενος' },
  { type: 'vocabulary', english: 'To have', greek: 'Έχω', example_en: 'I have a car', example_gr: 'Έχω ένα αυτοκίνητο' },
  { type: 'vocabulary', english: 'To go', greek: 'Πάω', example_en: 'I go to work', example_gr: 'Πάω στη δουλειά' },
  { type: 'vocabulary', english: 'To see', greek: 'Βλέπω', example_en: 'I see the sea', example_gr: 'Βλέπω τη θάλασσα' },
  { type: 'vocabulary', english: 'To know', greek: 'Ξέρω', example_en: 'I know Greek', example_gr: 'Ξέρω ελληνικά' },
  { type: 'vocabulary', english: 'To want', greek: 'Θέλω', example_en: 'I want to learn', example_gr: 'Θέλω να μάθω' },
  { type: 'vocabulary', english: 'To love', greek: 'Αγαπώ', example_en: 'I love you', example_gr: "Σ' αγαπώ" },
  { type: 'vocabulary', english: 'To speak', greek: 'Μιλάω', example_en: 'I speak Greek', example_gr: 'Μιλάω ελληνικά' },
  { type: 'vocabulary', english: 'To learn', greek: 'Μαθαίνω', example_en: 'I learn Greek', example_gr: 'Μαθαίνω ελληνικά' },
  { type: 'vocabulary', english: 'To read', greek: 'Διαβάζω', example_en: 'I read a book', example_gr: 'Διαβάζω ένα βιβλίο' },
  { type: 'vocabulary', english: 'To eat', greek: 'Τρώω', example_en: 'I eat bread', example_gr: 'Τρώω ψωμί' },
  { type: 'vocabulary', english: 'To drink', greek: 'Πίνω', example_en: 'I drink water', example_gr: 'Πίνω νερό' },
  
  // Adjectives
  { type: 'vocabulary', english: 'Good', greek: 'Καλός', example_en: 'Good day', example_gr: 'Καλή μέρα' },
  { type: 'vocabulary', english: 'Bad', greek: 'Κακός', example_en: 'Bad weather', example_gr: 'Κακός καιρός' },
  { type: 'vocabulary', english: 'Big', greek: 'Μεγάλος', example_en: 'Big house', example_gr: 'Μεγάλο σπίτι' },
  { type: 'vocabulary', english: 'Small', greek: 'Μικρός', example_en: 'Small car', example_gr: 'Μικρό αυτοκίνητο' },
  { type: 'vocabulary', english: 'Beautiful', greek: 'Όμορφος', example_en: 'Beautiful woman', example_gr: 'Όμορφη γυναίκα' },
  { type: 'vocabulary', english: 'New', greek: 'Νέος', example_en: 'New car', example_gr: 'Νέο αυτοκίνητο' },
  { type: 'vocabulary', english: 'Old', greek: 'Παλιός', example_en: 'Old house', example_gr: 'Παλιό σπίτι' },
  { type: 'vocabulary', english: 'Hot', greek: 'Ζεστός', example_en: 'Hot coffee', example_gr: 'Ζεστός καφές' },
  { type: 'vocabulary', english: 'Cold', greek: 'Κρύος', example_en: 'Cold water', example_gr: 'Κρύο νερό' },
  
  // Time
  { type: 'vocabulary', english: 'Today', greek: 'Σήμερα', example_en: 'Today is Monday', example_gr: 'Σήμερα είναι Δευτέρα' },
  { type: 'vocabulary', english: 'Tomorrow', greek: 'Αύριο', example_en: 'See you tomorrow', example_gr: 'Τα λέμε αύριο' },
  { type: 'vocabulary', english: 'Yesterday', greek: 'Χθες', example_en: 'Yesterday I went', example_gr: 'Χθες πήγα' },
  { type: 'vocabulary', english: 'Now', greek: 'Τώρα', example_en: 'Right now', example_gr: 'Αυτή τη στιγμή' },
  { type: 'vocabulary', english: 'Morning', greek: 'Πρωί', example_en: 'Good morning', example_gr: 'Καλημέρα' },
  { type: 'vocabulary', english: 'Day', greek: 'Ημέρα', example_en: 'Every day', example_gr: 'Κάθε ημέρα' },
  
  // Colors
  { type: 'vocabulary', english: 'Red', greek: 'Κόκκινος', example_en: 'Red wine', example_gr: 'Κόκκινο κρασί' },
  { type: 'vocabulary', english: 'Blue', greek: 'Μπλε', example_en: 'Blue sea', example_gr: 'Μπλε θάλασσα' },
  { type: 'vocabulary', english: 'Green', greek: 'Πράσινος', example_en: 'Green tree', example_gr: 'Πράσινο δέντρο' },
  { type: 'vocabulary', english: 'White', greek: 'Άσπρος', example_en: 'White house', example_gr: 'Άσπρο σπίτι' },
  
  // Nature
  { type: 'vocabulary', english: 'Sun', greek: 'Ήλιος', example_en: 'The sun shines', example_gr: 'Ο ήλιος λάμπει' },
  { type: 'vocabulary', english: 'Sea', greek: 'Θάλασσα', example_en: 'Blue sea', example_gr: 'Μπλε θάλασσα' },
  { type: 'vocabulary', english: 'Tree', greek: 'Δέντρο', example_en: 'Tall tree', example_gr: 'Ψηλό δέντρο' },
  
  // Abstract
  { type: 'vocabulary', english: 'God', greek: 'Θεός', example_en: 'Oh my God', example_gr: 'Ω Θεέ μου' },
  { type: 'vocabulary', english: 'Love', greek: 'Αγάπη', example_en: 'I love you', example_gr: "Σ' αγαπώ" },
  { type: 'vocabulary', english: 'Life', greek: 'Ζωή', example_en: 'Beautiful life', example_gr: 'Όμορφη ζωή' },
  { type: 'vocabulary', english: 'Work', greek: 'Δουλειά', example_en: 'I go to work', example_gr: 'Πάω στη δουλειά' },
  { type: 'vocabulary', english: 'Money', greek: 'Χρήματα', example_en: 'I need money', example_gr: 'Χρειάζομαι χρήματα' },
];

async function insertVocabulary() {
  console.log('🔄 Starting vocabulary insertion...');
  console.log(`📊 Total items to insert: ${testVocabulary.length}`);

  try {
    // Check if table exists and has data
    const { count: existingCount } = await supabase
      .from('learning_items')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'vocabulary');

    console.log(`📚 Existing vocabulary items: ${existingCount || 0}`);

    // Insert vocabulary in batches
    const batchSize = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < testVocabulary.length; i += batchSize) {
      const batch = testVocabulary.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('learning_items')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} items`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully inserted: ${inserted} items`);
    if (errors > 0) {
      console.log(`   ❌ Failed: ${errors} items`);
    }

    // Verify final count
    const { count: finalCount } = await supabase
      .from('learning_items')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'vocabulary');

    console.log(`\n📚 Total vocabulary items in database: ${finalCount || 0}`);
    console.log('✨ Done!');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
insertVocabulary();

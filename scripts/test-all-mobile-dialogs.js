#!/usr/bin/env node
/**
 * Test all mobile dialog RPC functions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAllDialogs() {
    console.log('🧪 Testing all mobile dialog functions...\n');

    // Get test user
    const { data: users } = await supabase
        .from('users')
        .select('id, name, level')
        .eq('role', 'student')
        .limit(1);

    if (!users || users.length === 0) {
        console.error('❌ No test user found');
        process.exit(1);
    }

    const testUser = users[0];
    console.log(`👤 Test User: ${testUser.name} (Level: ${testUser.level || 'A1'})\n`);

    // Test 1: Due Cards
    console.log('1️⃣ Testing Due Cards (get_due_cards_fsrs)...');
    const { data: dueCards, error: dueError } = await supabase.rpc('get_due_cards_fsrs', {
        p_user_id: testUser.id,
        p_level: testUser.level || 'A1',
        p_limit: 5
    });

    if (dueError) {
        console.log('   ❌ Error:', dueError.message);
    } else {
        console.log(`   ✅ Success! Found ${dueCards.length} due cards`);
        if (dueCards.length > 0) {
            console.log(`      Sample: ${dueCards[0].greek} = ${dueCards[0].english}`);
        }
    }

    // Test 2: Review Vocab
    console.log('\n2️⃣ Testing Review Vocab (get_due_vocabulary_cards)...');
    const { data: vocabCards, error: vocabError } = await supabase.rpc('get_due_vocabulary_cards', {
        p_user_id: testUser.id,
        p_limit: 5
    });

    if (vocabError) {
        console.log('   ❌ Error:', vocabError.message);
    } else {
        console.log(`   ✅ Success! Found ${vocabCards.length} vocabulary cards`);
        if (vocabCards.length > 0) {
            console.log(`      Sample: ${vocabCards[0].greek} = ${vocabCards[0].english}`);
        }
    }

    // Test 3: Weak Words (direct table query)
    console.log('\n3️⃣ Testing Weak Words (multilingual_vocabulary)...');
    const { data: weakWords, error: weakError } = await supabase
        .from('multilingual_vocabulary')
        .select('*')
        .eq('level', testUser.level || 'A1')
        .order('difficulty', { ascending: false })
        .limit(5);

    if (weakError) {
        console.log('   ❌ Error:', weakError.message);
    } else {
        console.log(`   ✅ Success! Found ${weakWords.length} weak words`);
        if (weakWords.length > 0) {
            console.log(`      Sample: ${weakWords[0].greek_transcription} = ${weakWords[0].en_translation}`);
        }
    }

    // Test 4: Daily Phrases (direct table query)
    console.log('\n4️⃣ Testing Daily Phrases (daily_phrases)...');
    const { data: phrases, error: phrasesError } = await supabase
        .from('daily_phrases')
        .select('*')
        .limit(5);

    if (phrasesError) {
        console.log('   ❌ Error:', phrasesError.message);
    } else {
        console.log(`   ✅ Success! Found ${phrases.length} daily phrases`);
        if (phrases.length > 0) {
            console.log(`      Sample: ${phrases[0].greek_transcription} = ${phrases[0].en_translation}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   ${dueError ? '❌' : '✅'} Due Cards`);
    console.log(`   ${vocabError ? '❌' : '✅'} Review Vocab`);
    console.log(`   ${weakError ? '❌' : '✅'} Weak Words`);
    console.log(`   ${phrasesError ? '❌' : '✅'} Daily Phrases`);
    console.log('\n✅ All tests completed!\n');
}

testAllDialogs().catch(err => {
    console.error('💥 Error:', err.message);
    process.exit(1);
});

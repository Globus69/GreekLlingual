#!/usr/bin/env node
/**
 * Check exact column types from database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTypes() {
    console.log('🔍 Checking column types...\n');

    // Get actual data to see what PostgreSQL returns
    const { data: progressData, error: progressError } = await supabase
        .from('user_vocabulary_progress')
        .select('*')
        .limit(1);

    if (progressError) {
        console.error('❌ Error:', progressError.message);
        process.exit(1);
    }

    if (progressData && progressData.length > 0) {
        console.log('📊 user_vocabulary_progress sample:');
        const sample = progressData[0];
        console.log({
            fsrs_difficulty: sample.fsrs_difficulty,
            fsrs_difficulty_type: typeof sample.fsrs_difficulty,
            fsrs_stability: sample.fsrs_stability,
            fsrs_stability_type: typeof sample.fsrs_stability,
            fsrs_due: sample.fsrs_due,
            fsrs_reps: sample.fsrs_reps,
            fsrs_lapses: sample.fsrs_lapses,
            fsrs_state: sample.fsrs_state,
        });
    }

    // Get vocabulary data
    const { data: vocabData, error: vocabError } = await supabase
        .from('multilingual_vocabulary')
        .select('*')
        .limit(1);

    if (vocabError) {
        console.error('❌ Error:', vocabError.message);
        process.exit(1);
    }

    if (vocabData && vocabData.length > 0) {
        console.log('\n📊 multilingual_vocabulary sample:');
        const sample = vocabData[0];
        console.log({
            id: sample.id,
            english: sample.en_translation,
            russian: sample.ru_translation,
            greek: sample.greek_transcription,
            level: sample.level,
            difficulty: sample.difficulty,
        });
    }

    // Test the actual RPC call
    console.log('\n🔍 Testing RPC call directly...');
    const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student')
        .limit(1);

    if (users && users.length > 0) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_due_cards_fsrs', {
            p_user_id: users[0].id,
            p_level: 'A1',
            p_limit: 1
        });

        if (rpcError) {
            console.error('❌ RPC Error:', rpcError);
        } else {
            console.log('✅ RPC Success! Returned data:', rpcData);
        }
    }
}

checkTypes().catch(err => {
    console.error('💥 Error:', err.message);
    process.exit(1);
});

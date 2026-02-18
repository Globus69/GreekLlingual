#!/usr/bin/env node
/**
 * Test script to check if get_due_cards_fsrs RPC function exists
 * and test it with a sample user
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDueCardsRPC() {
    console.log('🔍 Testing get_due_cards_fsrs RPC function...\n');

    // Step 1: Skip function check, go straight to test
    console.log('1️⃣ Skipping function existence check (proceeding with test call)...');

    // Step 2: Get a test user
    console.log('\n2️⃣ Finding a test user...');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, level')
        .eq('role', 'student')
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('❌ No users found:', userError?.message);
        console.log('\n📝 Creating test data...');

        // Check if vocabulary exists
        const { data: vocabCheck, error: vocabError } = await supabase
            .from('vocabulary')
            .select('id')
            .limit(1);

        if (vocabError || !vocabCheck || vocabCheck.length === 0) {
            console.log('⚠️ No vocabulary data found. The get_due_cards_fsrs function requires vocabulary data.');
            console.log('\n💡 Please run the vocabulary import first or create sample data.');
        }

        return;
    }

    const testUser = users[0];
    console.log(`✅ Found user: ${testUser.name} (${testUser.email})`);
    console.log(`   Level: ${testUser.level || 'A1'}`);
    console.log(`   User ID: ${testUser.id}`);

    // Step 3: Call get_due_cards_fsrs
    console.log('\n3️⃣ Calling get_due_cards_fsrs...');
    const { data: dueCards, error: rpcError } = await supabase.rpc('get_due_cards_fsrs', {
        p_user_id: testUser.id,
        p_level: testUser.level || 'A1',
        p_limit: 10
    });

    if (rpcError) {
        console.error('❌ RPC Error:', {
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint,
            code: rpcError.code
        });

        if (rpcError.code === '42883') {
            console.log('\n💡 Function does not exist. Please run migration 054 and 085:');
            console.log('   node scripts/run-migration.js 054');
            console.log('   node scripts/run-migration.js 085');
        }

        return;
    }

    console.log(`✅ Function executed successfully!`);
    console.log(`📊 Results: ${dueCards ? dueCards.length : 0} due cards found\n`);

    if (dueCards && dueCards.length > 0) {
        console.log('📝 Sample due card:');
        const sample = dueCards[0];
        console.log({
            id: sample.id,
            greek: sample.greek_word || sample.greek,
            english: sample.english,
            fsrs_state: sample.fsrs_state,
            fsrs_due: sample.fsrs_due,
            level: sample.level
        });
    } else {
        console.log('ℹ️ No due cards found for this user.');
        console.log('   This could mean:');
        console.log('   - No vocabulary assigned to user level');
        console.log('   - All cards have been reviewed and none are due yet');
        console.log('   - User has not started learning yet (all cards in "new" state with future due dates)');
    }

    // Step 4: Check user_vocabulary_progress
    console.log('\n4️⃣ Checking user_vocabulary_progress table...');
    const { data: progressData, error: progressError } = await supabase
        .from('user_vocabulary_progress')
        .select('*')
        .eq('user_id', testUser.id)
        .limit(5);

    if (progressError) {
        console.error('❌ Error querying user_vocabulary_progress:', progressError.message);
    } else if (!progressData || progressData.length === 0) {
        console.log('⚠️ No progress records found for this user.');
        console.log('   Cards will be initialized on first use.');
    } else {
        console.log(`✅ Found ${progressData.length} progress records`);
        console.log('   Sample record:', {
            vocabulary_id: progressData[0].vocabulary_id,
            fsrs_state: progressData[0].fsrs_state,
            fsrs_due: progressData[0].fsrs_due
        });
    }

    console.log('\n✅ Test completed!');
}

testDueCardsRPC().catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
});

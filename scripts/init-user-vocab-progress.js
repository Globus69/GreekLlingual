#!/usr/bin/env node
/**
 * Initialize vocabulary progress for existing users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initUserProgress() {
    console.log('🚀 Initializing user vocabulary progress...\n');

    // Get all students
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, level')
        .eq('role', 'student');

    if (userError) {
        console.error('❌ Error fetching users:', userError.message);
        process.exit(1);
    }

    if (!users || users.length === 0) {
        console.log('⚠️ No student users found');
        process.exit(0);
    }

    console.log(`📊 Found ${users.length} student(s)\n`);

    for (const user of users) {
        console.log(`👤 ${user.name} (${user.email})`);
        console.log(`   Level: ${user.level || 'A1'}`);

        // Call init function
        const { data, error } = await supabase.rpc('init_user_vocabulary_progress', {
            p_user_id: user.id,
            p_level: user.level || 'A1'
        });

        if (error) {
            console.error(`   ❌ Error: ${error.message}`);
        } else {
            console.log(`   ✅ Initialized ${data} vocabulary items\n`);
        }
    }

    // Test get_due_cards_fsrs
    console.log('🔍 Testing get_due_cards_fsrs...');
    const testUser = users[0];

    const { data: dueCards, error: dueError } = await supabase.rpc('get_due_cards_fsrs', {
        p_user_id: testUser.id,
        p_level: testUser.level || 'A1',
        p_limit: 10
    });

    if (dueError) {
        console.error('❌ RPC Error:', dueError.message);
    } else {
        console.log(`✅ Found ${dueCards.length} due cards for ${testUser.name}`);
        if (dueCards.length > 0) {
            const sample = dueCards[0];
            console.log('\n📝 Sample card:');
            console.log({
                greek: sample.greek_word || sample.greek,
                english: sample.english,
                fsrs_state: sample.fsrs_state,
                fsrs_due: sample.fsrs_due
            });
        }
    }

    console.log('\n✅ Initialization complete!');
    console.log('💡 Users can now see due cards in the mobile app');
}

initUserProgress().catch(err => {
    console.error('💥 Error:', err.message);
    process.exit(1);
});

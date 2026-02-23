const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const userId = '1c14edac-0fd8-4a6d-9163-ccd2a59d82b4';

async function reset() {
    console.log(`Resetting user ${userId}...`);

    // Table cleanups
    await supabase.from('fsrs_review_logs').delete().eq('user_id', userId);
    await supabase.from('user_vocabulary_progress').delete().eq('user_id', userId);
    await supabase.from('student_progress').delete().eq('student_id', userId);
    await supabase.from('learning_sessions').delete().eq('student_id', userId);
    await supabase.from('practice_attempts').delete().eq('user_id', userId);

    // User profile reset
    await supabase.from('users').update({
        streak_days: 0,
        longest_streak: 0,
        last_activity_date: null,
        level: 'A1',
        difficulty: 'easy',
        performance_index: 'A1-easy'
    }).eq('id', userId);

    console.log('✅ User 2098 is now fresh.');
}

reset();

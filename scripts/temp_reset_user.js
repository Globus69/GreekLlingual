
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const user_id = '1c14edac-0fd8-4a6d-9163-ccd2a59d82b4';

async function checkAndReset() {
    const stats = {};
    const tables = [
        { name: 'practice_attempts', user_col: 'user_id' },
        { name: 'student_progress', user_col: 'student_id' },
        { name: 'fsrs_review_logs', user_col: 'user_id' },
        { name: 'learning_sessions', user_col: 'student_id' },
        { name: 'user_streaks', user_col: 'user_id' },
        { name: 'user_progress', user_col: 'user_id' },
        { name: 'daily_phrase_completions', user_col: 'user_id' }
    ];

    console.log('--- STARTING RESET FOR USER: ' + user_id + ' ---');

    for (const table of tables) {
        try {
            const { count, error: countError } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true })
                .eq(table.user_col, user_id);

            if (countError) {
                console.log(`Table ${table.name}: Not found or error (${countError.message})`);
                continue;
            }

            console.log(`Table ${table.name}: Found ${count} records. Deleting...`);

            const { error: deleteError } = await supabase
                .from(table.name)
                .delete()
                .eq(table.user_col, user_id);

            if (deleteError) {
                console.log(`Table ${table.name}: Delete failed (${deleteError.message})`);
            } else {
                console.log(`Table ${table.name}: Successfully cleared.`);
            }
        } catch (e) {
            console.log(`Table ${table.name}: Unexpected error`);
        }
    }

    console.log('--- RESETTING USER PROFILE ---');
    const { error: userError } = await supabase
        .from('users')
        .update({
            streak_days: 0,
            last_activity_date: null,
            longest_streak: 0,
            level: 'A1',
            difficulty: 'easy',
            performance_index: 'A1-easy'
        })
        .eq('id', user_id);

    if (userError) {
        console.log('User profile update failed: ' + userError.message);
    } else {
        console.log('User profile: streak, level and difficulty reset to initial state.');
    }

    console.log('--- RESET COMPLETE ---');
}

checkAndReset();

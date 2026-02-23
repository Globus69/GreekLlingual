
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
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        env[key] = value;
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const user_id = '1c14edac-0fd8-4a6d-9163-ccd2a59d82b4';

async function checkActivity() {
    console.log('--- CHECKING ACTIVITY FOR USER: ' + user_id + ' ---');

    const queries = [
        { name: 'student_progress', user_col: 'student_id' },
        { name: 'fsrs_review_logs', user_col: 'user_id' },
        { name: 'practice_attempts', user_col: 'user_id' },
        { name: 'learning_sessions', user_col: 'student_id' }
    ];

    for (const q of queries) {
        const { data, count, error } = await supabase
            .from(q.name)
            .select('*', { count: 'exact' })
            .eq(q.user_col, user_id);

        if (error) {
            console.log(`${q.name}: Error - ${error.message}`);
        } else {
            console.log(`${q.name}: ${count} total records found.`);
            if (data && data.length > 0) {
                // Show latest records
                const latest = data.sort((a, b) => new Date(b.created_at || b.review_time || b.started_at) - new Date(a.created_at || a.review_time || a.started_at))[0];
                console.log(`  Latest Record Date: ${latest.created_at || latest.review_time || latest.started_at}`);
            }
        }
    }

    // Check dailies
    const { count: dailyCount, error: dailyError } = await supabase
        .from('daily_phrase_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id);

    if (dailyError) {
        console.log(`daily_phrase_completions: Error - ${dailyError.message}`);
    } else {
        console.log(`daily_phrase_completions: ${dailyCount} records found.`);
    }

    console.log('--- CHECK COMPLETE ---');
}

checkActivity();


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

async function checkMoreTables() {
    console.log('--- CHECKING TABLES INDIVIDUALLY FOR USER: ' + user_id + ' ---');

    const configs = [
        { table: 'user_vocabulary_progress', col: 'user_id' },
        { table: 'student_progress', col: 'student_id' },
        { table: 'fsrs_review_logs', col: 'user_id' },
        { table: 'learning_sessions', col: 'student_id' },
        { table: 'practice_attempts', col: 'user_id' }
    ];

    for (const c of configs) {
        try {
            const { data, count, error } = await supabase
                .from(c.table)
                .select('*', { count: 'exact' })
                .eq(c.col, user_id);

            if (error) {
                console.log(`${c.table}: Error - ${error.message}`);
            } else {
                console.log(`${c.table}: ${count} total records found.`);
                if (data && data.length > 0) {
                    const sorted = data.sort((a, b) => new Date(b.created_at || b.review_time || b.started_at || b.updated_at || b.last_reviewed) - new Date(a.created_at || a.review_time || a.started_at || a.updated_at || a.last_reviewed));
                    const latest = sorted[0];
                    console.log(`  Latest Record (${c.table}): ${JSON.stringify(latest).substring(0, 120)}...`);
                }
            }
        } catch (e) {
            console.log(`${c.table}: Exception`);
        }
    }
    console.log('--- CHECK COMPLETE ---');
}

checkMoreTables();

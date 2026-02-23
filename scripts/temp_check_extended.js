
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
    console.log('--- CHECKING EXTENDED TABLES FOR USER: ' + user_id + ' ---');

    const tables = ['user_vocabulary_progress', 'student_progress', 'fsrs_review_logs', 'learning_sessions', 'practice_attempts'];

    for (const table of tables) {
        try {
            // Try different column names for user id
            const { data, count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact' })
                .or(`user_id.eq.${user_id},student_id.eq.${user_id}`);

            if (error) {
                console.log(`${table}: Error - ${error.message}`);
            } else {
                console.log(`${table}: ${count} total records found.`);
                if (data && data.length > 0) {
                    const latest = data.sort((a, b) => new Date(b.created_at || b.review_time || b.started_at || b.updated_at || b.last_reviewed) - new Date(a.created_at || a.review_time || a.started_at || a.updated_at || a.last_reviewed))[0];
                    console.log(`  Latest Record: ${JSON.stringify(latest).substring(0, 100)}...`);
                }
            }
        } catch (e) {
            console.log(`${table}: Failed`);
        }
    }
    console.log('--- CHECK COMPLETE ---');
}

checkMoreTables();


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

async function inspect() {
    const user_id = '1c14edac-0fd8-4a6d-9163-ccd2a59d82b4';

    // Check tables content for this user
    const tables = ['student_progress', 'practice_attempts', 'fsrs_review_logs', 'learning_sessions', 'user_progress'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').or(`user_id.eq.${user_id},student_id.eq.${user_id}`);
        if (error) {
            console.log(`${table}: Error ${error.message}`);
        } else {
            console.log(`${table}: ${data.length} records`);
        }
    }
}

inspect();

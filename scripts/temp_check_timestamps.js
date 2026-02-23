
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

async function checkTimestamps() {
    console.log('--- CHECKING TIMESTAMPS FOR USER: ' + user_id + ' ---');

    const { data: uvp, error } = await supabase
        .from('user_vocabulary_progress')
        .select('*')
        .eq('user_id', user_id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.log(`Error: ${error.message}`);
    } else {
        console.log(`Found ${uvp.length} records in user_vocabulary_progress.`);
        if (uvp.length > 0) {
            console.log('Top 5 Latest Updated Records:');
            uvp.slice(0, 5).forEach(r => {
                console.log(`  ID: ${r.vocabulary_id}, Updated: ${r.updated_at}, Due: ${r.fsrs_due}, State: ${r.fsrs_state}`);
            });
        }
    }

    const { data: sessions, error: sessError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', user_id)
        .order('started_at', { ascending: false });

    if (sessError) {
        console.log(`Session Error: ${sessError.message}`);
    } else {
        console.log(`Found ${sessions.length} sessions.`);
        sessions.slice(0, 5).forEach(s => {
            console.log(`  Type: ${s.session_type}, Started: ${s.started_at}, Completed: ${s.completed}, Cards: ${s.cards_reviewed}`);
        });
    }

    console.log('--- CHECK COMPLETE ---');
}

checkTimestamps();

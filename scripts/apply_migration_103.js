const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const migrationPath = 'database/migrations/103_add_manual_version_to_users.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Attempting to apply Migration 103...');

    // Try multiple RPC variations commonly found in this project
    const rpcAttempts = [
        { name: 'exec_sql', params: { sql_query: sql } },
        { name: 'exec_sql', params: { sql_string: sql } },
        { name: 'run_sql', params: { sql: sql } }
    ];

    let success = false;
    for (const attempt of rpcAttempts) {
        try {
            const { error } = await supabase.rpc(attempt.name, attempt.params);
            if (!error) {
                console.log(`✅ Success using RPC: ${attempt.name}`);
                success = true;
                break;
            }
            if (!error.message.includes('not exist')) {
                console.error(`❌ Error with ${attempt.name}:`, error.message);
            }
        } catch (e) {
            // Skip
        }
    }

    if (!success) {
        console.log('\n---------------------------------------------------------');
        console.log('⚠️  AUTOMATIC APPLY FAILED');
        console.log('Please copy and execute the following SQL in your Supabase SQL Editor:');
        console.log('---------------------------------------------------------');
        console.log(sql);
        console.log('---------------------------------------------------------');
        console.log('After running, don\'t forget to click "Reload Schema" in the Supabase API settings if the error persists.');
    } else {
        console.log('🎉 Migration applied successfully!');
    }
}

applyMigration();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const sql = fs.readFileSync('database/migrations/098_fix_update_card_fsrs_logging.sql', 'utf8');
    console.log('Applying Migration 098...');

    // Note: We use a custom RPC to execute multiple SQL statements if available,
    // but if not, we can try to run it directly if the env allows.
    // Actually, Supabase client doesn't have a generic .sql() method.
    // We usually have an 'exec' or 'run_sql' function for this in these projects.

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
            console.error('❌ Error: function "exec_sql" does not exist. Please apply the migration manually in the Supabase SQL Editor.');
        } else {
            console.error('❌ Error applying migration:', error);
        }
    } else {
        console.log('✅ Migration 098 applied successfully!');
    }
}

applyMigration();

#!/usr/bin/env node
/**
 * Check vocabulary/multilingual_vocabulary table schema
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log('🔍 Checking vocabulary table schemas...\n');

    // Check which vocabulary tables exist
    const tables = ['vocabulary', 'multilingual_vocabulary', 'user_vocabulary_progress'];

    for (const tableName of tables) {
        console.log(`\n📊 Table: ${tableName}`);
        console.log('='.repeat(60));

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`❌ Table does not exist or cannot be accessed: ${error.message}`);
            continue;
        }

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log(`✅ Table exists with ${columns.length} columns:`);

            // Check for FSRS columns
            const fsrsColumns = columns.filter(col => col.startsWith('fsrs_'));
            if (fsrsColumns.length > 0) {
                console.log(`\n   🎯 FSRS columns found:`);
                fsrsColumns.forEach(col => console.log(`      - ${col}`));
            } else {
                console.log('   ⚠️ No FSRS columns found in this table');
            }

            console.log(`\n   📝 All columns:`);
            columns.forEach(col => console.log(`      - ${col}`));
        } else {
            console.log(`✅ Table exists but is empty`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Summary:');
    console.log('   - FSRS data should be stored in user_vocabulary_progress');
    console.log('   - RPC function needs to JOIN vocabulary with user_vocabulary_progress');
}

checkSchema().catch(err => {
    console.error('💥 Error:', err.message);
    process.exit(1);
});

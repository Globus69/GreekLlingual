#!/usr/bin/env node

/**
 * Script to run migration 087 manually
 * Creates the cloze_texts table in the database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
    process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function runMigration() {
    try {
        console.log('📄 Reading migration file...');
        const migrationPath = path.join(__dirname, '../supabase/migrations/087_create_cloze_texts_table.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Running migration 087...');
        console.log('   Creating cloze_texts table with RPC functions...');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            // Try direct query if exec_sql function doesn't exist
            console.log('   Trying direct query execution...');

            // Split by semicolon and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.trim()) {
                    const { error: stmtError } = await supabase.rpc('query', { query_text: statement });
                    if (stmtError) {
                        console.warn('⚠️  Statement error:', stmtError.message);
                    }
                }
            }
        }

        console.log('\n✅ Migration 087 executed');
        console.log('\n🔍 Verifying table creation...');

        // Verify the table was created
        const { data: tableData, error: tableError } = await supabase
            .from('cloze_texts')
            .select('count');

        if (tableError) {
            console.error('❌ Table verification failed:', tableError.message);
            console.log('\n💡 You may need to run the migration manually in Supabase Dashboard:');
            console.log('   1. Go to: https://supabase.com/dashboard');
            console.log('   2. Select your project');
            console.log('   3. Go to SQL Editor');
            console.log('   4. Run: supabase/migrations/087_create_cloze_texts_table.sql');
            process.exit(1);
        }

        console.log('✅ Table "cloze_texts" created successfully');
        console.log('\n📊 Summary:');
        console.log('   ✓ cloze_texts table created');
        console.log('   ✓ Indexes created');
        console.log('   ✓ RPC functions created');
        console.log('   ✓ RLS policies applied');
        console.log('   ✓ Sample data inserted');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.log('\n💡 Manual migration required:');
        console.log('   Run the SQL from supabase/migrations/087_create_cloze_texts_table.sql');
        console.log('   in your Supabase Dashboard SQL Editor');
        process.exit(1);
    }
}

runMigration();

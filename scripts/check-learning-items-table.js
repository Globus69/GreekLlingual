#!/usr/bin/env node
/**
 * Check if learning_items table exists and its schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLearningItems() {
    console.log('🔍 Checking learning_items table...\n');

    // Try to query learning_items
    const { data, error } = await supabase
        .from('learning_items')
        .select('*')
        .limit(1);

    if (error) {
        console.log('❌ learning_items table does not exist or cannot be accessed');
        console.log('   Error:', error.message);
        console.log('\n💡 Grammar data should probably come from a different table');
        console.log('   Options:');
        console.log('   - multilingual_vocabulary (if grammar is part of vocabulary)');
        console.log('   - Create new grammar_rules table');
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ learning_items table exists');
        console.log('\n📊 Columns:');
        Object.keys(data[0]).forEach(col => console.log(`   - ${col}`));
        console.log('\n📝 Sample row:');
        console.log(data[0]);
    } else {
        console.log('✅ learning_items table exists but is empty');
    }
}

checkLearningItems().catch(err => {
    console.error('💥 Error:', err.message);
    process.exit(1);
});

#!/usr/bin/env node

/**
 * Test script to verify cloze_texts table and API functions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testClozeTextsDatabase() {
    console.log('🧪 Testing Cloze Texts Database Connection\n');

    try {
        // Test 1: Check if table exists by querying it
        console.log('1️⃣  Testing table existence...');
        const { data: tableData, error: tableError } = await supabase
            .from('cloze_texts')
            .select('*')
            .limit(5);

        if (tableError) {
            console.error('   ❌ Table query failed:', tableError.message);
            return false;
        }
        console.log(`   ✅ Table exists and accessible (${tableData.length} entries found)`);

        // Test 2: Check RPC function for stats
        console.log('\n2️⃣  Testing get_cloze_texts_stats() RPC function...');
        const { data: statsData, error: statsError } = await supabase
            .rpc('get_cloze_texts_stats');

        if (statsError) {
            console.error('   ❌ Stats RPC failed:', statsError.message);
            return false;
        }
        console.log('   ✅ Stats RPC working');
        console.log('   📊 Stats:', JSON.stringify(statsData, null, 2));

        // Test 3: Show sample data
        if (tableData.length > 0) {
            console.log('\n3️⃣  Sample data from cloze_texts:');
            const sample = tableData[0];
            console.log('   📝 Greek:', sample.greek_transcription);
            console.log('   ✅ Answer:', sample.cloze_answer);
            console.log('   🎓 Level:', sample.level);
            console.log('   ⚡ Difficulty:', sample.difficulty);
        }

        console.log('\n✅ All tests passed! Cloze texts module is working correctly.');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

testClozeTextsDatabase();

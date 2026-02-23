const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const userId = '1c14edac-0fd8-4a6d-9163-ccd2a59d82b4';

async function checkData() {
    console.log(`Checking data (AS ADMIN) for user: ${userId}`);

    // 1. student_progress
    const { data: progress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', userId);
    console.log(`student_progress records: ${progress?.length || 0}`);

    // 2. user_vocabulary_progress
    const { data: vprog } = await supabase
        .from('user_vocabulary_progress')
        .select('*')
        .eq('user_id', userId);
    console.log(`user_vocabulary_progress records: ${vprog?.length || 0}`);

    // 3. fsrs_review_logs
    const { data: logs } = await supabase
        .from('fsrs_review_logs')
        .select('*')
        .eq('user_id', userId);
    console.log(`fsrs_review_logs records: ${logs?.length || 0}`);
    if (logs?.length > 0) console.log('Sample log:', logs[0]);

    // 4. learning_sessions
    const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', userId);
    console.log(`learning_sessions records: ${sessions?.length || 0}`);
    if (sessions?.length > 0) console.log('Sample session:', sessions[0]);

    // 5. Check if any cards are actually due
    const { data: due } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', userId)
        .lte('next_review', new Date().toISOString());
    console.log(`Due Daily Phrases: ${due?.length || 0}`);

    const { data: vdue } = await supabase
        .from('user_vocabulary_progress')
        .select('id')
        .eq('user_id', userId)
        .lte('next_review', new Date().toISOString());
    console.log(`Due Vocabulary: ${vdue?.length || 0}`);
}

checkData();

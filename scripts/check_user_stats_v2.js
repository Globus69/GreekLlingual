const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const userId = '1c14edac-0fd8-4a6d-9163-ccd2a59d82b4';

async function checkData() {
    console.log(`Checking data for user: ${userId}`);

    // 1. Check student_progress (Daily Phrases)
    const { data: progress, error: progressErr } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', userId);

    if (progressErr) console.error('Error fetching progress:', progressErr);
    else console.log(`student_progress (Daily Phrases) records: ${progress.length}`);

    // 2. Check user_vocabulary_progress (Vocabulary)
    const { data: vprog, error: vprogErr } = await supabase
        .from('user_vocabulary_progress')
        .select('*')
        .eq('user_id', userId);

    if (vprogErr) console.error('Error fetching vprog:', vprogErr);
    else console.log(`user_vocabulary_progress records: ${vprog.length}`);

    // 3. Check fsrs_review_logs
    const { data: logs, error: logsErr } = await supabase
        .from('fsrs_review_logs')
        .select('*')
        .eq('user_id', userId);

    if (logsErr) console.error('Error fetching logs:', logsErr);
    else {
        console.log(`fsrs_review_logs records: ${logs.length}`);
        if (logs.length > 0) {
            console.log('Sample log:', logs[0]);
        }
    }

    // 4. Check learning_sessions
    const { data: sessions, error: sessionsErr } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', userId);

    if (sessionsErr) console.error('Error fetching sessions:', sessionsErr);
    else {
        console.log(`learning_sessions records: ${sessions.length}`);
        if (sessions.length > 0) {
            console.log('Sample session:', sessions[0]);
        }
    }

    // 5. Test get_progress_overview RPC
    const { data: overview, error: overviewErr } = await supabase.rpc('get_progress_overview', {
        p_user_id: userId,
        p_days: 30
    });

    if (overviewErr) console.error('Error fetching RPC overview:', overviewErr);
    else console.log('RPC get_progress_overview result:', JSON.stringify(overview, null, 2));

    // 6. Check dueCount manually as in useStatsData
    // .lte('next_review', new Date().toISOString())
    // Wait, useStatsData checks student_progress for due Count.
    // But Vocabulary is in user_vocabulary_progress.
}

checkData();

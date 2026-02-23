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

    // 1. Check student_progress
    const { data: progress, error: progressErr } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', userId);

    if (progressErr) console.error('Error fetching progress:', progressErr);
    else console.log(`student_progress records: ${progress.length}`);

    // 2. Check fsrs_review_logs
    const { data: logs, error: logsErr } = await supabase
        .from('fsrs_review_logs')
        .select('*')
        .eq('student_id', userId);

    if (logsErr) console.error('Error fetching logs:', logsErr);
    else console.log(`fsrs_review_logs records: ${logs.length}`);

    // 3. Check learning_sessions
    const { data: sessions, error: sessionsErr } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', userId);

    if (sessionsErr) console.error('Error fetching sessions:', sessionsErr);
    else console.log(`learning_sessions records: ${sessions.length}`);

    // 4. Test get_progress_overview RPC
    const { data: overview, error: overviewErr } = await supabase.rpc('get_progress_overview', {
        p_user_id: userId,
        p_days: 30
    });

    if (overviewErr) console.error('Error fetching RPC overview:', overviewErr);
    else console.log('RPC get_progress_overview result:', JSON.stringify(overview, null, 2));

    // 5. Check user streak
    const { data: streak, error: streakErr } = await supabase.rpc('get_user_streak', {
        p_user_id: userId
    });
    if (streakErr) console.error('Error fetching streak:', streakErr);
    else console.log('RPC get_user_streak result:', JSON.stringify(streak, null, 2));
}

checkData();

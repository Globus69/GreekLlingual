import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.rpc('get_weak_vocabulary_cards', { p_user_id: 'a9463b2f-48e0-49c0-96f3-3a525bc16223', p_limit: 1 });
    console.log("Keys:", data ? Object.keys(data[0] || {}) : "No data", "Error:", error);
}
check();

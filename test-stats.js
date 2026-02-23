import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: weakCards, error: e1 } = await supabase.rpc('get_weak_vocabulary_cards', { p_user_id: 'a9463b2f-48e0-49c0-96f3-3a525bc16223', p_limit: 10 });
    const { data: reviewCards, error: e2 } = await supabase.rpc('get_review_vocabulary_cards', { p_user_id: 'a9463b2f-48e0-49c0-96f3-3a525bc16223', p_limit: 10 });
    const { data: weakCount, error: e3 } = await supabase.rpc('get_weak_vocabulary_count', { p_user_id: 'a9463b2f-48e0-49c0-96f3-3a525bc16223' });
    const { data: reviewCount, error: e4 } = await supabase.rpc('get_review_vocabulary_count', { p_user_id: 'a9463b2f-48e0-49c0-96f3-3a525bc16223' });
    
    console.log("Weak Cards:", weakCards?.length, "Error:", e1);
    console.log("Review Cards:", reviewCards?.length, "Error:", e2);
    console.log("Weak Count RPC:", weakCount, "Error:", e3);
    console.log("Review Count RPC:", reviewCount, "Error:", e4);
}
check();

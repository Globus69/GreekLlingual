import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkSchema() {
  const { error } = await supabase.from('daily_phrases').insert({ id: '00000000-0000-0000-0000-000000000000' });
  console.log(error);
}
checkSchema();

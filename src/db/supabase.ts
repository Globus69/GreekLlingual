import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Global singleton: prevents multiple GoTrueClient instances across
// hot-reloads in development and module re-imports.
const GLOBAL_KEY = '__supabase_singleton__';
type GlobalWithSupabase = typeof globalThis & { [GLOBAL_KEY]?: SupabaseClient };

const globalRef = globalThis as GlobalWithSupabase;

if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase: SupabaseClient = globalRef[GLOBAL_KEY]!;

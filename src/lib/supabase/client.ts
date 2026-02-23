// ⚠️ SINGLETON REDIRECT
// All imports must use the same Supabase client instance to avoid
// "Multiple GoTrueClient instances" warnings.
// The canonical Singleton lives in @/db/supabase.
// This file is kept for backward-compatibility.
export { supabase } from '@/db/supabase';

import { createClient } from '@supabase/supabase-js';

// Fallback error to prevent crashing if keys are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'REPLACE_WITH_YOUR_ANON_KEY') {
  console.error("Critical: Supabase environment variables are missing or invalid in frontend!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

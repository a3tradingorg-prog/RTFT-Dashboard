import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!(import.meta as any).env.VITE_SUPABASE_URL || !(import.meta as any).env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

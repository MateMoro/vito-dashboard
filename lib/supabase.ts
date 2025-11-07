import { createClient } from '@supabase/supabase-js';
import type { Lead } from '@/types/leads';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type-safe database helpers
export type Database = {
  public: {
    Tables: {
      crm_leads: {
        Row: Lead;
      };
    };
  };
};

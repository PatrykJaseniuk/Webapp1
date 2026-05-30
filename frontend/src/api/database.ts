import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Rule R-010: Single Supabase client — the ONLY place a client is created.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const database = createClient<Database>(supabaseUrl, supabaseAnonKey);
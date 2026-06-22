import { createClient } from '@supabase/supabase-js';
import type { Database } from './__generated__/database.types';

// Rule R-010: Single Supabase client — the ONLY place a client is created.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const backendConnector = createClient<Database>(supabaseUrl, supabaseAnonKey);
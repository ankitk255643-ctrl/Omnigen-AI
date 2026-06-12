import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("Supabase URL:", supabaseUrl ? "Loaded" : "Missing");
console.log("Supabase Key:", supabaseAnonKey ? "Loaded" : "Missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Publishable Key is missing. Check your .env file.');
}

// Create a single supabase client for interacting with your database
// Using exactly what is in the env to prevent localhost or placeholder fallbacks
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

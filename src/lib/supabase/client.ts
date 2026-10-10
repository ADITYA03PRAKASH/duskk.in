import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase URL configuration: NEXT_PUBLIC_SUPABASE_URL must be defined."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing Supabase Anon Key configuration: NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

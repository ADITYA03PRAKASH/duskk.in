import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uygvozrdqprokqgapgnx.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "duskk_build_placeholder_key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn(
    "[SupabaseClient] Warning: NEXT_PUBLIC_SUPABASE_URL is not defined in environment."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

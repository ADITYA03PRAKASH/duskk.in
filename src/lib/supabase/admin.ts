import "./dns-patch";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uygvozrdqprokqgapgnx.supabase.co";
const serviceRoleOrAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "duskk_build_placeholder_key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn(
    "[SupabaseAdmin] Warning: NEXT_PUBLIC_SUPABASE_URL is not defined in environment."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleOrAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

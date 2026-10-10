import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleOrAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase URL configuration: NEXT_PUBLIC_SUPABASE_URL must be defined."
  );
}

if (!serviceRoleOrAnonKey) {
  throw new Error(
    "Missing Supabase key configuration: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleOrAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

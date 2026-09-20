import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uygvozrdqprokqgapgnx.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Z3ZvenJkcXByb2txZ2FwZ254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MDI3ODQsImV4cCI6MjEwNTI3ODc4NH0.47WcDVA4IMWIW2ZtOCHGLdbifCXPT4UGrYbdTgoF_fU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

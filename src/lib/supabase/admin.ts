import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uygvozrdqprokqgapgnx.supabase.co";
const serviceRoleOrAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Z3ZvenJkcXByb2txZ2FwZ254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MDI3ODQsImV4cCI6MjEwNTI3ODc4NH0.47WcDVA4IMWIW2ZtOCHGLdbifCXPT4UGrYbdTgoF_fU";

const fastFetch = (url: any, options: any = {}) => {
  const signal = options.signal || AbortSignal.timeout(1500);
  return fetch(url, { ...options, signal });
};

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleOrAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fastFetch,
  },
});

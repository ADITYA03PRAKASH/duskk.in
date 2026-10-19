import { supabaseAdmin } from "../src/lib/supabase/admin";

async function main() {
  const { data, error } = await supabaseAdmin.from("site_settings").select("*");
  if (error) {
    console.error("Error fetching site_settings:", error);
  } else {
    console.log("Found site_settings records:", data?.length);
    for (const row of data || []) {
      console.log(`Key: ${row.key}, UpdatedAt: ${row.updated_at}`);
      console.log(`Value:`, JSON.stringify(row.value, null, 2));
    }
  }
}

main().catch(console.error);

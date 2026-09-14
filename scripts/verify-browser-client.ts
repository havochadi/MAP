import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

// Uses the same NEXT_PUBLIC_ vars the real browser client will use, to
// prove Step 2's .env values are correct — not process.env.SUPABASE_URL.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function main() {
  const { data, error } = await supabase.from("Venue").select("id").limit(1);
  // anon, unauthenticated: RLS requires `to authenticated`, so this must be
  // denied, not a connection/config error — confirms the client is wired
  // to the right project with a valid anon key.
  if (error) {
    console.error("FAIL: expected a clean (if empty) response, got a real error — check the env vars:", error);
    process.exit(1);
  }
  if (!data || data.length > 0) {
    console.error("FAIL: expected an anonymous, unauthenticated read to be denied (empty) by RLS, got", data);
    process.exit(1);
  }
  console.log("PASS: browser client env vars are correct (anonymous read denied by RLS as expected)");
}

main();

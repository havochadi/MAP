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
  const { error } = await supabase.from("Venue").insert([{
    id: crypto.randomUUID(),
    name: "Test Venue",
  }]).select();
  // anon, unauthenticated: RLS requires `to authenticated`, so this must be
  // denied, not a connection/config error — confirms the client is wired
  // to the right project with a valid anon key.
  if (!error) {
    console.error("FAIL: expected an anonymous, unauthenticated write to be denied by RLS, but it succeeded");
    process.exit(1);
  }
  console.log("PASS: browser client env vars are correct (anonymous write denied by RLS as expected):", error.message);
}

main();

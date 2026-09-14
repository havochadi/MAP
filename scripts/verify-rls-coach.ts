// scripts/verify-rls-coach.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  const farhan = await coachClient("farhan@map.test", "Coach123!");

  const { data: publicRows, error: publicError } = await farhan.from("coach_public").select("id, name");
  if (publicError || !publicRows || publicRows.length < 2) {
    console.error("FAIL: any coach should see every coach's name via coach_public, got", publicError, publicRows);
    process.exit(1);
  }

  const { data: fullRows } = await farhan.from("Coach").select("id, email");
  if (!fullRows || fullRows.length !== 1) {
    console.error("FAIL: a non-admin coach querying the base Coach table should see only their own row, got", fullRows);
    process.exit(1);
  }

  console.log("PASS: coach_public exposes every coach's name; the base Coach table is self-only for non-admins");
}

main();

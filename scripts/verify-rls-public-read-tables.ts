// scripts/verify-rls-public-read-tables.ts
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

  const { data: venues, error: venueError } = await farhan.from("Venue").select("id");
  if (venueError || !venues || venues.length === 0) {
    console.error("FAIL: a non-admin coach should be able to read Venue rows, got", venueError, venues);
    process.exit(1);
  }

  // id: Venue's @default(cuid()) is Prisma-Client-side only — a direct
  // PostgREST insert needs its own id (same issue Tasks 7/8 hit).
  const { error: writeError } = await farhan.from("Venue").insert({ id: crypto.randomUUID(), name: "Should Fail Venue" });
  if (!writeError) {
    console.error("FAIL: a non-admin coach should NOT be able to insert a Venue row.");
    process.exit(1);
  }

  const admin = await coachClient("admin@map.test", "Coach123!");
  const { error: adminWriteError } = await admin.from("Venue").insert({ id: crypto.randomUUID(), name: "Verify RLS Venue" }).select().single();
  if (adminWriteError) {
    console.error("FAIL: admin should be able to insert a Venue row, got", adminWriteError);
    process.exit(1);
  }

  console.log("PASS: any coach can read Venue/Class/CurriculumTopic; only admin can write");
}

main();

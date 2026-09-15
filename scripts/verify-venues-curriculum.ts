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

  const { data: venues, error: venuesError } = await farhan.from("Venue").select("id, name").order("name", { ascending: true });
  if (venuesError || !venues || venues.length === 0) {
    console.error("FAIL: getAllVenues-equivalent should return rows for a signed-in coach, got", venuesError, venues);
    process.exit(1);
  }

  const { error: writeError } = await farhan.from("Venue").insert({ id: crypto.randomUUID(), name: "Should Fail Venue" });
  if (!writeError) {
    console.error("FAIL: createVenue-equivalent should be rejected by RLS for a non-admin.");
    process.exit(1);
  }

  // The rejection case above only proves half of createVenue's two
  // outcomes (ActionResult is success|failure) — the allowed path,
  // including the .insert().select() interaction (a separate SELECT
  // policy is needed for the inserted row to come back even when the
  // INSERT itself is permitted), is unverified without this.
  const admin = await coachClient("admin@map.test", "Coach123!");
  const { data: createdVenue, error: adminWriteError } = await admin
    .from("Venue")
    .insert({ id: crypto.randomUUID(), name: "Verify RLS Venue" })
    .select("id")
    .single();
  if (adminWriteError || !createdVenue) {
    console.error("FAIL: createVenue-equivalent should succeed for an admin, got", adminWriteError, createdVenue);
    process.exit(1);
  }

  const { data: combos, error: combosError } = await farhan
    .from("CurriculumTopic")
    .select("subject, level")
    .order("subject", { ascending: true });
  if (combosError || !combos || combos.length === 0) {
    console.error("FAIL: getSubjectLevelCombos-equivalent should return rows, got", combosError, combos);
    process.exit(1);
  }
  const first = combos[0];
  const { data: topics, error: topicsError } = await farhan
    .from("CurriculumTopic")
    .select("*")
    .eq("subject", first.subject)
    .eq("level", first.level);
  if (topicsError || !topics || topics.length === 0) {
    console.error("FAIL: getTopics-equivalent should return rows for a real subject/level, got", topicsError, topics);
    process.exit(1);
  }

  console.log("PASS: Venues and Curriculum queries work correctly for a signed-in coach; venue insert succeeds for admin and is rejected for a non-admin");
}

main();

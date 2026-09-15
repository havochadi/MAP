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

  console.log("PASS: Venues and Curriculum queries work correctly for a signed-in coach; venue insert is admin-gated by RLS");
}

main();

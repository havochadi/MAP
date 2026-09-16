import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

async function coachSession(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  return session;
}

async function main() {
  // Drives the real, exported functions (not hand-transcribed raw queries)
  // — final whole-branch review finding I3: createVenue spreads a Zod
  // result straight into an .insert(), which TS's spread typing doesn't
  // excess-property-check, so only calling the real function (not a
  // replica with a hand-written literal) can catch a schema/column drift.
  const { getAllVenues, createVenue } = await import("../src/lib/api/venues");
  const { getSubjectLevelCombos, getTopics } = await import("../src/lib/api/curriculum");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");

  const farhanSession = await coachSession("farhan@map.test", "Coach123!");
  await sharedSupabase.auth.setSession(farhanSession);

  const venues = await getAllVenues();
  if (!venues || venues.length === 0) {
    console.error("FAIL: getAllVenues should return rows for a signed-in coach, got", venues);
    process.exit(1);
  }

  const rejectedVenue = await createVenue({ name: "Should Fail Venue" });
  if (rejectedVenue.success) {
    console.error("FAIL: createVenue should be rejected by RLS for a non-admin.");
    process.exit(1);
  }

  // The rejection case above only proves half of createVenue's two
  // outcomes (ActionResult is success|failure) — the allowed path,
  // including the .insert().select() interaction (a separate SELECT
  // policy is needed for the inserted row to come back even when the
  // INSERT itself is permitted), is unverified without this.
  const adminSession = await coachSession("admin@map.test", "Coach123!");
  await sharedSupabase.auth.setSession(adminSession);

  const createdVenue = await createVenue({ name: "Verify RLS Venue" });
  if (!createdVenue.success) {
    console.error("FAIL: createVenue should succeed for an admin, got", createdVenue);
    process.exit(1);
  }

  await sharedSupabase.auth.setSession(farhanSession);

  const combos = await getSubjectLevelCombos();
  if (!combos || combos.length === 0) {
    console.error("FAIL: getSubjectLevelCombos should return rows, got", combos);
    process.exit(1);
  }
  const first = combos[0];
  const topics = await getTopics(first.subject, first.level);
  if (!topics || topics.length === 0) {
    console.error("FAIL: getTopics should return rows for a real subject/level, got", topics);
    process.exit(1);
  }

  await sharedSupabase.auth.signOut();

  // Teardown: the one Venue this run's createVenue call created, by its
  // own generated id only — via Prisma (bypasses RLS, and this is
  // verification-script teardown, not a real app write), same pattern as
  // every other post-Task-7 verify script's teardown. Final whole-branch
  // review finding I2: this script previously left a "Verify RLS Venue"
  // row behind on every run with no cleanup at all.
  await prisma.venue.delete({ where: { id: createdVenue.data.venueId } });

  await prisma.$disconnect();
  console.log(
    "PASS: getAllVenues/getSubjectLevelCombos/getTopics work correctly for a signed-in coach; createVenue succeeds for admin and is rejected for a non-admin",
  );
}

main();

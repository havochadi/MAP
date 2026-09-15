import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

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
  const admin = await coachClient("admin@map.test", "Coach123!");
  const farhan = await coachClient("farhan@map.test", "Coach123!");
  const farhanRow = await prisma.coach.findUniqueOrThrow({ where: { email: "farhan@map.test" } });

  const { data: profile, error: profileError } = await admin.from("Coach").select("*").eq("id", farhanRow.id).maybeSingle();
  if (profileError || !profile || profile.email !== "farhan@map.test") {
    console.error("FAIL: getCoachProfile-equivalent (admin viewing another coach) should return the full row, got", profileError, profile);
    process.exit(1);
  }

  const { data: selfRows } = await farhan.from("Coach").select("id, name, email").order("name", { ascending: true });
  if (!selfRows || selfRows.length !== 1) {
    console.error("FAIL: getAllCoachesForSelect-equivalent for a non-admin should return exactly their own row under RLS, got", selfRows);
    process.exit(1);
  }

  const newEmail = `verify-coaches-module-${Date.now()}@map.test`;
  const { data: fnData, error: fnError } = await admin.functions.invoke("admin-create-coach", {
    body: { name: "Verify Coaches Module", email: newEmail, password: "TempPass123!", isAdmin: false },
  });
  if (fnError || !fnData?.coachId) {
    console.error("FAIL: createCoach-equivalent (admin-create-coach invoke) should succeed for an admin, got", fnError, fnData);
    process.exit(1);
  }

  // createCoach wraps Plan 1's already-verified admin-create-coach Edge
  // Function rather than reimplementing the admin check client-side — but
  // per this plan's own precedent (Task 3's Edge-Function-wrapping login
  // actions), wrapping an already-verified function doesn't exempt this
  // task's own script from proving both of createCoach's outcomes.
  const { error: nonAdminCreateError } = await farhan.functions.invoke("admin-create-coach", {
    body: { name: "Should Fail Coach", email: `verify-coaches-module-reject-${Date.now()}@map.test`, password: "TempPass123!", isAdmin: false },
  });
  if (!nonAdminCreateError) {
    console.error("FAIL: createCoach-equivalent should be rejected for a non-admin caller.");
    process.exit(1);
  }

  const testClass = await prisma.class.findFirstOrThrow();

  const { error: assignError } = await farhan
    .from("ClassAssignment")
    .insert({ id: crypto.randomUUID(), coachId: fnData.coachId, classId: testClass.id });
  if (!assignError) {
    console.error("FAIL: assignCoachToClass-equivalent should be rejected by RLS for a non-admin coach.");
    process.exit(1);
  }

  // The rejection case above only proves half of assignCoachToClass's two
  // outcomes — the allowed (admin) path is unverified without this, and
  // the resulting row is what unassignCoachFromClass's checks below need.
  const assignmentId = crypto.randomUUID();
  const { error: adminAssignError } = await admin
    .from("ClassAssignment")
    .insert({ id: assignmentId, coachId: fnData.coachId, classId: testClass.id });
  if (adminAssignError) {
    console.error("FAIL: assignCoachToClass-equivalent should succeed for an admin, got", adminAssignError);
    process.exit(1);
  }

  // unassignCoachFromClass-equivalent had zero coverage — rejection first
  // (non-admin), then success (admin). .delete().select() so an
  // RLS-blocked delete (error: null, not a real error) is caught via
  // empty data, never `error` alone, per this plan's Global Constraints.
  const { data: nonAdminUnassignData } = await farhan.from("ClassAssignment").delete().eq("id", assignmentId).select("id");
  if (nonAdminUnassignData && nonAdminUnassignData.length > 0) {
    console.error("FAIL: unassignCoachFromClass-equivalent should be rejected (no rows deleted) for a non-admin coach, got", nonAdminUnassignData);
    process.exit(1);
  }

  const { data: adminUnassignData, error: adminUnassignError } = await admin
    .from("ClassAssignment")
    .delete()
    .eq("id", assignmentId)
    .select("id");
  if (adminUnassignError || !adminUnassignData || adminUnassignData.length === 0) {
    console.error("FAIL: unassignCoachFromClass-equivalent should succeed for an admin, got", adminUnassignError, adminUnassignData);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("PASS: Coaches module queries/writes behave correctly under RLS, including the admin-create-coach Edge Function call (both outcomes) and assign/unassign (both outcomes each)");
}

main();

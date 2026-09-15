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

  // The check above only exercises a plain Coach row fetch — getCoachProfile's
  // actual complexity is this nested ClassAssignment->Class->Venue/Enrollment
  // embed plus the sessionsCount/studentCount follow-up queries, none of
  // which were tested at all. A wrong relationship name or embed path here
  // fails loudly (a real Postgrest error), which is exactly what this proves.
  const assignmentForProfile = await prisma.classAssignment.findFirst({
    include: { class: { include: { enrollments: { where: { status: "ACTIVE" } } } } },
  });
  if (!assignmentForProfile) {
    throw new Error("No ClassAssignment found in seed data — cannot test getCoachProfile's nested query.");
  }

  const { data: profileAssignments, error: profileAssignmentsError } = await admin
    .from("ClassAssignment")
    .select("*, class:Class(*, venue:Venue(*), enrollments:Enrollment(*))")
    .eq("coachId", assignmentForProfile.coachId)
    .eq("class.enrollments.status", "ACTIVE");
  if (profileAssignmentsError || !profileAssignments || profileAssignments.length === 0) {
    console.error(
      "FAIL: getCoachProfile-equivalent's nested ClassAssignment->Class->Venue/Enrollment query should return rows, got",
      profileAssignmentsError,
      profileAssignments,
    );
    process.exit(1);
  }
  const firstProfileAssignment = profileAssignments[0];
  if (!firstProfileAssignment.class?.venue?.name || !Array.isArray(firstProfileAssignment.class?.enrollments)) {
    console.error("FAIL: getCoachProfile-equivalent's nested query should embed class.venue and class.enrollments, got", firstProfileAssignment);
    process.exit(1);
  }

  const profileClassIds = profileAssignments.map((a) => a.classId);
  const [{ error: profileSessionsError }, { data: profileEnrollments, error: profileEnrollmentsError }] = await Promise.all([
    admin.from("AttendanceSession").select("id", { count: "exact", head: true }).in("classId", profileClassIds).eq("markedByCoachId", assignmentForProfile.coachId),
    admin.from("Enrollment").select("studentId").in("classId", profileClassIds).eq("status", "ACTIVE"),
  ]);
  if (profileSessionsError || profileEnrollmentsError || !profileEnrollments) {
    console.error("FAIL: getCoachProfile-equivalent's sessionsCount/studentCount queries should succeed, got", profileSessionsError, profileEnrollmentsError);
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

  // The raw invoke rejection above only proves the Edge Function itself
  // rejects a non-admin — it says nothing about createCoach's own
  // error-message extraction (a real defect class: functions.invoke()
  // never populates `data` on a non-2xx response, so a naive
  // `data?.error ?? fallback` is dead code that always returns the
  // fallback). This calls the real, exported createCoach directly (same
  // pattern as Task 3's verify-login-logic.ts) to prove it surfaces the
  // Edge Function's actual message, not just a generic fallback.
  const { createCoach } = await import("../src/lib/api/coaches");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");
  const farhanLoginRes = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email: "farhan@map.test", password: "Coach123!" }),
  });
  const { session: farhanSession } = await farhanLoginRes.json();
  await sharedSupabase.auth.setSession(farhanSession);

  const createCoachResult = await createCoach({
    name: "Should Fail Coach",
    email: `verify-coaches-module-direct-reject-${Date.now()}@map.test`,
    password: "TempPass123!",
    isAdmin: false,
  });
  if (createCoachResult.success) {
    console.error("FAIL: createCoach should fail for a non-admin caller, got success.");
    process.exit(1);
  }
  if (createCoachResult.error !== "Admin access required.") {
    console.error(
      "FAIL: createCoach should surface admin-create-coach's exact rejection message, not a generic fallback, got:",
      createCoachResult.error,
    );
    process.exit(1);
  }
  await sharedSupabase.auth.signOut();

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

  // assignCoachToClass's own duplicate-assignment check (an existing-row
  // lookup before inserting) isn't exercised the same way its RLS gating
  // is by a raw query — but ClassAssignment's DB-level unique index on
  // (coachId, classId) independently guarantees no duplicate row can ever
  // be created either way, so this proves the practical outcome (no
  // duplicate) even without exercising the app's nicer error message.
  const { error: duplicateAssignError } = await admin
    .from("ClassAssignment")
    .insert({ id: crypto.randomUUID(), coachId: fnData.coachId, classId: testClass.id });
  if (!duplicateAssignError) {
    console.error("FAIL: a second ClassAssignment for the same coach+class pair should be rejected as a duplicate.");
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

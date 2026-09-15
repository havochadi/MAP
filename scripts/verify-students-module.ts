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
  const assignment = await prisma.classAssignment.findFirst({
    include: { class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: true } } } }, coach: true },
  });
  if (!assignment || assignment.class.enrollments.length === 0) {
    throw new Error("No ClassAssignment with an active enrollment found — cannot run this check.");
  }
  const targetStudentId = assignment.class.enrollments[0].student.id;
  const otherCoach = await prisma.coach.findFirstOrThrow({ where: { email: { not: assignment.coach.email } } });

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");
  const { data: profile } = await assignedClient
    .from("Student")
    .select("*")
    .eq("id", targetStudentId)
    .maybeSingle();
  if (!profile) {
    console.error("FAIL: getStudentProfile-equivalent should return data for a student the assigned coach can see.");
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: deniedProfile } = await otherClient.from("Student").select("*").eq("id", targetStudentId).maybeSingle();
  if (deniedProfile) {
    console.error("FAIL: getStudentProfile-equivalent should return null for a non-assigned coach, got a row.");
    process.exit(1);
  }

  const { data: allStudentsForAssigned } = await assignedClient.from("Student").select("id").order("name", { ascending: true });
  if (!allStudentsForAssigned || !allStudentsForAssigned.some((s) => s.id === targetStudentId)) {
    console.error("FAIL: getStudentsForCoach-equivalent for the assigned coach should include the target student.");
    process.exit(1);
  }

  // An RLS-blocked update returns error: null, not an error — must check
  // .select()'s returned data for emptiness instead (see Global Constraints).
  const { data: statusUpdateResult } = await otherClient
    .from("Student")
    .update({ status: "GRADUATED" })
    .eq("id", targetStudentId)
    .select("id");
  if (statusUpdateResult && statusUpdateResult.length > 0) {
    console.error("FAIL: updateStudentStatus-equivalent should be rejected by RLS for a non-admin coach, got", statusUpdateResult);
    process.exit(1);
  }

  // The rejection case above only proves half of updateStudentStatus's two
  // outcomes — the allowed (admin) path is unverified without this.
  // Student's UPDATE policy (prisma/migrations/20260914110204_.../
  // migration.sql) is admin-only for every column, not just status — even
  // the assigned coach above can't write here, only read.
  const admin = await coachClient("admin@map.test", "Coach123!");
  const { data: adminStatusResult, error: adminStatusError } = await admin
    .from("Student")
    .update({ status: "ACTIVE" })
    .eq("id", targetStudentId)
    .select("id");
  if (adminStatusError || !adminStatusResult || adminStatusResult.length === 0) {
    console.error("FAIL: updateStudentStatus-equivalent should succeed for an admin, got", adminStatusError, adminStatusResult);
    process.exit(1);
  }

  // getStudentProfile's CheckIn+Venue embed had zero coverage — CheckIn
  // has its own, materially more restrictive RLS policy than Student's
  // (admin, or the coach whose own shift recorded it, or the student
  // themself — prisma/migrations/20260914110527_rls_checkin_tables/
  // migration.sql), so nothing else would catch a wrong relationship name
  // or embed path here. Uses admin, which always sees every CheckIn, to
  // prove the query shape itself is correct — RLS narrowing it further for
  // a non-recording coach is the spec's intended behavior (flagged above
  // for Plan 2b), not a defect to re-verify here.
  const checkInFixture = await prisma.checkIn.findFirst({ include: { venue: true } });
  if (!checkInFixture) {
    throw new Error("No CheckIn found in seed data — cannot test getStudentProfile's CheckIn+Venue embed.");
  }
  const { data: adminCheckIns, error: adminCheckInsError } = await admin
    .from("CheckIn")
    .select("*, venue:Venue(*)")
    .eq("studentId", checkInFixture.studentId)
    .order("checkInDate", { ascending: false });
  if (adminCheckInsError || !adminCheckIns || adminCheckIns.length === 0 || !adminCheckIns[0].venue?.name) {
    console.error(
      "FAIL: getStudentProfile-equivalent's CheckIn+Venue embed should return rows with venue joined for admin, got",
      adminCheckInsError,
      adminCheckIns,
    );
    process.exit(1);
  }

  // regenerateLoginCode-equivalent had zero coverage — rejection then
  // success, same admin-only policy as above. Saves and restores the
  // original code afterward so this doesn't disturb any other script that
  // depends on a known student's login code staying stable (e.g. the
  // hardcoded GHW7UD/VSKQR6 codes Tasks 2/3's scripts use) — targetStudentId
  // is picked dynamically and could be either of those students.
  const { data: studentBeforeCodeChange } = await admin.from("Student").select("loginCode").eq("id", targetStudentId).maybeSingle();
  if (!studentBeforeCodeChange) {
    throw new Error("Could not read the target student's current loginCode before testing regenerateLoginCode.");
  }

  const { data: nonAdminCodeResult } = await otherClient
    .from("Student")
    .update({ loginCode: "ZZZZZZ" })
    .eq("id", targetStudentId)
    .select("id");
  if (nonAdminCodeResult && nonAdminCodeResult.length > 0) {
    console.error("FAIL: regenerateLoginCode-equivalent should be rejected by RLS for a non-admin coach, got", nonAdminCodeResult);
    process.exit(1);
  }

  const tempLoginCode = `V${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const { data: adminCodeResult, error: adminCodeError } = await admin
    .from("Student")
    .update({ loginCode: tempLoginCode })
    .eq("id", targetStudentId)
    .select("id");
  if (adminCodeError || !adminCodeResult || adminCodeResult.length === 0) {
    console.error("FAIL: regenerateLoginCode-equivalent should succeed for an admin, got", adminCodeError, adminCodeResult);
    process.exit(1);
  }

  // .select() + emptiness check, not just `error` — same RLS-blocked-write
  // gotcha as every other write in this file. Without it, a silently
  // blocked restore (error: null) would print PASS while leaving the
  // student's loginCode permanently stuck at tempLoginCode.
  const { data: restoreCodeResult, error: restoreCodeError } = await admin
    .from("Student")
    .update({ loginCode: studentBeforeCodeChange.loginCode })
    .eq("id", targetStudentId)
    .select("id");
  if (restoreCodeError || !restoreCodeResult || restoreCodeResult.length === 0) {
    throw new Error(
      `Restoring the original loginCode after the regenerateLoginCode check failed: ${JSON.stringify(restoreCodeError)}, rows affected: ${restoreCodeResult?.length ?? 0}. ` +
        `The target student's loginCode may now be "${tempLoginCode}" instead of its original value — fix manually.`,
    );
  }

  // enrollStudentInClass/dropEnrollment-equivalent had zero coverage —
  // both operate on Enrollment, which is admin-write-only under RLS for
  // insert/update/delete alike (same migration as above). Rejection then
  // success for both the insert path (enrollStudentInClass) and the
  // update-to-DROPPED path (dropEnrollment). Picks a class with NO
  // existing Enrollment row for this student (any status) — Enrollment
  // has a DB-level unique index on (studentId, classId), so reusing
  // assignment.classId (already enrolled) would violate it.
  const existingEnrollments = await prisma.enrollment.findMany({ where: { studentId: targetStudentId }, select: { classId: true } });
  const enrolledClassIds = new Set(existingEnrollments.map((e) => e.classId));
  const enrollTargetClass = await prisma.class.findFirst({ where: { id: { notIn: [...enrolledClassIds] } } });
  if (!enrollTargetClass) {
    throw new Error("Target student is already enrolled (in any status) in every seeded Class — cannot find a fresh class to test enrollment writes against.");
  }

  const { error: nonAdminEnrollError } = await otherClient
    .from("Enrollment")
    .insert({ id: crypto.randomUUID(), studentId: targetStudentId, classId: enrollTargetClass.id });
  if (!nonAdminEnrollError) {
    console.error("FAIL: enrollStudentInClass-equivalent should be rejected by RLS for a non-admin coach.");
    process.exit(1);
  }

  const enrollmentId = crypto.randomUUID();
  const { error: adminEnrollError } = await admin
    .from("Enrollment")
    .insert({ id: enrollmentId, studentId: targetStudentId, classId: enrollTargetClass.id });
  if (adminEnrollError) {
    console.error("FAIL: enrollStudentInClass-equivalent should succeed for an admin, got", adminEnrollError);
    process.exit(1);
  }

  const { data: nonAdminDropResult } = await otherClient.from("Enrollment").update({ status: "DROPPED" }).eq("id", enrollmentId).select("id");
  if (nonAdminDropResult && nonAdminDropResult.length > 0) {
    console.error("FAIL: dropEnrollment-equivalent should be rejected by RLS for a non-admin coach, got", nonAdminDropResult);
    process.exit(1);
  }

  const { data: adminDropResult, error: adminDropError } = await admin
    .from("Enrollment")
    .update({ status: "DROPPED" })
    .eq("id", enrollmentId)
    .select("id");
  if (adminDropError || !adminDropResult || adminDropResult.length === 0) {
    console.error("FAIL: dropEnrollment-equivalent should succeed for an admin, got", adminDropError, adminDropResult);
    process.exit(1);
  }

  // The raw-query RLS coverage above never touches either function's own
  // JS business logic (the "already enrolled" short-circuit and the
  // reactivate-a-DROPPED-enrollment branch) — both are pure application
  // logic with no DB-level backstop (unlike loginCode's uniqueness, which
  // the DB enforces independently). This calls the real, exported
  // functions directly (same pattern as Task 6's createCoach test) to
  // actually exercise that logic, not just RLS.
  //
  // MAX_ACTIVE_ENROLLMENTS's cap branch is deliberately not covered here —
  // constructing a deterministic 3-active-enrollment fixture would add
  // disproportionate script complexity for one more isolated, easily
  // hand-verified line of code (students.ts's own `if ((activeCount ?? 0)
  // >= MAX_ACTIVE_ENROLLMENTS)` check). Ruling, not an oversight.
  const { enrollStudentInClass, dropEnrollment } = await import("../src/lib/api/students");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");
  const adminLoginRes = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email: "admin@map.test", password: "Coach123!" }),
  });
  const { session: adminSession } = await adminLoginRes.json();
  await sharedSupabase.auth.setSession(adminSession);

  // "Already enrolled" branch: targetStudentId is still ACTIVE in
  // assignment.classId (untouched by every check above).
  const alreadyEnrolledResult = await enrollStudentInClass({ studentId: targetStudentId, classId: assignment.classId });
  if (alreadyEnrolledResult.success || alreadyEnrolledResult.error !== "Already enrolled in this class.") {
    console.error("FAIL: enrollStudentInClass should reject an already-ACTIVE enrollment with its specific message, got", alreadyEnrolledResult);
    process.exit(1);
  }

  // Reactivation branch: the enrollment in enrollTargetClass is DROPPED
  // (the raw-query test above set it that way) — enrolling again through
  // the real function should reactivate that row, not error on a
  // duplicate (Enrollment's unique index is on (studentId, classId)
  // regardless of status).
  const reactivateResult = await enrollStudentInClass({ studentId: targetStudentId, classId: enrollTargetClass.id });
  if (!reactivateResult.success) {
    console.error("FAIL: enrollStudentInClass should reactivate a DROPPED enrollment instead of erroring, got", reactivateResult);
    process.exit(1);
  }

  // dropEnrollment, for real this time (not a raw update) — drops the
  // enrollment enrollStudentInClass just reactivated, leaving the target
  // student's enrollment state exactly as the raw-query tests above left
  // it (DROPPED in enrollTargetClass, ACTIVE in assignment.classId only).
  const { data: reactivatedEnrollment } = await sharedSupabase
    .from("Enrollment")
    .select("id")
    .eq("studentId", targetStudentId)
    .eq("classId", enrollTargetClass.id)
    .maybeSingle();
  if (!reactivatedEnrollment) {
    throw new Error("Could not find the enrollment enrollStudentInClass just reactivated.");
  }
  const dropResult = await dropEnrollment({ enrollmentId: reactivatedEnrollment.id });
  if (!dropResult.success) {
    console.error("FAIL: dropEnrollment should succeed for an admin, got", dropResult);
    process.exit(1);
  }
  await sharedSupabase.auth.signOut();

  // Hard-delete the enrollment this run created (via Prisma, which bypasses
  // RLS — fine for teardown in a verification script). Unlike Venue/Class/
  // Coach creation elsewhere in this plan, "a class this student has never
  // had any Enrollment row for" is a scarce, shared resource across repeated
  // runs of this exact script (only as many classes exist in the DB) — left
  // uncleaned, every run permanently consumes one, and the pool eventually
  // hits zero and this script starts hard-failing on a future run (a real
  // failure hit during this plan's own execution — confirmed empirically).
  await prisma.enrollment.delete({ where: { id: enrollmentId } });

  await prisma.$disconnect();
  console.log(
    "PASS: Students module scopes profile/list visibility correctly under RLS (including the CheckIn+Venue embed); " +
      "regenerateLoginCode/enrollStudentInClass/dropEnrollment/updateStudentStatus are all admin-gated (both outcomes each), " +
      "and enrollStudentInClass's already-enrolled/reactivation branches behave correctly",
  );
}

main();

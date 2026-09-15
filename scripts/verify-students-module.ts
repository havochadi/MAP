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

  const { error: restoreCodeError } = await admin
    .from("Student")
    .update({ loginCode: studentBeforeCodeChange.loginCode })
    .eq("id", targetStudentId);
  if (restoreCodeError) {
    throw new Error(
      `Restoring the original loginCode after the regenerateLoginCode check failed: ${JSON.stringify(restoreCodeError)}. ` +
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

  await prisma.$disconnect();
  console.log(
    "PASS: Students module scopes profile/list visibility correctly under RLS; regenerateLoginCode/enrollStudentInClass/dropEnrollment/updateStudentStatus are all admin-gated (both outcomes each)",
  );
}

main();

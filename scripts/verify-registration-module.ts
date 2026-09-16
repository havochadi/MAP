import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

function sampleStudentInput(emailSuffix: string, isMapStudent: "true" | "false" = "true") {
  return {
    name: "Verify Registration Module",
    level: "P4",
    contactNumber: "91234567",
    schoolName: "Test Primary School",
    email: `verify-registration-${emailSuffix}-${Date.now()}@example.com`,
    // registerStudentSchema requires the literal string "true"/"false" (a
    // FormData-submission convention, per this task's own note), not a
    // real boolean — passing an actual boolean here would fail Zod
    // validation and never reach the Edge Function/RPC at all.
    isMapStudent,
    emergencyContactName: "Test Guardian",
    emergencyContactRelationship: "MOTHER",
    emergencyContactPhone: "91234567",
  };
}

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return session;
}

async function main() {
  const { registerStudent, registerAndCheckInStudent } = await import("../src/lib/api/registration");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");

  // registerStudent-equivalent: the real, exported function (not just a
  // raw Edge Function invoke) — validation, then the actual Edge Function
  // call. Unauthenticated is correct — register-student is public.
  const registerResult = await registerStudent(sampleStudentInput("public"));
  if (!registerResult.success) {
    console.error("FAIL: registerStudent should succeed for a valid, unauthenticated registration, got", registerResult);
    process.exit(1);
  }
  if (registerResult.data.loginCode.length !== 6) {
    console.error("FAIL: registerStudent's loginCode should always be exactly 6 characters, got", registerResult.data.loginCode);
    process.exit(1);
  }

  // registerStudent-equivalent rejection: invalid input never reaches the
  // Edge Function at all.
  const invalidResult = await registerStudent({ ...sampleStudentInput("invalid"), name: "" });
  if (invalidResult.success) {
    console.error("FAIL: registerStudent should reject invalid input before calling the Edge Function, got", invalidResult);
    process.exit(1);
  }

  // registerAndCheckInStudent needs a coach with an OPEN shift. clockIn
  // only accepts shifts scheduled for today's real day-of-week (Task 8) —
  // an unrelated, unnecessary dependency for testing this RPC specifically
  // (Task 8 already thoroughly tests clockIn itself). Creates the fixture
  // shift directly via Prisma Client instead (id/updatedAt auto-handled by
  // Prisma Client itself, unlike a raw supabase-js insert — this bypass
  // only applies when going through Prisma, which this setup step does).
  const testCoach = await prisma.coach.findFirstOrThrow({
    where: { isAdmin: false, email: { not: { startsWith: "verify-" } }, shifts: { none: { status: "OPEN" } } },
  });
  const testVenue = await prisma.venue.findFirstOrThrow();
  const today = new Date().toISOString().slice(0, 10);
  const testShift = await prisma.coachShift.create({
    data: { coachId: testCoach.id, venueId: testVenue.id, shiftBlock: "WEEKDAY_EVENING", shiftDate: today, clockInAt: new Date(), status: "OPEN" },
  });

  const coachSession = await coachClient(testCoach.email, "Coach123!");
  await sharedSupabase.auth.setSession(coachSession);

  // registerAndCheckInStudent-equivalent success, MAP student
  const checkinResult = await registerAndCheckInStudent(sampleStudentInput("checkin-map"));
  if (!checkinResult.success) {
    console.error("FAIL: registerAndCheckInStudent should succeed for a coach with an open shift, got", checkinResult);
    process.exit(1);
  }
  // The RPC's own login-code generator had a real off-by-one (fixed) that
  // silently truncated ~1 in 6 codes below 6 characters instead of erroring
  // — this is the regression guard for that class of bug.
  if (checkinResult.data.loginCode.length !== 6) {
    console.error("FAIL: registerAndCheckInStudent's loginCode should always be exactly 6 characters, got", checkinResult.data.loginCode);
    process.exit(1);
  }
  const notification = await prisma.checkInNotification.findFirst({ where: { studentId: checkinResult.data.studentId } });
  if (!notification) {
    console.error("FAIL: registerAndCheckInStudent should have created a CheckInNotification for a MAP student, found none.");
    process.exit(1);
  }

  // registerAndCheckInStudent-equivalent success, non-MAP student — the
  // same atomic-insert function's other branch (no CheckInNotification).
  const checkinNonMapResult = await registerAndCheckInStudent(sampleStudentInput("checkin-nonmap", "false"));
  if (!checkinNonMapResult.success) {
    console.error("FAIL: registerAndCheckInStudent should succeed for a non-MAP student too, got", checkinNonMapResult);
    process.exit(1);
  }
  if (checkinNonMapResult.data.loginCode.length !== 6) {
    console.error("FAIL: registerAndCheckInStudent's loginCode should always be exactly 6 characters, got", checkinNonMapResult.data.loginCode);
    process.exit(1);
  }
  const nonMapNotification = await prisma.checkInNotification.findFirst({ where: { studentId: checkinNonMapResult.data.studentId } });
  if (nonMapNotification) {
    console.error("FAIL: registerAndCheckInStudent should NOT create a CheckInNotification for a non-MAP student, found one.");
    process.exit(1);
  }

  // registerAndCheckInStudent-equivalent rejection: a coach with no open shift.
  const noShiftCoach = await prisma.coach.findFirstOrThrow({
    where: {
      isAdmin: false,
      id: { not: testCoach.id },
      email: { not: { startsWith: "verify-" } },
      shifts: { none: { status: "OPEN" } },
    },
  });
  const noShiftSession = await coachClient(noShiftCoach.email, "Coach123!");
  await sharedSupabase.auth.setSession(noShiftSession);
  const deniedResult = await registerAndCheckInStudent(sampleStudentInput("denied"));
  if (deniedResult.success) {
    console.error("FAIL: registerAndCheckInStudent should be rejected for a coach with no open shift, got", deniedResult);
    process.exit(1);
  }

  await sharedSupabase.auth.signOut();

  // Teardown: the two students this run's register_and_checkin_student
  // calls created (their CheckIn/CheckInNotification rows cascade with
  // them), plus the registerStudent-only student and the fixture shift —
  // each by its own exact id, not a broader filter.
  await prisma.student.deleteMany({
    where: { id: { in: [registerResult.data.studentId, checkinResult.data.studentId, checkinNonMapResult.data.studentId] } },
  });
  await prisma.coachShift.delete({ where: { id: testShift.id } });

  await prisma.$disconnect();
  console.log(
    "PASS: registerStudent (public, both outcomes) and registerAndCheckInStudent (open-shift-gated, both MAP and non-MAP students, both outcomes) all work correctly",
  );
}

main();

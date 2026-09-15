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
  return { client, session };
}

async function main() {
  // Prove the RLS gap this RPC exists to solve: a student NOT enrolled in
  // any class this coach is assigned to still can't be read directly.
  const shiftWithCoach = await prisma.coachShift.findFirstOrThrow({ where: { status: "OPEN" }, include: { coach: true } });
  const unrelatedStudent = await prisma.student.findFirstOrThrow({
    where: { enrollments: { none: { class: { assignments: { some: { coachId: shiftWithCoach.coachId } } } } } },
  });

  const { client, session } = await coachClient(shiftWithCoach.coach.email, "Coach123!");
  const { data: directRead } = await client.from("Student").select("id").eq("id", unrelatedStudent.id).maybeSingle();
  if (directRead) {
    console.error("FAIL (test setup wrong): expected this student to be unreadable directly by this coach under RLS.");
    process.exit(1);
  }

  // The raw RPC call above the client wrapper — proves the RPC itself
  // bypasses RLS. But testing only that, once, never exercises the real,
  // exported scanCheckIn() wrapper (its input parsing, and its mapping of
  // every one of the RPC's 4 outcome shapes to ScanResult) or
  // getCheckInCountForShift at all — 2 of this task's 3 client-facing
  // pieces would otherwise have zero coverage. This drives the real
  // functions through all of scanCheckIn's outcomes plus
  // getCheckInCountForShift, not just "the underlying RPC works once".
  const { scanCheckIn, getCheckInCountForShift } = await import("../src/lib/api/checkins");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");
  await sharedSupabase.auth.setSession(session);

  const countBefore = await getCheckInCountForShift(shiftWithCoach.id);

  const scanResult = await scanCheckIn({ code: unrelatedStudent.loginCode });
  if (scanResult.outcome !== "checked_in" || scanResult.studentName !== unrelatedStudent.name) {
    console.error(
      "FAIL: scanCheckIn should return checked_in with the student's name for a student outside this coach's assignments, given an open shift, got",
      scanResult,
    );
    process.exit(1);
  }

  // getCheckInCountForShift-equivalent: the count for this shift should
  // have gone up by exactly one after the scan above.
  const countAfter = await getCheckInCountForShift(shiftWithCoach.id);
  if (countAfter !== countBefore + 1) {
    console.error(`FAIL: getCheckInCountForShift should increase by 1 after a scan, went from ${countBefore} to ${countAfter}.`);
    process.exit(1);
  }

  // already_checked_in-equivalent: scanning the exact same student again
  // (same day, same venue) is the RPC's own documented no-op path — never
  // exercised by the original draft.
  const rescanResult = await scanCheckIn({ code: unrelatedStudent.loginCode });
  if (rescanResult.outcome !== "already_checked_in" || rescanResult.studentName !== unrelatedStudent.name) {
    console.error("FAIL: scanCheckIn should return already_checked_in (not a fresh check-in or an error) on a same-day rescan, got", rescanResult);
    process.exit(1);
  }

  // Confirms the rescan above genuinely took the no-op branch (no second
  // CheckIn row), not silently succeeded via some other path.
  const countAfterRescan = await getCheckInCountForShift(shiftWithCoach.id);
  if (countAfterRescan !== countAfter) {
    console.error(`FAIL: a same-day rescan should not create a second CheckIn row, count went from ${countAfter} to ${countAfterRescan}.`);
    process.exit(1);
  }

  // not_found-equivalent — a login code that can't belong to any real
  // student (LOGIN_CODE_ALPHABET excludes 0/1/I/O, so this is unambiguous).
  const notFoundResult = await scanCheckIn({ code: "000000" });
  if (notFoundResult.outcome !== "not_found") {
    console.error("FAIL: scanCheckIn should return not_found for a code that matches no student, got", notFoundResult);
    process.exit(1);
  }

  if (unrelatedStudent.isMapStudent) {
    const notification = await prisma.checkInNotification.findFirst({
      where: { studentId: unrelatedStudent.id },
      orderBy: { sentAt: "desc" },
    });
    if (!notification) {
      console.error("FAIL: scan_check_in should have created a CheckInNotification row for a MAP student, found none.");
      process.exit(1);
    }
  }

  const noShiftCoach = await prisma.coach.findFirstOrThrow({
    where: { email: { not: shiftWithCoach.coach.email }, shifts: { none: { status: "OPEN" } } },
  });
  const { session: noShiftSession } = await coachClient(noShiftCoach.email, "Coach123!");
  await sharedSupabase.auth.setSession(noShiftSession);
  const noShiftResult = await scanCheckIn({ code: unrelatedStudent.loginCode });
  if (noShiftResult.outcome !== "error") {
    console.error("FAIL: scanCheckIn should return an error outcome for a coach with no open shift, got", noShiftResult);
    process.exit(1);
  }

  await sharedSupabase.auth.signOut();

  // This script's own scan created exactly one CheckIn row (the
  // already_checked_in re-scan above is a deliberate no-op — see the RPC's
  // dedup logic — so it never creates a second). Unlike Venue/Class/Coach
  // creation elsewhere in this plan, that row is scoped to a specific
  // (student, venue, day) triple that this script's own fixture selection
  // will very likely land on again next run (same deterministic
  // shiftWithCoach/unrelatedStudent lookups) — left uncleaned, re-running
  // this script again on the *same day* would hit already_checked_in on
  // its very first scan instead of checked_in, failing the first
  // assertion. Delete by the exact (studentId, venueId, checkInDate)
  // triple only — not a broader filter — so a genuine, differently-dated
  // seed CheckIn for this same student+venue is never touched.
  await prisma.checkIn.deleteMany({
    where: { studentId: unrelatedStudent.id, venueId: shiftWithCoach.venueId, checkInDate: (await import("../src/lib/dates")).getSingaporeTodayString() },
  });

  await prisma.$disconnect();
  console.log(
    "PASS: scan_check_in RPC bypasses the Student RLS gap correctly (only for a coach with an open shift); " +
      "scanCheckIn/getCheckInCountForShift correctly handle checked_in, already_checked_in, not_found, and the no-open-shift error",
  );
}

main();

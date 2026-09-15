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
  // Needs >= 2 active enrollments to meaningfully test
  // submitAttendanceSession's "mark everyone" rule (reject with 1 of 2
  // marked, succeed once both are).
  const assignment = await prisma.classAssignment.findFirstOrThrow({
    where: { class: { enrollments: { some: { status: "ACTIVE" } } } },
    include: { coach: true, class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: true } } } } },
  });
  const otherCoach = await prisma.coach.findFirstOrThrow({ where: { email: { not: assignment.coach.email } } });

  // Seed data has only one real active enrollment total (confirmed
  // directly — no class has 2+), so temporarily create a second one via
  // Prisma (setup only, not something under test — same convention as
  // every other script's fixture lookups) for the duration of this run,
  // then remove it in teardown. Picks a student with zero existing
  // Enrollment rows for this class (any status) — Enrollment has a
  // DB-level unique index on (studentId, classId), same as Task 7.
  const existingEnrolledIds = assignment.class.enrollments.map((e) => e.studentId);
  const alreadyLinked = await prisma.enrollment.findMany({ where: { classId: assignment.classId }, select: { studentId: true } });
  const excludeIds = new Set([...existingEnrolledIds, ...alreadyLinked.map((e) => e.studentId)]);
  const extraStudent = await prisma.student.findFirstOrThrow({ where: { id: { notIn: [...excludeIds] } } });
  const extraEnrollment = await prisma.enrollment.create({
    data: { id: crypto.randomUUID(), studentId: extraStudent.id, classId: assignment.classId, status: "ACTIVE" },
  });
  const students = [...assignment.class.enrollments.map((e) => e.student), extraStudent];
  const sessionDate = "2019-06-15"; // arbitrary, unused-so-far date — avoids clashing with real seed sessions

  const { session: coachSession } = await coachClient(assignment.coach.email, "Coach123!");
  const { markAttendanceRecord, submitAttendanceSession, reopenAttendanceSession, getRosterWithSession, getRecentSessionsForClass, buildGuardianMessage } =
    await import("../src/lib/api/attendance");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");
  await sharedSupabase.auth.setSession(coachSession);

  // markAttendanceRecord-equivalent: mark all but the last student first.
  let firstSessionId: string | undefined;
  for (let i = 0; i < students.length - 1; i++) {
    const result = await markAttendanceRecord(assignment.coachId, {
      classId: assignment.classId,
      sessionDate,
      studentId: students[i].id,
      status: i === 0 ? "PRESENT" : "LATE",
    });
    if (!result.success) {
      console.error(`FAIL: markAttendanceRecord should succeed for the assigned coach marking student ${i}, got`, result);
      process.exit(1);
    }
    // Regression check: a naive upsert-with-a-fresh-id-every-call would
    // silently change the session's own id on every subsequent mark
    // (confirmed directly against the live project before this fix) —
    // the session's identity must stay stable across every mark within it.
    if (firstSessionId === undefined) {
      firstSessionId = result.data.sessionId;
    } else if (result.data.sessionId !== firstSessionId) {
      console.error(`FAIL: markAttendanceRecord changed the session id across calls (${firstSessionId} -> ${result.data.sessionId}) — it must stay stable.`);
      process.exit(1);
    }
  }

  // markAttendanceRecord-equivalent rejection: a non-assigned coach.
  const { session: otherCoachSession } = await coachClient(otherCoach.email, "Coach123!");
  await sharedSupabase.auth.setSession(otherCoachSession);
  const rejectedMark = await markAttendanceRecord(otherCoach.id, {
    classId: assignment.classId,
    sessionDate,
    studentId: students[0].id,
    status: "PRESENT",
  });
  if (rejectedMark.success) {
    console.error("FAIL: markAttendanceRecord should be rejected for a coach not assigned to this class, got", rejectedMark);
    process.exit(1);
  }
  await sharedSupabase.auth.setSession(coachSession);

  // getRosterWithSession-equivalent
  const roster = await getRosterWithSession(assignment.classId, sessionDate);
  if (!roster || roster.roster.length !== students.length || !roster.session || roster.session.markedByCoach?.id !== assignment.coachId) {
    console.error("FAIL: getRosterWithSession should return the full roster with a populated markedByCoach, got", roster);
    process.exit(1);
  }
  const markedCount = roster.roster.filter((r) => r.record !== null).length;
  if (markedCount !== students.length - 1) {
    console.error(`FAIL: getRosterWithSession should show ${students.length - 1} marked records before the last student is marked, got ${markedCount}.`);
    process.exit(1);
  }

  // submitAttendanceSession-equivalent rejection: not everyone marked yet.
  const prematureSubmit = await submitAttendanceSession({ classId: assignment.classId, sessionDate });
  if (prematureSubmit.success || prematureSubmit.error !== "Mark every student before saving.") {
    console.error("FAIL: submitAttendanceSession should reject with its specific message before every student is marked, got", prematureSubmit);
    process.exit(1);
  }

  // Mark the last student (ABSENT — deliberately not PRESENT/LATE, so the
  // notified+skipped count below should equal students.length - 1, not
  // students.length).
  const lastMarkResult = await markAttendanceRecord(assignment.coachId, {
    classId: assignment.classId,
    sessionDate,
    studentId: students[students.length - 1].id,
    status: "ABSENT",
  });
  if (!lastMarkResult.success || lastMarkResult.data.sessionId !== firstSessionId) {
    console.error("FAIL: marking the last student should succeed and keep the same session id, got", lastMarkResult, "expected sessionId", firstSessionId);
    process.exit(1);
  }

  // submitAttendanceSession-equivalent success
  const submitResult = await submitAttendanceSession({ classId: assignment.classId, sessionDate });
  if (!submitResult.success) {
    console.error("FAIL: submitAttendanceSession should succeed once every student is marked, got", submitResult);
    process.exit(1);
  }
  const expectedNotifications = students.length - 1; // everyone except the one marked ABSENT
  if (submitResult.data.notified + submitResult.data.skipped !== expectedNotifications) {
    console.error(
      `FAIL: submitAttendanceSession's notified+skipped should total ${expectedNotifications} (PRESENT/LATE marks only), got`,
      submitResult.data,
    );
    process.exit(1);
  }

  // markAttendanceRecord-equivalent rejection: session is now locked.
  const lockedMarkResult = await markAttendanceRecord(assignment.coachId, {
    classId: assignment.classId,
    sessionDate,
    studentId: students[0].id,
    status: "ABSENT",
  });
  if (lockedMarkResult.success || lockedMarkResult.error !== "This session is locked — reopen it to make changes.") {
    console.error("FAIL: markAttendanceRecord should reject with its specific message on a submitted (locked) session, got", lockedMarkResult);
    process.exit(1);
  }

  // reopenAttendanceSession-equivalent
  const reopenResult = await reopenAttendanceSession({ sessionId: firstSessionId! });
  if (!reopenResult.success) {
    console.error("FAIL: reopenAttendanceSession should succeed for the assigned coach, got", reopenResult);
    process.exit(1);
  }

  // Confirms the reopen actually unlocked it — marking again should work.
  const postReopenMark = await markAttendanceRecord(assignment.coachId, {
    classId: assignment.classId,
    sessionDate,
    studentId: students[0].id,
    status: "LATE",
    remarks: "verify-attendance-module: reopened and re-marked",
  });
  if (!postReopenMark.success) {
    console.error("FAIL: markAttendanceRecord should succeed again after the session is reopened, got", postReopenMark);
    process.exit(1);
  }

  // getRecentSessionsForClass-equivalent
  const recentSessions = await getRecentSessionsForClass(assignment.classId);
  const found = recentSessions.find((s) => s.id === firstSessionId);
  if (!found || found._count.records !== students.length) {
    console.error("FAIL: getRecentSessionsForClass should include the test session with the correct record count, got", found);
    process.exit(1);
  }

  // buildGuardianMessage-equivalent (pure function, no network needed)
  const message = buildGuardianMessage({ studentName: "Test Student", classLabel: "Test Class", status: "PRESENT", sessionDate: "2019-06-15" });
  if (!message.includes("Test Student") || !message.includes("present") || !message.includes("Test Class")) {
    console.error("FAIL: buildGuardianMessage should include the student name, status, and class label, got", message);
    process.exit(1);
  }

  // sendGuardianAttendanceNotification-equivalent: already exercised
  // end-to-end via submitAttendanceSession's internal loop above — confirm
  // the resulting GuardianNotification rows actually exist and their
  // delivered flags line up with each student's emergencyContactPhone.
  const notifications = await prisma.guardianNotification.findMany({
    where: { classId: assignment.classId, sessionDate },
    include: { student: true },
  });
  if (notifications.length !== expectedNotifications) {
    console.error(`FAIL: expected ${expectedNotifications} GuardianNotification rows (one per PRESENT/LATE student), found ${notifications.length}.`);
    process.exit(1);
  }
  for (const n of notifications) {
    if (n.delivered !== (n.student.emergencyContactPhone != null)) {
      console.error("FAIL: GuardianNotification.delivered should match whether the student has an emergencyContactPhone on file, got", n);
      process.exit(1);
    }
  }

  await sharedSupabase.auth.signOut();

  // Teardown: this script's own session + its records + guardian
  // notifications, scoped by the exact (classId, sessionDate) it used —
  // not a broader filter (see the lesson from Task 9's cleanup mistake) —
  // plus the temporary enrollment created above, by its own exact id.
  await prisma.guardianNotification.deleteMany({ where: { classId: assignment.classId, sessionDate } });
  await prisma.attendanceSession.deleteMany({ where: { classId: assignment.classId, sessionDate } }); // cascades AttendanceRecord
  await prisma.enrollment.delete({ where: { id: extraEnrollment.id } });

  await prisma.$disconnect();
  console.log(
    "PASS: Attendance module's full lifecycle (mark -> roster -> submit -> lock -> reopen -> re-mark) behaves correctly under RLS, " +
      "session/record ids stay stable across marks, and guardian notifications match expectations",
  );
}

main();

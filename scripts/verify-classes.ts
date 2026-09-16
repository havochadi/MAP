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
  // — final whole-branch review finding I3: getClassesForCoach is the most
  // logic-heavy function in this task (two-stage narrowing, a Map-based
  // session join, a manual enrollment count, a two-key sort) and had never
  // had a single line of its actual shipped code run; createClass spreads
  // a Zod result straight into an .insert(), which only calling the real
  // function (not a replica with a hand-written literal) can catch drifting.
  const {
    getClassesForCoach,
    getClassById,
    getClassDetail,
    getAllClassesForSelect,
    getAllVenuesWithClassCounts,
    getVenueWithClasses,
    createClass,
  } = await import("../src/lib/api/classes");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");

  const assignment = await prisma.classAssignment.findFirst({ include: { coach: true, class: true } });
  if (!assignment) throw new Error("No ClassAssignment found in seed data — cannot run this check.");

  await sharedSupabase.auth.setSession(await coachSession(assignment.coach.email, "Coach123!"));

  // getClassesForCoach-equivalent, non-admin branch: also gives us a class
  // outside this coach's assignments, needed to actually prove the
  // narrowing filter below (checking that the assigned class is *present*
  // is not the same as checking that unrelated classes are *excluded* —
  // Class RLS is fully open (`using (true)`), so nothing else would catch
  // a regression if that app-level filter were ever silently dropped).
  const myClasses = await getClassesForCoach(assignment.coachId, false);
  if (!myClasses.some((c) => c.id === assignment.classId)) {
    console.error("FAIL: getClassesForCoach should include the coach's assigned class, got", myClasses);
    process.exit(1);
  }

  const allClasses = await getAllClassesForSelect();
  if (!allClasses || allClasses.length === 0) {
    console.error("FAIL: getAllClassesForSelect should return rows, got", allClasses);
    process.exit(1);
  }
  const myClassIds = myClasses.map((c) => c.id);
  const unassignedClass = allClasses.find((c) => !myClassIds.includes(c.id));
  if (!unassignedClass) {
    throw new Error(
      "Seed data has this coach assigned to every class — cannot prove getClassesForCoach's narrowing filter excludes anything. Pick a different coach or add more classes to seed data.",
    );
  }
  if (myClasses.some((c) => c.id === unassignedClass.id)) {
    console.error("FAIL: getClassesForCoach leaked a class this coach isn't assigned to:", unassignedClass.id);
    process.exit(1);
  }

  // getClassesForCoach-equivalent, admin branch: isAdmin=true should see
  // every class, not just assigned ones — never separately covered before
  // (the only prior assertion exercised the non-admin narrowing path).
  const adminView = await getClassesForCoach(assignment.coachId, true);
  if (!adminView.some((c) => c.id === unassignedClass.id)) {
    console.error("FAIL: getClassesForCoach(isAdmin=true) should include classes the coach isn't assigned to, got", adminView);
    process.exit(1);
  }

  const byId = await getClassById(assignment.classId);
  if (!byId || !byId.venue) {
    console.error("FAIL: getClassById should return the class with its venue joined, got", byId);
    process.exit(1);
  }

  const detail = await getClassDetail(assignment.classId);
  if (!detail || !detail.venue || !Array.isArray(detail.enrollments) || !Array.isArray(detail.assignments)) {
    console.error("FAIL: getClassDetail should return the class with venue, enrollments and assignments, got", detail);
    process.exit(1);
  }
  if (!detail.assignments.some((a) => a.coachId === assignment.coachId && a.coach?.id === assignment.coachId)) {
    console.error("FAIL: getClassDetail's assignments should include this coach, coach_public-joined, got", detail.assignments);
    process.exit(1);
  }

  const venuesWithCounts = await getAllVenuesWithClassCounts();
  if (!venuesWithCounts || venuesWithCounts.length === 0) {
    console.error("FAIL: getAllVenuesWithClassCounts should return rows, got", venuesWithCounts);
    process.exit(1);
  }

  const venueWithClasses = await getVenueWithClasses(assignment.class.venueId);
  if (!venueWithClasses || venueWithClasses.classes.length === 0) {
    console.error("FAIL: getVenueWithClasses should return the venue with its classes, got", venueWithClasses);
    process.exit(1);
  }

  const rejectedClass = await createClass({
    venueId: assignment.class.venueId,
    subject: "MATH",
    level: "P3",
    dayOfWeek: "MON",
    startTime: "16:00",
    durationMinutes: 60,
  });
  if (rejectedClass.success) {
    console.error("FAIL: createClass should be rejected by RLS for a non-admin coach.");
    process.exit(1);
  }

  // The rejection case above only proves half of createClass's two
  // outcomes — the allowed path, including the .insert().select()
  // interaction, is unverified without this (the rejected insert above
  // never created a row, so reusing its exact field values here can't
  // collide).
  await sharedSupabase.auth.setSession(await coachSession("admin@map.test", "Coach123!"));
  const createdClass = await createClass({
    venueId: assignment.class.venueId,
    subject: "MATH",
    level: "P3",
    dayOfWeek: "MON",
    startTime: "16:00",
    durationMinutes: 60,
  });
  if (!createdClass.success) {
    console.error("FAIL: createClass should succeed for an admin, got", createdClass);
    process.exit(1);
  }

  await sharedSupabase.auth.signOut();

  // Teardown: the one Class this run's createClass call created, by its
  // own generated id only — never a broader subject/level/day filter.
  // Final whole-branch review finding I2: this script previously left a
  // MATH/P3/MON/16:00 class behind on every run with no cleanup, and the
  // ledger (Task 7) already identifies this exact payload as a direct
  // contributor to a prior fixture-pool exhaustion incident.
  await prisma.class.delete({ where: { id: createdClass.data.classId } });

  await prisma.$disconnect();
  console.log(
    "PASS: Classes module (list for coach incl. narrowing, list for admin, byId, detail with venue+enrollments+assignments, " +
      "getAllClassesForSelect, venue counts, venue-with-classes) all work; class insert succeeds for admin and is rejected for a non-admin",
  );
}

main();

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
  const assignment = await prisma.classAssignment.findFirst({ include: { coach: true, class: true } });
  if (!assignment) throw new Error("No ClassAssignment found in seed data — cannot run this check.");

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");

  const { data: myAssignments } = await assignedClient.from("ClassAssignment").select("classId").eq("coachId", assignment.coachId);
  if (!myAssignments || !myAssignments.some((a) => a.classId === assignment.classId)) {
    console.error("FAIL: getClassesForCoach-equivalent's assignment lookup didn't find the expected class.");
    process.exit(1);
  }

  // getAllClassesForSelect-equivalent: the full, unfiltered class list —
  // also gives us a class outside this coach's assignments, needed to
  // actually prove getClassesForCoach's narrowing filter below (checking
  // that the assignment lookup *found* the right class, above, is not the
  // same as checking that the follow-up Class query *excludes* everything
  // else — Class RLS is fully open (`using (true)`), so nothing else would
  // catch a regression if that filter were ever silently dropped).
  const { data: allClasses, error: allClassesError } = await assignedClient
    .from("Class")
    .select("*, venue:Venue(*)")
    .order("level", { ascending: true });
  if (allClassesError || !allClasses || allClasses.length === 0) {
    console.error("FAIL: getAllClassesForSelect-equivalent should return rows, got", allClassesError, allClasses);
    process.exit(1);
  }

  const classIds = myAssignments.map((a) => a.classId);
  const unassignedClass = allClasses.find((c) => !classIds.includes(c.id));
  if (!unassignedClass) {
    throw new Error("Seed data has this coach assigned to every class — cannot prove getClassesForCoach's narrowing filter excludes anything. Pick a different coach or add more classes to seed data.");
  }

  // getClassesForCoach-equivalent's actual narrowing step (the module's
  // .in("id", classIds) call): proving it returns exactly the coach's
  // assigned classes, and none of the (known-to-exist) unassigned ones.
  const { data: narrowedClasses, error: narrowedError } = await assignedClient.from("Class").select("id").in("id", classIds);
  if (narrowedError || !narrowedClasses || narrowedClasses.length !== classIds.length) {
    console.error("FAIL: getClassesForCoach-equivalent's narrowing query should return exactly the coach's assigned classes, got", narrowedError, narrowedClasses);
    process.exit(1);
  }
  if (narrowedClasses.some((c) => c.id === unassignedClass.id)) {
    console.error("FAIL: getClassesForCoach-equivalent's narrowing query leaked a class this coach isn't assigned to:", unassignedClass.id);
    process.exit(1);
  }

  const { data: detail, error: detailError } = await assignedClient
    .from("Class")
    .select("*, venue:Venue(*), enrollments:Enrollment(*, student:Student(*))")
    .eq("id", assignment.classId)
    .eq("enrollments.status", "ACTIVE")
    .maybeSingle();
  if (detailError || !detail || !detail.venue) {
    console.error("FAIL: getClassDetail-equivalent should return the class with its venue joined, got", detailError, detail);
    process.exit(1);
  }

  const { data: coachRows, error: coachRowsError } = await assignedClient
    .from("coach_public")
    .select("id, name, isAdmin")
    .eq("id", assignment.coachId);
  if (coachRowsError || !coachRows || coachRows.length !== 1) {
    console.error("FAIL: coach_public lookup for the assignment's coach should return exactly one row, got", coachRowsError, coachRows);
    process.exit(1);
  }

  // getAllVenuesWithClassCounts-equivalent
  const { data: venues, error: venuesError } = await assignedClient.from("Venue").select("*").order("name", { ascending: true });
  if (venuesError || !venues || venues.length === 0) {
    console.error("FAIL: getAllVenuesWithClassCounts-equivalent should return venue rows, got", venuesError, venues);
    process.exit(1);
  }
  const venueIds = venues.map((v) => v.id);
  const { data: venueClasses, error: venueClassesError } = await assignedClient.from("Class").select("venueId").in("venueId", venueIds);
  const { data: venueCheckIns, error: venueCheckInsError } = await assignedClient.from("CheckIn").select("venueId").in("venueId", venueIds);
  // CheckIn is coach-shift-scoped by RLS, so a non-admin's result here may
  // legitimately be narrower than the true venue-wide count (empty is not
  // a failure) — only a real error is.
  if (venueClassesError || venueCheckInsError || !venueClasses || !venueCheckIns) {
    console.error("FAIL: getAllVenuesWithClassCounts-equivalent's class/check-in count queries should succeed, got", venueClassesError, venueCheckInsError);
    process.exit(1);
  }

  // getVenueWithClasses-equivalent
  const { data: venueRow, error: venueRowError } = await assignedClient
    .from("Venue")
    .select("*")
    .eq("id", assignment.class.venueId)
    .maybeSingle();
  if (venueRowError || !venueRow) {
    console.error("FAIL: getVenueWithClasses-equivalent's venue lookup should return a row, got", venueRowError, venueRow);
    process.exit(1);
  }
  const { data: venueClassRows, error: venueClassRowsError } = await assignedClient
    .from("Class")
    .select("*, enrollments:Enrollment(*)")
    .eq("venueId", assignment.class.venueId)
    .eq("enrollments.status", "ACTIVE");
  if (venueClassRowsError || !venueClassRows || venueClassRows.length === 0) {
    console.error("FAIL: getVenueWithClasses-equivalent's class lookup should return rows for the venue, got", venueClassRowsError, venueClassRows);
    process.exit(1);
  }

  const { error: writeError } = await assignedClient.from("Class").insert({
    id: crypto.randomUUID(),
    venueId: assignment.class.venueId,
    subject: "MATH",
    level: "P3",
    dayOfWeek: "MON",
    startTime: "16:00",
    durationMinutes: 60,
  });
  if (!writeError) {
    console.error("FAIL: createClass-equivalent should be rejected by RLS for a non-admin coach.");
    process.exit(1);
  }

  // The rejection case above only proves half of createClass's two
  // outcomes (ActionResult is success|failure) — the allowed path,
  // including the .insert().select() interaction, is unverified without
  // this (same gap class already found and fixed in Tasks 2/3/4's verify
  // scripts — the rejected insert above never created a row, so reusing
  // its exact field values here can't collide).
  const admin = await coachClient("admin@map.test", "Coach123!");
  const { data: createdClass, error: adminWriteError } = await admin
    .from("Class")
    .insert({
      id: crypto.randomUUID(),
      venueId: assignment.class.venueId,
      subject: "MATH",
      level: "P3",
      dayOfWeek: "MON",
      startTime: "16:00",
      durationMinutes: 60,
    })
    .select("id")
    .single();
  if (adminWriteError || !createdClass) {
    console.error("FAIL: createClass-equivalent should succeed for an admin, got", adminWriteError, createdClass);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("PASS: Classes module queries (list, narrowing, detail with venue+enrollments+student, coach_public lookup, venue counts, venue-with-classes) all work; class insert succeeds for admin and is rejected for a non-admin");
}

main();

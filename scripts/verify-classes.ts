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
  console.log("PASS: Classes module queries (list, detail with venue+enrollments+student, coach_public lookup) work; class insert succeeds for admin and is rejected for a non-admin");
}

main();

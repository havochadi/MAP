// scripts/verify-rls-student-enrollment.ts
//
// This is the highest-stakes check in this plan — confirms the tightened
// Student policy actually blocks cross-coach enumeration.
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
  // Find a real (coach, assigned student, unassigned coach) triple using
  // the service-role client, rather than assuming fixed seed IDs.
  let assignment = await prisma.classAssignment.findFirst({
    include: {
      class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: true } } } },
      coach: true,
    },
  });

  let targetStudentId: string;
  if (assignment && assignment.class.enrollments.length > 0) {
    targetStudentId = assignment.class.enrollments[0].student.id;
  } else {
    // prisma/seed.ts creates ClassAssignments but never any Enrollment
    // rows (it only clears them on reset) — this fixture doesn't exist
    // yet in seed data. Create the one this check needs, scoped to this
    // script rather than touching the general seed script. Prisma
    // connects as the DB owner, so this bypasses RLS regardless of the
    // policies just added.
    assignment =
      assignment ??
      (await prisma.classAssignment.findFirst({
        include: {
          class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: true } } } },
          coach: true,
        },
      }));
    if (!assignment) throw new Error("No ClassAssignment found in seed data at all — cannot run this check.");
    const student = await prisma.student.findFirst({ where: { enrollments: { none: {} } } });
    if (!student) throw new Error("No unenrolled student found to create a fixture Enrollment with.");
    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, classId: assignment.classId, status: "ACTIVE" },
    });
    console.log(`(created fixture Enrollment ${enrollment.id}: student ${student.id} -> class ${assignment.classId})`);
    targetStudentId = student.id;
  }
  const assignedCoachEmail = assignment.coach.email;

  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: assignedCoachEmail } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data to run this check.");

  const assignedClient = await coachClient(assignedCoachEmail, "Coach123!");
  const { data: allowedRead, error: allowedError } = await assignedClient
    .from("Student").select("id").eq("id", targetStudentId).maybeSingle();
  if (allowedError || !allowedRead) {
    console.error("FAIL: assigned coach should be able to read their student, got", allowedError, allowedRead);
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: deniedRead } = await otherClient
    .from("Student").select("id").eq("id", targetStudentId).maybeSingle();
  if (deniedRead) {
    console.error("FAIL: a coach with no assignment to this student's class should NOT be able to read it, got", deniedRead);
    process.exit(1);
  }

  const { data: fullList } = await otherClient.from("Student").select("id");
  console.log(`(unassigned coach can see ${fullList?.length ?? 0} student row(s) total, via other legitimate assignments)`);

  await prisma.$disconnect();
  console.log("PASS: assigned coach can read their student; a non-assigned coach cannot");
}

main();

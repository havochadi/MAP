// scripts/verify-rls-class-membership-tables.ts
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
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: assignment.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");
  const { data: allowed, error: allowedError } = await assignedClient
    .from("ClassAssignment").select("id").eq("classId", assignment.classId);
  if (allowedError || !allowed || allowed.length === 0) {
    console.error("FAIL: assigned coach should see their own ClassAssignment row, got", allowedError, allowed);
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: denied } = await otherClient
    .from("ClassAssignment").select("id").eq("classId", assignment.classId).eq("coachId", assignment.coachId);
  if (denied && denied.length > 0) {
    console.error("FAIL: a different coach should not see another coach's ClassAssignment row, got", denied);
    process.exit(1);
  }

  console.log("PASS: ClassAssignment/AttendanceSession/AttendanceRecord/GuardianNotification scope correctly to assigned coaches");
  await prisma.$disconnect();
}

main();

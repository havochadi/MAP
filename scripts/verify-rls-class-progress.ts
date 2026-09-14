// scripts/verify-rls-class-progress.ts
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
  const assignment = await prisma.classAssignment.findFirst({ include: { coach: true } });
  if (!assignment) throw new Error("No ClassAssignment found in seed data — cannot run this check.");
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: assignment.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");
  const { error: readError } = await assignedClient.from("ClassProgress").select("id").eq("classId", assignment.classId);
  if (readError) {
    console.error("FAIL: assigned coach should be able to query ClassProgress for their class, got", readError);
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: otherRows } = await otherClient.from("ClassProgress").select("id").eq("classId", assignment.classId);
  if (otherRows && otherRows.length > 0) {
    console.error("FAIL: a non-assigned coach should not see this class's progress rows, got", otherRows);
    process.exit(1);
  }

  console.log("PASS: ClassProgress scopes to assigned coaches");
  await prisma.$disconnect();
}

main();

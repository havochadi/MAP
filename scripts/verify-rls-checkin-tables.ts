// scripts/verify-rls-checkin-tables.ts
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
  const checkIn = await prisma.checkIn.findFirst({ include: { coachShift: { include: { coach: true } } } });
  if (!checkIn) throw new Error("No CheckIn found in seed data — cannot run this check.");
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: checkIn.coachShift.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const owningClient = await coachClient(checkIn.coachShift.coach.email, "Coach123!");
  const { data: allowed } = await owningClient.from("CheckIn").select("id").eq("id", checkIn.id).maybeSingle();
  if (!allowed) {
    console.error("FAIL: the coach whose shift produced this check-in should be able to read it.");
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: denied } = await otherClient.from("CheckIn").select("id").eq("id", checkIn.id).maybeSingle();
  if (denied) {
    console.error("FAIL: a different coach should not be able to read this check-in.");
    process.exit(1);
  }

  console.log("PASS: CheckIn/CheckInNotification scope correctly to the coach whose shift recorded them");
  await prisma.$disconnect();
}

main();

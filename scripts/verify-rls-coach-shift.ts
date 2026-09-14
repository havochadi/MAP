// scripts/verify-rls-coach-shift.ts
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
  const shift = await prisma.coachShift.findFirst({ include: { coach: true } });
  if (!shift) throw new Error("No CoachShift found in seed data — cannot run this check.");
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: shift.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const owningClient = await coachClient(shift.coach.email, "Coach123!");
  const { data: ownRead } = await owningClient.from("CoachShift").select("id").eq("id", shift.id).maybeSingle();
  if (!ownRead) {
    console.error("FAIL: a coach should be able to read their own shift.");
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: otherRead } = await otherClient.from("CoachShift").select("id").eq("id", shift.id).maybeSingle();
  if (otherRead) {
    console.error("FAIL: a different coach should not be able to read this shift.");
    process.exit(1);
  }

  const { error: otherWriteError } = await otherClient
    .from("CoachShift").update({ reviewNote: "should fail" }).eq("id", shift.id);
  const { data: unchanged } = await owningClient.from("CoachShift").select("reviewNote").eq("id", shift.id).single();
  if (unchanged?.reviewNote === "should fail") {
    console.error("FAIL: a different coach's update should not have applied.", otherWriteError);
    process.exit(1);
  }

  console.log("PASS: CoachShift is readable/writable only by its own coach (or admin)");
  await prisma.$disconnect();
}

main();

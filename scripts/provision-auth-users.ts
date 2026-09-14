// scripts/provision-auth-users.ts
//
// One-off: creates a Supabase Auth identity for every Coach/Student that
// doesn't have one yet, and links it via authUserId. Safe to re-run — it
// skips rows that already have an authUserId.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();
const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const DEMO_COACH_PASSWORD = "Coach123!";

function studentSyntheticEmail(studentId: string): string {
  return `student-${studentId}@students.map.internal`;
}

async function provisionCoaches() {
  const coaches = await prisma.coach.findMany({ where: { authUserId: null } });
  for (const coach of coaches) {
    const { data, error } = await admin.auth.admin.createUser({
      email: coach.email,
      password: DEMO_COACH_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create auth user for coach ${coach.email}: ${error?.message}`);
    }
    await prisma.coach.update({ where: { id: coach.id }, data: { authUserId: data.user.id } });
    console.log(`linked coach ${coach.email} -> ${data.user.id}`);
  }
}

async function provisionStudents() {
  const students = await prisma.student.findMany({ where: { authUserId: null } });
  for (const student of students) {
    const syntheticEmail = studentSyntheticEmail(student.id);
    const randomPassword = crypto.randomUUID();
    const { data, error } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: randomPassword,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create auth user for student ${student.id}: ${error?.message}`);
    }
    await prisma.student.update({ where: { id: student.id }, data: { authUserId: data.user.id } });
    console.log(`linked student ${student.name} (${student.id}) -> ${data.user.id}`);
  }
}

async function main() {
  await provisionCoaches();
  await provisionStudents();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});

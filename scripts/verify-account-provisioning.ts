// scripts/verify-account-provisioning.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unlinkedCoaches = await prisma.coach.count({ where: { authUserId: null } });
  const unlinkedStudents = await prisma.student.count({ where: { authUserId: null } });
  if (unlinkedCoaches > 0 || unlinkedStudents > 0) {
    console.error(`FAIL: ${unlinkedCoaches} coach(es) and ${unlinkedStudents} student(s) still unlinked`);
    process.exit(1);
  }
  const totalCoaches = await prisma.coach.count();
  const totalStudents = await prisma.student.count();
  console.log(`PASS: all ${totalCoaches} coaches and ${totalStudents} students have authUserId set`);
  await prisma.$disconnect();
}

main();

// scripts/verify-claims-hook-function.ts
//
// Tests the SQL function logic directly, independent of whether it's been
// wired up as the active Auth Hook yet (that requires the dashboard step —
// this only proves the function itself returns the right shape).
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.coach.findFirst({ where: { isAdmin: true, authUserId: { not: null } } });
  if (!admin) throw new Error("No admin coach with authUserId found — run Task 3 first.");

  const result = await prisma.$queryRawUnsafe<{ custom_access_token_hook: unknown }[]>(
    `select public.custom_access_token_hook($1::jsonb) as custom_access_token_hook`,
    JSON.stringify({ user_id: admin.authUserId, claims: {} }),
  );
  const claims = (result[0].custom_access_token_hook as { claims: { isAdmin: boolean; role: string } }).claims;
  if (claims.isAdmin !== true || claims.role !== "coach") {
    console.error("FAIL: expected isAdmin=true, role=coach, got", claims);
    process.exit(1);
  }
  console.log("PASS: hook function stamps correct claims for an admin coach:", claims);
  await prisma.$disconnect();
}

main();

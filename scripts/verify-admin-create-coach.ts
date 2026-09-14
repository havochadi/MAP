// scripts/verify-admin-create-coach.ts
import "dotenv/config";

const loginUrl = `${process.env.SUPABASE_URL}/functions/v1/coach-login`;
const createUrl = `${process.env.SUPABASE_URL}/functions/v1/admin-create-coach`;

async function login(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.session?.access_token as string | undefined;
}

async function main() {
  const adminToken = await login("admin@map.test", "Coach123!");
  if (!adminToken) throw new Error("Could not log in as admin@map.test for this test.");

  const newEmail = `verify-test-coach-${Date.now()}@map.test`;
  const asAdmin = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Verify Test Coach", email: newEmail, password: "TempPass123!", isAdmin: false }),
  });
  const asAdminBody = await asAdmin.json();
  if (asAdmin.status !== 200 || !asAdminBody.coachId) {
    console.error("FAIL: admin should be able to create a coach, got", asAdmin.status, asAdminBody);
    process.exit(1);
  }

  const nonAdminToken = await login("farhan@map.test", "Coach123!");
  if (!nonAdminToken) throw new Error("Could not log in as farhan@map.test for this test.");

  const asNonAdmin = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${nonAdminToken}` },
    body: JSON.stringify({ name: "Should Fail", email: `should-fail-${Date.now()}@map.test`, password: "TempPass123!", isAdmin: false }),
  });
  if (asNonAdmin.status !== 403) {
    console.error("FAIL: non-admin should be rejected with 403, got", asNonAdmin.status, await asNonAdmin.json());
    process.exit(1);
  }

  console.log("PASS: admin can create a coach; non-admin is rejected with 403");
}

main();

// scripts/verify-student-login.ts
import "dotenv/config";

const url = `${process.env.SUPABASE_URL}/functions/v1/student-login`;

async function callLogin(code: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ code }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const good = await callLogin("GHW7UD");
  if (good.status !== 200 || !good.body.session?.access_token) {
    console.error("FAIL: expected 200 with a session for a valid code, got", good.status, good.body);
    process.exit(1);
  }

  const payload = JSON.parse(atob(good.body.session.access_token.split(".")[1]));
  // app_role, not role: the top-level `role` claim is reserved by
  // PostgREST for SET ROLE and must stay "authenticated" — see
  // 20260914083253_fix_auth_claims_hook_role_collision.
  if (payload.app_role !== "student") {
    console.error("FAIL: expected app_role=student in the issued JWT, got", payload.app_role);
    process.exit(1);
  }
  if (payload.role !== "authenticated") {
    console.error("FAIL: expected the reserved `role` claim to stay 'authenticated' (PostgREST SET ROLE), got", payload.role);
    process.exit(1);
  }

  const bad = await callLogin("ZZZZZZ");
  if (bad.status !== 401) {
    console.error("FAIL: expected 401 for an invalid code, got", bad.status, bad.body);
    process.exit(1);
  }

  console.log("PASS: valid code returns a session with role=student claim; invalid code is rejected");
}

main();

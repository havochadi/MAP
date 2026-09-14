// scripts/verify-coach-login.ts
import "dotenv/config";

const url = `${process.env.SUPABASE_URL}/functions/v1/coach-login`;

async function callLogin(email: string, password: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const good = await callLogin("admin@map.test", "Coach123!");
  if (good.status !== 200 || !good.body.session?.access_token) {
    console.error("FAIL: expected 200 with a session for correct credentials, got", good.status, good.body);
    process.exit(1);
  }

  // Decode the JWT payload (no verification needed here — just confirming
  // the claims hook actually reached this real, issued token).
  const payload = JSON.parse(atob(good.body.session.access_token.split(".")[1]));
  if (payload.isAdmin !== true || payload.role !== "coach") {
    console.error("FAIL: expected isAdmin=true, role=coach in the issued JWT, got", payload.isAdmin, payload.role);
    console.error("If this fails, confirm Task 4 Step 3 (enabling the hook in the dashboard) was done.");
    process.exit(1);
  }

  const bad = await callLogin("admin@map.test", "wrong-password");
  if (bad.status !== 401) {
    console.error("FAIL: expected 401 for wrong password, got", bad.status, bad.body);
    process.exit(1);
  }

  console.log("PASS: correct login returns a session with isAdmin/role claims; wrong password is rejected");
}

main();

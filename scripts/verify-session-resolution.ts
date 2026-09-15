import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

function decodeAppRole(accessToken: string): string | undefined {
  const payload = JSON.parse(atob(accessToken.split(".")[1])) as { app_role?: string };
  return payload.app_role;
}

async function main() {
  const loginRes = await fetch(`${url}/functions/v1/coach-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email: "farhan@map.test", password: "Coach123!" }),
  });
  const { session } = await loginRes.json();
  if (decodeAppRole(session.access_token) !== "coach") {
    console.error("FAIL: expected app_role=coach in the session used for lookup");
    process.exit(1);
  }

  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  const { data: coach, error } = await client
    .from("Coach")
    .select("id, name, email, isAdmin")
    .eq("authUserId", session.user.id)
    .maybeSingle();

  if (error || !coach || coach.email !== "farhan@map.test" || coach.isAdmin !== false) {
    console.error("FAIL: session-based Coach lookup didn't resolve to the expected row, got", error, coach);
    process.exit(1);
  }

  console.log("PASS: a coach session resolves to the correct CurrentCoach shape via app_role + authUserId lookup:", coach);

  // The coach and student branches of resolveSession() are symmetric but
  // independent code paths — testing only one leaves the other (equally
  // required — useRequireStudent/CurrentStudent) unverified against a real
  // backend, contrary to this plan's own Global Constraint naming both
  // coach-login and student-login explicitly.
  const studentLoginRes = await fetch(`${url}/functions/v1/student-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ code: "GHW7UD" }),
  });
  const { session: studentSession } = await studentLoginRes.json();
  if (decodeAppRole(studentSession.access_token) !== "student") {
    console.error("FAIL: expected app_role=student in the session used for lookup");
    process.exit(1);
  }

  const studentClient = createClient(url, anonKey);
  await studentClient.auth.setSession(studentSession);
  const { data: student, error: studentError } = await studentClient
    .from("Student")
    .select("id, name")
    .eq("authUserId", studentSession.user.id)
    .maybeSingle();

  if (studentError || !student || !student.name) {
    console.error("FAIL: session-based Student lookup didn't resolve to the expected row, got", studentError, student);
    process.exit(1);
  }
  console.log("PASS: a student session resolves to the correct CurrentStudent shape via app_role + authUserId lookup:", student);
}

main();

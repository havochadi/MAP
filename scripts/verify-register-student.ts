// scripts/verify-register-student.ts
import "dotenv/config";

const url = `${process.env.SUPABASE_URL}/functions/v1/register-student`;

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // deliberately NO Authorization header
    body: JSON.stringify({
      name: "Verification Test Student",
      level: "P3",
      contactNumber: "91234567",
      schoolName: "Test Primary School",
      email: "verify-test@example.com",
      isMapStudent: true,
      emergencyContactName: "Test Guardian",
      emergencyContactRelationship: "MOTHER",
      emergencyContactPhone: "91234567",
    }),
  });
  const body = await res.json();
  if (res.status !== 200 || !body.studentId || !body.loginCode) {
    console.error("FAIL: expected 200 with studentId+loginCode for an unauthenticated request, got", res.status, body);
    process.exit(1);
  }
  console.log("PASS: unauthenticated registration succeeded:", body);
}

main();

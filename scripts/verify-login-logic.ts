import "dotenv/config";
import { loginAction, studentLoginAction, quickLoginAction } from "../src/lib/api/auth";
import { supabase } from "../src/lib/supabase/client";

async function main() {
  const coachForm = new FormData();
  coachForm.set("email", "farhan@map.test");
  coachForm.set("password", "Coach123!");
  const coachResult = await loginAction(undefined, coachForm);
  if (!coachResult?.success) {
    console.error("FAIL: loginAction should succeed with valid coach credentials, got", coachResult);
    process.exit(1);
  }
  await supabase.auth.signOut();

  const badForm = new FormData();
  badForm.set("email", "farhan@map.test");
  badForm.set("password", "wrong-password");
  const badResult = await loginAction(undefined, badForm);
  if (!badResult?.error) {
    console.error("FAIL: loginAction should return an error for a wrong password, got", badResult);
    process.exit(1);
  }

  const studentForm = new FormData();
  studentForm.set("code", "GHW7UD");
  const studentResult = await studentLoginAction(undefined, studentForm);
  if (!studentResult?.success) {
    console.error("FAIL: studentLoginAction should succeed with a valid code, got", studentResult);
    process.exit(1);
  }
  await supabase.auth.signOut();

  // Mirrors the coach wrong-password check above — studentLoginAction has
  // two distinct branches (valid code -> success, invalid -> error) and
  // only testing the success one leaves the error branch unverified
  // against the real backend (same gap class as Task 2's coach/student
  // asymmetry, recurring here between success/failure instead).
  const badStudentForm = new FormData();
  badStudentForm.set("code", "ZZZZZZ");
  const badStudentResult = await studentLoginAction(undefined, badStudentForm);
  if (!badStudentResult?.error) {
    console.error("FAIL: studentLoginAction should return an error for an invalid code, got", badStudentResult);
    process.exit(1);
  }

  const quickResult = await quickLoginAction("admin");
  if (!quickResult?.success) {
    console.error("FAIL: quickLoginAction('admin') should succeed, got", quickResult);
    process.exit(1);
  }
  await supabase.auth.signOut();

  console.log("PASS: loginAction/studentLoginAction/quickLoginAction all sign in correctly and reject bad credentials");
}

main();

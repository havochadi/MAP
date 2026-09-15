import { supabase } from "@/lib/supabase/client";

export type LoginState = { error?: string; success?: true } | undefined;
export type QuickLoginRole = "coach" | "admin" | "student";

// Same demo accounts as src/actions/coaches.ts's quickLoginAction — see
// that file's comment for why these are deliberately not gated to
// non-production (already published in the README).
const QUICK_LOGIN_COACH_ACCOUNTS: Record<"coach" | "admin", { email: string; password: string }> = {
  coach: { email: "farhan@map.test", password: "Coach123!" },
  admin: { email: "admin@map.test", password: "Coach123!" },
};
const QUICK_LOGIN_STUDENT_CODE = "GHW7UD";

async function signInCoach(email: string, password: string): Promise<LoginState> {
  const { data, error } = await supabase.functions.invoke<{ session?: import("@supabase/supabase-js").Session; error?: string }>(
    "coach-login",
    { body: { email, password } },
  );
  if (error || !data?.session) return { error: "Invalid email or password." };
  await supabase.auth.setSession(data.session);
  return { success: true };
}

async function signInStudent(code: string): Promise<LoginState> {
  const { data, error } = await supabase.functions.invoke<{ session?: import("@supabase/supabase-js").Session; error?: string }>(
    "student-login",
    { body: { code } },
  );
  if (error || !data?.session) return { error: "That code wasn't recognised. Check with your coach and try again." };
  await supabase.auth.setSession(data.session);
  return { success: true };
}

export async function quickLoginAction(role: QuickLoginRole): Promise<LoginState> {
  if (role === "student") return signInStudent(QUICK_LOGIN_STUDENT_CODE);
  const { email, password } = QUICK_LOGIN_COACH_ACCOUNTS[role];
  return signInCoach(email, password);
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  return signInCoach(email, password);
}

export async function studentLoginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const code = String(formData.get("code") ?? "");
  return signInStudent(code);
}

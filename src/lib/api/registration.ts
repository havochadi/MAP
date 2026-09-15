import { supabase } from "@/lib/supabase/client";
import { registerStudentSchema } from "@/validations/registration";
import type { ActionResult } from "./types";

// supabase-js's functions.invoke() never populates `data` on a non-2xx
// response — it throws internally and returns { data: null, error } before
// the body is ever parsed as JSON (same gotcha already fixed for
// createCoach in src/lib/api/coaches.ts). The Edge Function's actual
// { error: "..." } body only exists inside error.context, a raw,
// single-read Response — so `data?.error` below is otherwise permanently
// unreachable dead code, and register-student's real failure message
// (e.g. "Registration failed.") would silently be replaced by the generic
// fallback instead.
async function edgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const body = await context.clone().json();
        if (typeof body?.error === "string") return body.error;
      } catch {
        // Response body wasn't JSON (e.g. a network-level FunctionsFetchError
        // with no HTTP response at all) — fall through to the fallback.
      }
    }
  }
  return fallback;
}

export async function registerStudent(input: unknown): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const { data, error } = await supabase.functions.invoke<{ studentId?: string; loginCode?: string; error?: string }>(
    "register-student",
    { body: parsed.data },
  );
  if (error || !data?.studentId || !data.loginCode) {
    return { success: false, error: await edgeFunctionErrorMessage(error, "Please check the form — something wasn't filled in correctly.") };
  }
  return { success: true, data: { studentId: data.studentId, loginCode: data.loginCode } };
}

export async function registerAndCheckInStudent(
  input: unknown,
): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const { data, error } = await supabase.rpc("register_and_checkin_student", { p_student: parsed.data });
  const result = data as { studentId?: string; loginCode?: string; error?: string } | null;
  if (error || !result?.studentId || !result.loginCode) {
    return { success: false, error: result?.error ?? "Could not register and check in." };
  }
  return { success: true, data: { studentId: result.studentId, loginCode: result.loginCode } };
}

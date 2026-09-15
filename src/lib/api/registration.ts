import { supabase } from "@/lib/supabase/client";
import { registerStudentSchema } from "@/validations/registration";
import type { ActionResult } from "./types";

export async function registerStudent(input: unknown): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const { data, error } = await supabase.functions.invoke<{ studentId?: string; loginCode?: string; error?: string }>(
    "register-student",
    { body: parsed.data },
  );
  if (error || !data?.studentId || !data.loginCode) {
    return { success: false, error: data?.error ?? "Please check the form — something wasn't filled in correctly." };
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

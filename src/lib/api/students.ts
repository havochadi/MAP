import { supabase } from "@/lib/supabase/client";
import { enrollStudentSchema, dropEnrollmentSchema, updateStudentStatusSchema } from "@/validations/student";
import type { ActionResult } from "./types";

const MAX_ACTIVE_ENROLLMENTS = 3;
const LOGIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // matches src/lib/login-code.ts exactly

function randomLoginCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += LOGIN_CODE_ALPHABET[Math.floor(Math.random() * LOGIN_CODE_ALPHABET.length)];
  return code;
}

async function generateUniqueLoginCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomLoginCode();
    const { data } = await supabase.from("Student").select("id").eq("loginCode", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique login code after 10 attempts.");
}

export async function getStudentProfile(studentId: string) {
  const { data: student, error: studentError } = await supabase.from("Student").select("*").eq("id", studentId).maybeSingle();
  if (studentError) throw studentError;
  if (!student) return null;

  const { data: checkIns, error: checkInsError } = await supabase
    .from("CheckIn")
    .select("*, venue:Venue(*)")
    .eq("studentId", studentId)
    .order("checkInDate", { ascending: false });
  if (checkInsError) throw checkInsError;

  return { student, checkIns };
}

export async function getStudentsForCoach() {
  const { data, error } = await supabase.from("Student").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function regenerateLoginCode(studentId: string): Promise<ActionResult<{ loginCode: string }>> {
  const loginCode = await generateUniqueLoginCode();
  // .select() + emptiness check, not just `error` — see Global Constraints.
  const { data, error } = await supabase.from("Student").update({ loginCode }).eq("id", studentId).select("id").maybeSingle();
  if (error || !data) return { success: false, error: "Could not regenerate login code." };
  return { success: true, data: { loginCode } };
}

export async function enrollStudentInClass(input: unknown): Promise<ActionResult> {
  const parsed = enrollStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { studentId, classId } = parsed.data;

  const { count: activeCount } = await supabase
    .from("Enrollment")
    .select("id", { count: "exact", head: true })
    .eq("studentId", studentId)
    .eq("status", "ACTIVE");
  if ((activeCount ?? 0) >= MAX_ACTIVE_ENROLLMENTS) {
    return { success: false, error: `Students can be enrolled in at most ${MAX_ACTIVE_ENROLLMENTS} classes.` };
  }

  const { data: existing } = await supabase
    .from("Enrollment")
    .select("*")
    .eq("studentId", studentId)
    .eq("classId", classId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "ACTIVE") return { success: false, error: "Already enrolled in this class." };
    const { data, error } = await supabase
      .from("Enrollment")
      .update({ status: "ACTIVE" })
      .eq("id", existing.id)
      .select("id")
      .maybeSingle();
    if (error || !data) return { success: false, error: "Could not re-activate enrollment." };
  } else {
    const { error } = await supabase.from("Enrollment").insert({ id: crypto.randomUUID(), studentId, classId });
    if (error) return { success: false, error: "Could not enroll student." };
  }

  return { success: true, data: undefined };
}

export async function dropEnrollment(input: unknown): Promise<ActionResult> {
  const parsed = dropEnrollmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("Enrollment")
    .update({ status: "DROPPED" })
    .eq("id", parsed.data.enrollmentId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Could not drop enrollment." };
  return { success: true, data: undefined };
}

export async function updateStudentStatus(input: unknown): Promise<ActionResult> {
  const parsed = updateStudentStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { studentId, status } = parsed.data;

  const { data, error } = await supabase.from("Student").update({ status }).eq("id", studentId).select("id").maybeSingle();
  if (error || !data) return { success: false, error: "Could not update student status." };
  return { success: true, data: undefined };
}

import { supabase } from "@/lib/supabase/client";
import { createCoachSchema } from "@/validations/coach";
import { classAssignmentSchema } from "@/validations/class";
import type { ActionResult } from "./types";

export async function getCoachProfile(coachId: string) {
  const { data: coachRow, error: coachError } = await supabase.from("Coach").select("*").eq("id", coachId).maybeSingle();
  if (coachError) throw coachError;
  if (!coachRow) return null;

  const { data: assignments, error: assignmentsError } = await supabase
    .from("ClassAssignment")
    .select("*, class:Class(*, venue:Venue(*), enrollments:Enrollment(*))")
    .eq("coachId", coachId)
    .eq("class.enrollments.status", "ACTIVE");
  if (assignmentsError) throw assignmentsError;

  const assignmentsWithCounts = assignments
    .map((a) => ({ ...a, class: { ...a.class, _count: { enrollments: a.class.enrollments.length } } }))
    .sort((a, b) => a.class.venue.name.localeCompare(b.class.venue.name));

  const coach = { ...coachRow, assignments: assignmentsWithCounts };
  const classIds = assignmentsWithCounts.map((a) => a.classId);
  if (classIds.length === 0) return { coach, sessionsCount: 0, studentCount: 0 };

  const [{ count: sessionsCount, error: sessionsError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
    supabase.from("AttendanceSession").select("id", { count: "exact", head: true }).in("classId", classIds).eq("markedByCoachId", coachId),
    supabase.from("Enrollment").select("studentId").in("classId", classIds).eq("status", "ACTIVE"),
  ]);
  if (sessionsError) throw sessionsError;
  if (enrollmentsError) throw enrollmentsError;

  return { coach, sessionsCount: sessionsCount ?? 0, studentCount: new Set(enrollments.map((e) => e.studentId)).size };
}

export async function getAllCoachesForSelect() {
  const { data, error } = await supabase.from("Coach").select("id, name, email").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

// supabase-js's functions.invoke() never populates `data` on a non-2xx
// response — it throws internally and returns { data: null, error } before
// the body is ever parsed as JSON (confirmed against
// @supabase/functions-js's FunctionsClient: the catch block always returns
// data: null). The Edge Function's actual { error: "..." } body only
// exists inside error.context, a raw, single-read Response — so `data?.error`
// is permanently unreachable dead code, and every failure (a taken email,
// "Admin access required.", bad input) would otherwise surface as the same
// generic fallback message instead of admin-create-coach's specific one.
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

export async function createCoach(input: unknown): Promise<ActionResult<{ coachId: string }>> {
  const parsed = createCoachSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase.functions.invoke<{ coachId?: string; error?: string }>("admin-create-coach", {
    body: parsed.data,
  });
  if (error || !data?.coachId) {
    return { success: false, error: await edgeFunctionErrorMessage(error, "Could not create coach.") };
  }
  return { success: true, data: { coachId: data.coachId } };
}

export async function assignCoachToClass(input: unknown): Promise<ActionResult> {
  const parsed = classAssignmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { coachId, classId } = parsed.data;

  const { data: existing } = await supabase
    .from("ClassAssignment")
    .select("id")
    .eq("coachId", coachId)
    .eq("classId", classId)
    .maybeSingle();
  if (existing) return { success: false, error: "Coach is already assigned to this class." };

  const { error } = await supabase.from("ClassAssignment").insert({ id: crypto.randomUUID(), coachId, classId });
  if (error) return { success: false, error: "Could not assign coach." };
  return { success: true, data: undefined };
}

export async function unassignCoachFromClass(input: unknown): Promise<ActionResult> {
  const parsed = classAssignmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { coachId, classId } = parsed.data;

  // .select() + emptiness check, not just `error` — an RLS-blocked delete
  // reports no error at all (see Global Constraints).
  const { data, error } = await supabase
    .from("ClassAssignment")
    .delete()
    .eq("coachId", coachId)
    .eq("classId", classId)
    .select("id");
  if (error || !data || data.length === 0) return { success: false, error: "Could not unassign coach." };
  return { success: true, data: undefined };
}

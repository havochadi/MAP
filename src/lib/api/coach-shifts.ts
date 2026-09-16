import { supabase } from "@/lib/supabase/client";
import { getSingaporeTodayString, getDayOfWeek } from "@/lib/dates";
import { blocksForDay } from "@/lib/shift-blocks";
import { clockInSchema, clockOutSchema, editShiftSchema, rejectShiftSchema } from "@/validations/coach-shift";
import type { ActionResult } from "./types";

export async function getOpenShiftForCoach(coachId: string) {
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, venue:Venue(*)")
    .eq("coachId", coachId)
    .eq("status", "OPEN")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getShiftHistoryForCoach(coachId: string) {
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, venue:Venue(*)")
    .eq("coachId", coachId)
    .order("clockInAt", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPendingShifts() {
  // CoachShift has two FKs to Coach (coachId, approvedByCoachId) — the
  // embed needs an explicit hint (!coachId) or PostgREST can't tell which
  // relationship "coach:Coach(*)" means and the query fails outright.
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, coach:Coach!coachId(*), venue:Venue(*)")
    .eq("status", "PENDING")
    .order("clockInAt", { ascending: true });
  if (error) throw error;
  return data;
}

// from/to are "YYYY-MM-DD" strings — lexicographic comparison is correct
// for this format, same convention as everywhere else (src/lib/dates.ts).
export async function getPaySummary(from: string, to: string) {
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, coach:Coach!coachId(*), venue:Venue(*)")
    .eq("status", "APPROVED")
    .gte("shiftDate", from)
    .lte("shiftDate", to);
  if (error) throw error;
  return data.sort((a, b) => a.coach.name.localeCompare(b.coach.name) || a.shiftDate.localeCompare(b.shiftDate));
}

export async function clockIn(coachId: string, input: unknown): Promise<ActionResult<{ shiftId: string }>> {
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Pick a venue and session first." };

  const { data: existingOpen } = await supabase
    .from("CoachShift")
    .select("id")
    .eq("coachId", coachId)
    .eq("status", "OPEN")
    .maybeSingle();
  if (existingOpen) return { success: false, error: "You're already clocked in." };

  const today = getSingaporeTodayString();
  if (!blocksForDay(getDayOfWeek(today)).includes(parsed.data.shiftBlock)) {
    return { success: false, error: "That session isn't scheduled today." };
  }

  const { data, error } = await supabase
    .from("CoachShift")
    .insert({
      id: crypto.randomUUID(),
      coachId,
      venueId: parsed.data.venueId,
      shiftBlock: parsed.data.shiftBlock,
      shiftDate: today,
      clockInAt: new Date().toISOString(),
      // updatedAt is Prisma's @updatedAt — a Prisma-Client-side interceptor,
      // not a Postgres DEFAULT/trigger (createdAt above IS a real DB
      // default via @default(now()), which is why only this one needs an
      // explicit value) — same class of gotcha as the explicit id above.
      updatedAt: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) return { success: false, error: "Could not clock in." };
  return { success: true, data: { shiftId: data.id } };
}

export async function clockOut(input: unknown): Promise<ActionResult> {
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ clockOutAt: new Date().toISOString(), status: "PENDING", updatedAt: new Date().toISOString() })
    .eq("id", parsed.data.shiftId)
    .eq("status", "OPEN")
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "This shift isn't open, or isn't yours." };
  return { success: true, data: undefined };
}

export async function editShift(input: unknown): Promise<ActionResult> {
  const parsed = editShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const clockInAt = new Date(parsed.data.clockInAt);
  const clockOutAt = parsed.data.clockOutAt ? new Date(parsed.data.clockOutAt) : null;
  if (clockOutAt && clockOutAt <= clockInAt) {
    return { success: false, error: "Clock out must be after clock in." };
  }

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ clockInAt: clockInAt.toISOString(), clockOutAt: clockOutAt?.toISOString() ?? null, updatedAt: new Date().toISOString() })
    .eq("id", parsed.data.shiftId)
    // Matches the old app-level rule that even an admin must reopen an
    // APPROVED/REJECTED shift before editing — stricter than RLS's own
    // admin bypass, deliberately (see this task's discrepancy note above).
    .in("status", ["OPEN", "PENDING"])
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Not your shift, or it's already been reviewed — reopen it first." };
  return { success: true, data: undefined };
}

export async function reopenShift(input: unknown): Promise<ActionResult> {
  const parsed = clockOutSchema.safeParse(input); // same { shiftId } shape
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ status: "PENDING", approvedAt: null, approvedByCoachId: null, updatedAt: new Date().toISOString() })
    .eq("id", parsed.data.shiftId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Could not reopen shift." };
  return { success: true, data: undefined };
}

export async function approveShift(adminId: string, input: unknown): Promise<ActionResult> {
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ status: "APPROVED", approvedByCoachId: adminId, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .eq("id", parsed.data.shiftId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Only pending shifts can be approved." };
  return { success: true, data: undefined };
}

export async function rejectShift(adminId: string, input: unknown): Promise<ActionResult> {
  const parsed = rejectShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "A reason is required." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({
      status: "REJECTED",
      approvedByCoachId: adminId,
      approvedAt: new Date().toISOString(),
      reviewNote: parsed.data.reviewNote,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", parsed.data.shiftId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Only pending shifts can be rejected." };
  return { success: true, data: undefined };
}

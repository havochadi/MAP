import { supabase } from "@/lib/supabase/client";
import { scanCheckInSchema } from "@/validations/checkin";

export type ScanResult =
  | { outcome: "checked_in"; studentName: string }
  | { outcome: "already_checked_in"; studentName: string }
  | { outcome: "not_found" }
  | { outcome: "error"; error: string };

export async function getCheckInCountForShift(coachShiftId: string): Promise<number> {
  const { count, error } = await supabase
    .from("CheckIn")
    .select("id", { count: "exact", head: true })
    .eq("coachShiftId", coachShiftId);
  if (error) throw error;
  return count ?? 0;
}

export async function scanCheckIn(input: unknown): Promise<ScanResult> {
  const parsed = scanCheckInSchema.safeParse(input);
  if (!parsed.success) return { outcome: "error", error: "Invalid code." };

  // The RPC handles the guardian notification internally too (when the
  // student is a MAP student) — see this task's note on why.
  const { data, error } = await supabase.rpc("scan_check_in", { p_code: parsed.data.code });
  if (error || !data) return { outcome: "error", error: "Could not check in." };

  const result = data as { outcome: string; studentName?: string; error?: string };
  if (result.outcome === "checked_in" || result.outcome === "already_checked_in") {
    return { outcome: result.outcome, studentName: result.studentName! };
  }
  if (result.outcome === "not_found") return { outcome: "not_found" };
  return { outcome: "error", error: result.error ?? "Could not check in." };
}

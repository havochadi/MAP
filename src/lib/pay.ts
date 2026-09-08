// Pure functions — no I/O — computing coach pay from a shift's fixed block.
// Hours and pay are always computed on read, never stored, same philosophy
// as src/lib/attendance-stats.ts computing attendance percentages. Pay is
// flat per block (see src/lib/shift-blocks.ts), not prorated from actual
// clock-in/out timestamps — those are attendance records only.

import { SHIFT_BLOCKS, type ShiftBlockKey } from "@/lib/shift-blocks";

export const HOURLY_RATE = 80;

export type PayShiftLike = { shiftBlock: ShiftBlockKey; clockOutAt: Date | null };

export function computeShiftHours(shift: PayShiftLike): number {
  if (!shift.clockOutAt) return 0;
  return SHIFT_BLOCKS[shift.shiftBlock].hours;
}

export function computeShiftPay(shift: PayShiftLike): number {
  return computeShiftHours(shift) * HOURLY_RATE;
}

export type CoachPayShiftLike = PayShiftLike & { coachId: string; coach: { name: string } };
export type CoachPaySummaryRow = { coachId: string; coachName: string; hours: number; pay: number };

export function summarizePayByCoach(shifts: CoachPayShiftLike[]): CoachPaySummaryRow[] {
  const byCoach = new Map<string, CoachPaySummaryRow>();
  for (const shift of shifts) {
    const hours = computeShiftHours(shift);
    const pay = computeShiftPay(shift);
    const existing = byCoach.get(shift.coachId);
    if (existing) {
      existing.hours += hours;
      existing.pay += pay;
    } else {
      byCoach.set(shift.coachId, { coachId: shift.coachId, coachName: shift.coach.name, hours, pay });
    }
  }
  return [...byCoach.values()].sort((a, b) => a.coachName.localeCompare(b.coachName));
}

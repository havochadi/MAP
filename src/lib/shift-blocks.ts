import type { DayOfWeek } from "@/generated/prisma/client";

// Coaching only runs in these fixed, named sessions — never freeform
// clock-in/out hours. clockInAt/clockOutAt on CoachShift still record real
// arrival/departure (attendance), but paid hours come from here, flat, per
// block — see src/lib/pay.ts.
export const SHIFT_BLOCK_KEYS = ["WEEKDAY_EVENING", "WEEKEND_MORNING", "WEEKEND_AFTERNOON"] as const;
export type ShiftBlockKey = (typeof SHIFT_BLOCK_KEYS)[number];

export const SHIFT_BLOCKS: Record<ShiftBlockKey, { label: string; days: DayOfWeek[]; startTime: string; endTime: string; hours: number }> = {
  WEEKDAY_EVENING: { label: "Evening (5:00–9:00 PM)", days: ["TUE", "THU"], startTime: "17:00", endTime: "21:00", hours: 4 },
  WEEKEND_MORNING: { label: "Morning (10:00 AM–2:00 PM)", days: ["SAT", "SUN"], startTime: "10:00", endTime: "14:00", hours: 4 },
  WEEKEND_AFTERNOON: { label: "Afternoon (2:00–5:00 PM)", days: ["SAT", "SUN"], startTime: "14:00", endTime: "17:00", hours: 3 },
};

export function blocksForDay(day: DayOfWeek): ShiftBlockKey[] {
  return SHIFT_BLOCK_KEYS.filter((key) => SHIFT_BLOCKS[key].days.includes(day));
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach, requireAdmin } from "@/lib/session";
import { getSingaporeTodayString, getDayOfWeek } from "@/lib/dates";
import { blocksForDay } from "@/lib/shift-blocks";
import { clockInSchema, clockOutSchema, editShiftSchema, rejectShiftSchema } from "@/validations/coach-shift";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function clockIn(input: unknown): Promise<ActionResult<{ shiftId: string }>> {
  const coach = await requireCoach();
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Pick a venue and session first." };

  const existingOpen = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (existingOpen) return { success: false, error: "You're already clocked in." };

  const today = getSingaporeTodayString();
  // Re-validated server-side, not just trusted from the picker — the picker
  // only ever offers today's valid blocks, but the request could be replayed.
  if (!blocksForDay(getDayOfWeek(today)).includes(parsed.data.shiftBlock)) {
    return { success: false, error: "That session isn't scheduled today." };
  }

  const shift = await prisma.coachShift.create({
    data: {
      coachId: coach.id,
      venueId: parsed.data.venueId,
      shiftBlock: parsed.data.shiftBlock,
      shiftDate: today,
      clockInAt: new Date(),
    },
  });

  revalidatePath("/");
  return { success: true, data: { shiftId: shift.id } };
}

export async function clockOut(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift || shift.coachId !== coach.id) return { success: false, error: "Shift not found." };
  if (shift.status !== "OPEN") return { success: false, error: "This shift is already clocked out." };

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: { clockOutAt: new Date(), status: "PENDING" },
  });

  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function editShift(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = editShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (!coach.isAdmin && shift.coachId !== coach.id) return { success: false, error: "Not your shift." };
  if (shift.status === "APPROVED" || shift.status === "REJECTED") {
    return { success: false, error: "Reopen this shift before editing it." };
  }

  const clockInAt = new Date(parsed.data.clockInAt);
  const clockOutAt = parsed.data.clockOutAt ? new Date(parsed.data.clockOutAt) : null;
  if (clockOutAt && clockOutAt <= clockInAt) {
    return { success: false, error: "Clock out must be after clock in." };
  }

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: { clockInAt, clockOutAt },
  });

  revalidatePath(`/coaches/${shift.coachId}`);
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function reopenShift(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clockOutSchema.safeParse(input); // same { shiftId } shape
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const shift = await prisma.coachShift.update({
    where: { id: parsed.data.shiftId },
    data: { status: "PENDING", approvedAt: null, approvedByCoachId: null },
  });

  revalidatePath(`/coaches/${shift.coachId}`);
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function approveShift(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.status !== "PENDING") return { success: false, error: "Only pending shifts can be approved." };

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: { status: "APPROVED", approvedByCoachId: admin.id, approvedAt: new Date() },
  });

  revalidatePath("/payroll");
  revalidatePath(`/coaches/${shift.coachId}`);
  return { success: true, data: undefined };
}

export async function rejectShift(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = rejectShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "A reason is required." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.status !== "PENDING") return { success: false, error: "Only pending shifts can be rejected." };

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: { status: "REJECTED", approvedByCoachId: admin.id, approvedAt: new Date(), reviewNote: parsed.data.reviewNote },
  });

  revalidatePath("/payroll");
  revalidatePath(`/coaches/${shift.coachId}`);
  return { success: true, data: undefined };
}

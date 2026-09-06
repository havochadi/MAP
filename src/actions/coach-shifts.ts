"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
import { clockInSchema, clockOutSchema } from "@/validations/coach-shift";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function clockIn(input: unknown): Promise<ActionResult<{ shiftId: string }>> {
  const coach = await requireCoach();
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Pick a venue first." };

  const existingOpen = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (existingOpen) return { success: false, error: "You're already clocked in." };

  const shift = await prisma.coachShift.create({
    data: {
      coachId: coach.id,
      venueId: parsed.data.venueId,
      shiftDate: getSingaporeTodayString(),
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

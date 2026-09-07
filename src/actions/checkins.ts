"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
import { scanCheckInSchema } from "@/validations/checkin";
import { sendGuardianCheckInNotification } from "@/lib/notifications";

export type ScanResult =
  | { outcome: "checked_in"; studentName: string }
  | { outcome: "already_checked_in"; studentName: string }
  | { outcome: "not_found" }
  | { outcome: "error"; error: string };

export async function scanCheckIn(input: unknown): Promise<ScanResult> {
  const coach = await requireCoach();
  const parsed = scanCheckInSchema.safeParse(input);
  if (!parsed.success) return { outcome: "error", error: "Invalid code." };

  const shift = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (!shift) return { outcome: "error", error: "Clock in before scanning." };

  const student = await prisma.student.findUnique({ where: { loginCode: parsed.data.code.toUpperCase() } });
  if (!student) return { outcome: "not_found" };

  const checkInDate = getSingaporeTodayString();
  const existing = await prisma.checkIn.findUnique({
    where: { studentId_venueId_checkInDate: { studentId: student.id, venueId: shift.venueId, checkInDate } },
  });
  if (existing) {
    return { outcome: "already_checked_in", studentName: student.name };
  }

  const checkIn = await prisma.checkIn.create({
    data: { studentId: student.id, venueId: shift.venueId, checkInDate, coachShiftId: shift.id },
  });

  if (student.isMapStudent) {
    await sendGuardianCheckInNotification({ checkInId: checkIn.id });
  }

  revalidatePath("/");
  return { outcome: "checked_in", studentName: student.name };
}

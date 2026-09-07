"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateUniqueLoginCode } from "@/lib/login-code";
import { registerStudentSchema } from "@/validations/registration";
import { requireCoach } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
import { sendGuardianCheckInNotification } from "@/lib/notifications";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

// Deliberately NO requireCoach()/requireAdmin() call — this is the one
// action in the app meant to be reachable by a signed-out visitor (the
// public /register page, reached via the onboarding QR). See this plan's
// Global Constraints for why that's intentional, not an oversight.
export async function registerStudent(input: unknown): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const loginCode = await generateUniqueLoginCode();
  const student = await prisma.student.create({
    data: { ...parsed.data, loginCode },
  });

  revalidatePath("/students");
  return { success: true, data: { studentId: student.id, loginCode } };
}

// The coach-assisted registration variant: same validation and Student
// creation as registerStudent, but requires an open shift (a venue is
// needed for the visitor's first check-in) and, unlike the public flow,
// requires being signed in as a coach.
export async function registerAndCheckInStudent(
  input: unknown,
): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const coach = await requireCoach();
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const shift = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (!shift) return { success: false, error: "Clock in before registering a visitor." };

  const loginCode = await generateUniqueLoginCode();
  const student = await prisma.student.create({
    data: { ...parsed.data, loginCode },
  });

  const checkIn = await prisma.checkIn.create({
    data: {
      studentId: student.id,
      venueId: shift.venueId,
      checkInDate: getSingaporeTodayString(),
      coachShiftId: shift.id,
    },
  });

  if (student.isMapStudent) {
    await sendGuardianCheckInNotification({ checkInId: checkIn.id });
  }

  revalidatePath("/students");
  revalidatePath("/");
  return { success: true, data: { studentId: student.id, loginCode } };
}

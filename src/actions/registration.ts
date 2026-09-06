"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateUniqueLoginCode } from "@/lib/login-code";
import { registerStudentSchema } from "@/validations/registration";

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

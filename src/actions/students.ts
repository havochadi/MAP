"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateUniqueLoginCode } from "@/lib/login-code";
import {
  enrollStudentSchema,
  dropEnrollmentSchema,
  updateStudentStatusSchema,
} from "@/validations/student";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

const MAX_ACTIVE_ENROLLMENTS = 3;

export async function regenerateLoginCode(studentId: string): Promise<ActionResult<{ loginCode: string }>> {
  await requireAdmin();
  const loginCode = await generateUniqueLoginCode();
  await prisma.student.update({ where: { id: studentId }, data: { loginCode } });
  revalidatePath(`/students/${studentId}`);
  return { success: true, data: { loginCode } };
}

export async function enrollStudentInClass(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = enrollStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { studentId, classId } = parsed.data;

  const activeCount = await prisma.enrollment.count({ where: { studentId, status: "ACTIVE" } });
  if (activeCount >= MAX_ACTIVE_ENROLLMENTS) {
    return { success: false, error: `Students can be enrolled in at most ${MAX_ACTIVE_ENROLLMENTS} classes.` };
  }

  const existing = await prisma.enrollment.findUnique({ where: { studentId_classId: { studentId, classId } } });
  if (existing) {
    if (existing.status === "ACTIVE") return { success: false, error: "Already enrolled in this class." };
    await prisma.enrollment.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
  } else {
    await prisma.enrollment.create({ data: { studentId, classId } });
  }

  revalidatePath(`/students/${studentId}`);
  return { success: true, data: undefined };
}

export async function dropEnrollment(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = dropEnrollmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const enrollment = await prisma.enrollment.update({
    where: { id: parsed.data.enrollmentId },
    data: { status: "DROPPED" },
  });

  revalidatePath(`/students/${enrollment.studentId}`);
  return { success: true, data: undefined };
}

export async function updateStudentStatus(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateStudentStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { studentId, status } = parsed.data;

  await prisma.student.update({ where: { id: studentId }, data: { status } });

  revalidatePath(`/students/${studentId}`);
  return { success: true, data: undefined };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/session";
import { canAccessClass } from "@/lib/authorization";
import { markTopicPlannedSchema, markTopicCompletedSchema, updateProgressNotesSchema } from "@/validations/progress";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function markTopicPlanned(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = markTopicPlannedSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, curriculumTopicId, plannedDate } = parsed.data;

  if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) {
    return { success: false, error: "You don't have access to this class." };
  }

  await prisma.classProgress.upsert({
    where: { classId_curriculumTopicId: { classId, curriculumTopicId } },
    update: { status: "PLANNED", plannedDate, completedDate: null },
    create: { classId, curriculumTopicId, status: "PLANNED", plannedDate },
  });

  revalidatePath(`/classes/${classId}/progress`);
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function markTopicCompleted(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = markTopicCompletedSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, curriculumTopicId, completedDate, notes } = parsed.data;

  if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) {
    return { success: false, error: "You don't have access to this class." };
  }

  const existing = await prisma.classProgress.findUnique({
    where: { classId_curriculumTopicId: { classId, curriculumTopicId } },
  });

  await prisma.classProgress.upsert({
    where: { classId_curriculumTopicId: { classId, curriculumTopicId } },
    update: { status: "COMPLETED", completedDate, notes },
    create: {
      classId,
      curriculumTopicId,
      status: "COMPLETED",
      // No prior plan for this topic — default the plannedDate to the same
      // day it was actually taught, rather than leaving it undated.
      plannedDate: existing?.plannedDate ?? completedDate,
      completedDate,
      notes,
    },
  });

  revalidatePath(`/classes/${classId}/progress`);
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function updateProgressNotes(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = updateProgressNotesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classProgressId, notes } = parsed.data;

  const progress = await prisma.classProgress.findUnique({ where: { id: classProgressId } });
  if (!progress) return { success: false, error: "Progress entry not found." };

  if (!(await canAccessClass(coach.id, progress.classId, coach.isAdmin))) {
    return { success: false, error: "You don't have access to this class." };
  }

  await prisma.classProgress.update({ where: { id: classProgressId }, data: { notes } });
  revalidatePath(`/classes/${progress.classId}/progress`);
  return { success: true, data: undefined };
}

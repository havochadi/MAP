import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const markTopicPlannedSchema = z.object({
  classId: z.string().min(1),
  curriculumTopicId: z.string().min(1),
  plannedDate: dateString,
});

export const markTopicCompletedSchema = z.object({
  classId: z.string().min(1),
  curriculumTopicId: z.string().min(1),
  completedDate: dateString,
  notes: z.string().max(500).optional(),
});

export const updateProgressNotesSchema = z.object({
  classProgressId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

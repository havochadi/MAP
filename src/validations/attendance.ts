import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const markAttendanceSchema = z.object({
  classId: z.string().min(1),
  sessionDate: dateString,
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
  excused: z.boolean().optional(),
  remarks: z.string().max(500).optional(),
});

export const submitSessionSchema = z.object({
  classId: z.string().min(1),
  sessionDate: dateString,
});

export const reopenSessionSchema = z.object({
  sessionId: z.string().min(1),
});

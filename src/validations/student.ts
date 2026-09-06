import { z } from "zod";

export const LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6", "SEC1", "SEC2", "SEC3", "SEC4", "SEC5", "JC1", "JC2"] as const;

export const enrollStudentSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
});

export const dropEnrollmentSchema = z.object({
  enrollmentId: z.string().min(1),
});

export const updateStudentStatusSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["ACTIVE", "REMOVED", "GRADUATED"]),
});

export const studentLoginSchema = z.object({
  code: z.string().min(4).max(12),
});

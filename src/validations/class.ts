import { z } from "zod";
import { LEVELS } from "@/validations/student";

export const SUBJECTS = ["ENGLISH", "MATH", "SCIENCE"] as const;
export const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export const createClassSchema = z.object({
  venueId: z.string().min(1),
  subject: z.enum(SUBJECTS),
  level: z.enum(LEVELS),
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24h HH:mm"),
  durationMinutes: z.coerce.number().int().min(15).max(240).default(90),
});

export const classAssignmentSchema = z.object({
  coachId: z.string().min(1),
  classId: z.string().min(1),
});

export const createVenueSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(200).optional(),
});

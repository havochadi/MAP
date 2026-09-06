import { z } from "zod";

export const clockInSchema = z.object({
  venueId: z.string().min(1),
});

export const clockOutSchema = z.object({
  shiftId: z.string().min(1),
});

export const editShiftSchema = z.object({
  shiftId: z.string().min(1),
  clockInAt: z.string().min(1),
  clockOutAt: z.string().min(1).nullable(),
});

export const rejectShiftSchema = z.object({
  shiftId: z.string().min(1),
  reviewNote: z.string().min(1).max(500),
});

import { z } from "zod";
import { SHIFT_BLOCK_KEYS } from "@/lib/shift-blocks";

export const clockInSchema = z.object({
  venueId: z.string().min(1),
  shiftBlock: z.enum(SHIFT_BLOCK_KEYS),
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

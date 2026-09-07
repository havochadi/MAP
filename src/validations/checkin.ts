import { z } from "zod";

export const scanCheckInSchema = z.object({
  code: z.string().min(4).max(12),
});

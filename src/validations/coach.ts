import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const createCoachSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8),
  phone: z.string().max(30).optional(),
  isAdmin: z.boolean().default(false),
});

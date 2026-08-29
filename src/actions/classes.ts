"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createClassSchema } from "@/validations/class";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function createClass(input: unknown): Promise<ActionResult<{ classId: string }>> {
  await requireAdmin();
  const parsed = createClassSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const cls = await prisma.class.create({ data: parsed.data });
  revalidatePath("/venues");
  revalidatePath(`/venues/${parsed.data.venueId}`);
  return { success: true, data: { classId: cls.id } };
}

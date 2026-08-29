"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createVenueSchema } from "@/validations/class";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function createVenue(input: unknown): Promise<ActionResult<{ venueId: string }>> {
  await requireAdmin();
  const parsed = createVenueSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const venue = await prisma.venue.create({ data: parsed.data });
  revalidatePath("/venues");
  return { success: true, data: { venueId: venue.id } };
}

import { supabase } from "@/lib/supabase/client";
import { createVenueSchema } from "@/validations/class";
import type { ActionResult } from "./types";

export async function getAllVenues() {
  const { data, error } = await supabase.from("Venue").select("id, name").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createVenue(input: unknown): Promise<ActionResult<{ venueId: string }>> {
  const parsed = createVenueSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  // id: Venue's Prisma @default(cuid()) is Prisma-Client-side only — a
  // direct PostgREST insert must supply its own id (Plan 1, Tasks 7/8/9).
  const { data, error } = await supabase
    .from("Venue")
    .insert({ id: crypto.randomUUID(), ...parsed.data })
    .select("id")
    .single();
  // RLS (Plan 1, Task 9) rejects a non-admin's insert outright — no
  // separate requireAdmin() check needed; the database enforces it.
  if (error || !data) return { success: false, error: "Could not create venue." };
  return { success: true, data: { venueId: data.id } };
}

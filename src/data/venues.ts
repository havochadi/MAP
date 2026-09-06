import { prisma } from "@/lib/prisma";

export async function getAllVenues() {
  return prisma.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

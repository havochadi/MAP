import { prisma } from "@/lib/prisma";

export async function getCheckInCountForShift(coachShiftId: string): Promise<number> {
  return prisma.checkIn.count({ where: { coachShiftId } });
}

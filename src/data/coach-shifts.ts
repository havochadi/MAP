import { prisma } from "@/lib/prisma";

export async function getOpenShiftForCoach(coachId: string) {
  return prisma.coachShift.findFirst({
    where: { coachId, status: "OPEN" },
    include: { venue: true },
  });
}

export async function getShiftHistoryForCoach(coachId: string) {
  return prisma.coachShift.findMany({
    where: { coachId },
    include: { venue: true },
    orderBy: { clockInAt: "desc" },
  });
}

export async function getPendingShifts() {
  return prisma.coachShift.findMany({
    where: { status: "PENDING" },
    include: { coach: true, venue: true },
    orderBy: { clockInAt: "asc" },
  });
}

// from/to are "YYYY-MM-DD" strings, compared lexicographically against the
// stored shiftDate — safe because that format sorts correctly as plain text,
// same convention this schema already relies on everywhere else (see
// src/lib/dates.ts).
export async function getPaySummary(from: string, to: string) {
  return prisma.coachShift.findMany({
    where: { status: "APPROVED", shiftDate: { gte: from, lte: to } },
    include: { coach: true, venue: true },
    orderBy: [{ coach: { name: "asc" } }, { shiftDate: "asc" }],
  });
}

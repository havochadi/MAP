import { prisma } from "@/lib/prisma";
import type { Subject, Level } from "@/generated/prisma/client";

export async function getSubjectLevelCombos() {
  return prisma.curriculumTopic.findMany({
    select: { subject: true, level: true },
    distinct: ["subject", "level"],
    orderBy: [{ subject: "asc" }, { level: "asc" }],
  });
}

export async function getTopics(subject: Subject, level: Level) {
  return prisma.curriculumTopic.findMany({
    where: { subject, level },
    orderBy: { order: "asc" },
  });
}

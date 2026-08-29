import { prisma } from "@/lib/prisma";

export async function getClassProgress(classId: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId }, include: { venue: true } });
  if (!cls) return null;

  const [progress, allTopics] = await Promise.all([
    prisma.classProgress.findMany({ where: { classId } }),
    prisma.curriculumTopic.findMany({
      where: { subject: cls.subject, level: cls.level },
      orderBy: { order: "asc" },
    }),
  ]);

  const progressByTopicId = new Map(progress.map((p) => [p.curriculumTopicId, p]));

  const items = allTopics.map((topic) => ({
    topic,
    progress: progressByTopicId.get(topic.id) ?? null,
  }));

  return { class: cls, items };
}

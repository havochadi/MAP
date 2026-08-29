import { prisma } from "@/lib/prisma";

export async function getRosterWithSession(classId: string, sessionDate: string) {
  const [cls, enrollments, session] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, include: { venue: true } }),
    prisma.enrollment.findMany({
      where: { classId, status: "ACTIVE" },
      include: { student: true },
      orderBy: { student: { name: "asc" } },
    }),
    prisma.attendanceSession.findUnique({
      where: { classId_sessionDate: { classId, sessionDate } },
      include: { records: true, markedByCoach: true },
    }),
  ]);

  if (!cls) return null;

  const recordByStudent = new Map((session?.records ?? []).map((r) => [r.studentId, r]));

  const roster = enrollments.map((e) => ({
    student: e.student,
    record: recordByStudent.get(e.studentId) ?? null,
  }));

  return { class: cls, session, roster };
}

export async function getRecentSessionsForClass(classId: string, limit = 8) {
  return prisma.attendanceSession.findMany({
    where: { classId },
    orderBy: { sessionDate: "desc" },
    take: limit,
    include: { markedByCoach: true, _count: { select: { records: true } } },
  });
}

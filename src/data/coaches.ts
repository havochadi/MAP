import { prisma } from "@/lib/prisma";

export async function getCoachProfile(coachId: string) {
  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: {
      assignments: {
        include: {
          class: {
            include: { venue: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
          },
        },
        orderBy: { class: { venue: { name: "asc" } } },
      },
    },
  });
  if (!coach) return null;

  const classIds = coach.assignments.map((a) => a.classId);

  const [sessionsCount, distinctStudents] = await Promise.all([
    classIds.length === 0
      ? 0
      : prisma.attendanceSession.count({ where: { classId: { in: classIds }, markedByCoachId: coachId } }),
    classIds.length === 0
      ? []
      : prisma.enrollment.findMany({
          where: { classId: { in: classIds }, status: "ACTIVE" },
          distinct: ["studentId"],
          select: { studentId: true },
        }),
  ]);

  return { coach, sessionsCount, studentCount: distinctStudents.length };
}

export async function getAllCoachesForSelect() {
  return prisma.coach.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } });
}

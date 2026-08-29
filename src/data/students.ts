import { prisma } from "@/lib/prisma";

export async function getStudentProfile(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      venue: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { include: { venue: true } } },
      },
    },
  });
  if (!student) return null;

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
    include: { session: true },
    orderBy: { session: { sessionDate: "desc" } },
  });

  const classIds = student.enrollments.map((e) => e.classId);
  const progress =
    classIds.length === 0
      ? []
      : await prisma.classProgress.findMany({
          where: { classId: { in: classIds } },
          select: { classId: true, status: true },
        });

  return { student, records, progress };
}

export async function getStudentsForCoach(coachId: string, isAdmin: boolean) {
  if (isAdmin) {
    return prisma.student.findMany({ include: { venue: true }, orderBy: { name: "asc" } });
  }

  return prisma.student.findMany({
    where: {
      enrollments: {
        some: { status: "ACTIVE", class: { assignments: { some: { coachId } } } },
      },
    },
    include: { venue: true },
    orderBy: { name: "asc" },
  });
}

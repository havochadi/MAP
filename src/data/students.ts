import { prisma } from "@/lib/prisma";

export async function getStudentProfile(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  const checkIns = await prisma.checkIn.findMany({
    where: { studentId },
    include: { venue: true },
    orderBy: { checkInDate: "desc" },
  });

  return { student, checkIns };
}

export async function getStudentsForCoach(coachId: string, isAdmin: boolean) {
  if (isAdmin) {
    return prisma.student.findMany({ orderBy: { name: "asc" } });
  }

  return prisma.student.findMany({
    where: { enrollments: { some: { status: "ACTIVE", class: { assignments: { some: { coachId } } } } } },
    orderBy: { name: "asc" },
  });
}

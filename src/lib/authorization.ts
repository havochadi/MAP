import { prisma } from "@/lib/prisma";

// Two-tier authorization: an admin coach can access anything; a regular
// coach can only access classes they're assigned to and students who share
// an active enrollment with one of those classes. See the plan's
// authorization matrix for the full rule set.

export async function canAccessClass(coachId: string, classId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  const assignment = await prisma.classAssignment.findUnique({
    where: { coachId_classId: { coachId, classId } },
  });
  return !!assignment;
}

export async function canAccessStudent(coachId: string, studentId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  const shared = await prisma.enrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      class: { assignments: { some: { coachId } } },
    },
  });
  return !!shared;
}

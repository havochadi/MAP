import { prisma } from "@/lib/prisma";

// An admin coach can access any class; a regular coach only classes
// they're assigned to. (There used to be a matching canAccessStudent here,
// gating student profiles by shared class enrollment — removed because any
// signed-in coach may now view a specific student's profile once they've
// resolved who it is via a scan or a fresh registration. /students, the
// browsable list, is what actually stays admin-only; see its page.)

export async function canAccessClass(coachId: string, classId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  const assignment = await prisma.classAssignment.findUnique({
    where: { coachId_classId: { coachId, classId } },
  });
  return !!assignment;
}

import { prisma } from "@/lib/prisma";
import { getSingaporeTodayString } from "@/lib/dates";

export async function getClassesForCoach(coachId: string, isAdmin: boolean) {
  const classes = await prisma.class.findMany({
    where: isAdmin ? {} : { assignments: { some: { coachId } } },
    include: {
      venue: true,
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ venue: { name: "asc" } }, { level: "asc" }],
  });

  if (classes.length === 0) return [];

  const today = getSingaporeTodayString();
  const classIds = classes.map((c) => c.id);

  const [todaySessions, dueTodayProgress] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: { classId: { in: classIds }, sessionDate: today },
    }),
    prisma.classProgress.findMany({
      where: { classId: { in: classIds }, plannedDate: today, status: "PLANNED" },
      include: { topic: true },
    }),
  ]);

  const sessionByClass = new Map(todaySessions.map((s) => [s.classId, s]));
  const topicByClass = new Map(dueTodayProgress.map((p) => [p.classId, p.topic]));

  return classes.map((cls) => ({
    ...cls,
    studentCount: cls._count.enrollments,
    todaySession: sessionByClass.get(cls.id) ?? null,
    todayTopic: topicByClass.get(cls.id) ?? null,
  }));
}

export async function getClassById(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
    include: { venue: true },
  });
}

export async function getClassDetail(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      venue: true,
      assignments: { include: { coach: true }, orderBy: { coach: { name: "asc" } } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: true },
        orderBy: { student: { name: "asc" } },
      },
    },
  });
}

export async function getAllClassesForSelect() {
  return prisma.class.findMany({
    include: { venue: true },
    orderBy: [{ venue: { name: "asc" } }, { level: "asc" }],
  });
}

export async function getAllVenuesWithClassCounts() {
  return prisma.venue.findMany({
    include: { _count: { select: { classes: true, students: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getVenueWithClasses(venueId: string) {
  return prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      classes: {
        include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
        orderBy: [{ level: "asc" }, { subject: "asc" }],
      },
    },
  });
}

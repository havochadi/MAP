import { prisma } from "@/lib/prisma";
import { formatClassLabel } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";

export type AttendanceArrivalStatus = "PRESENT" | "LATE";

export function buildGuardianMessage(input: {
  studentName: string;
  classLabel: string;
  status: AttendanceArrivalStatus;
  sessionDate: string;
}): string {
  const statusLabel = input.status === "PRESENT" ? "present" : "late";
  return `${input.studentName} has arrived and was marked ${statusLabel} for ${input.classLabel} on ${formatDateForDisplay(input.sessionDate)}.`;
}

// Simulated guardian contact — no real SMS/email provider is wired up (this
// project has none; see the README's known limitations). The console log
// stands in for an actual send, and GuardianNotification is itself the
// "delivery record," auditable rather than actually dispatched anywhere.
// Called both from the attendance action (automatic, on session submit) and
// from POST /api/notify-guardian (the same logic, independently callable).
export async function sendGuardianAttendanceNotification(input: {
  studentId: string;
  classId: string;
  sessionDate: string;
  status: AttendanceArrivalStatus;
}): Promise<{ delivered: boolean }> {
  const [student, cls] = await Promise.all([
    prisma.student.findUnique({ where: { id: input.studentId } }),
    prisma.class.findUnique({ where: { id: input.classId } }),
  ]);
  if (!student) throw new Error("Student not found.");
  if (!cls) throw new Error("Class not found.");

  const delivered = student.guardianPhone != null;
  const message = buildGuardianMessage({
    studentName: student.name,
    classLabel: formatClassLabel(cls),
    status: input.status,
    sessionDate: input.sessionDate,
  });

  if (delivered) {
    console.log(`[guardian-notify] SMS to ${student.guardianPhone}: ${message}`);
  }

  await prisma.guardianNotification.upsert({
    where: {
      studentId_classId_sessionDate: { studentId: input.studentId, classId: input.classId, sessionDate: input.sessionDate },
    },
    update: { status: input.status, recipientPhone: student.guardianPhone, delivered, message, sentAt: new Date() },
    create: {
      studentId: input.studentId,
      classId: input.classId,
      sessionDate: input.sessionDate,
      status: input.status,
      recipientPhone: student.guardianPhone,
      delivered,
      message,
    },
  });

  return { delivered };
}

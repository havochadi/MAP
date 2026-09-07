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

  // Reads emergencyContactPhone, not the old guardianPhone name — Task 1's
  // Student model rename left this legacy function referencing a field that
  // no longer exists. Pure rename, no behavior change: same person, same
  // data, just the column Task 1 renamed it to. (It's now a required field,
  // so `delivered` is always true post-rename — left as a computed check
  // rather than hardcoding `true`, to keep this function's diff minimal.)
  const delivered = student.emergencyContactPhone != null;
  const message = buildGuardianMessage({
    studentName: student.name,
    classLabel: formatClassLabel(cls),
    status: input.status,
    sessionDate: input.sessionDate,
  });

  if (delivered) {
    console.log(`[guardian-notify] SMS to ${student.emergencyContactPhone}: ${message}`);
  }

  await prisma.guardianNotification.upsert({
    where: {
      studentId_classId_sessionDate: { studentId: input.studentId, classId: input.classId, sessionDate: input.sessionDate },
    },
    update: { status: input.status, recipientPhone: student.emergencyContactPhone, delivered, message, sentAt: new Date() },
    create: {
      studentId: input.studentId,
      classId: input.classId,
      sessionDate: input.sessionDate,
      status: input.status,
      recipientPhone: student.emergencyContactPhone,
      delivered,
      message,
    },
  });

  return { delivered };
}

export function buildGuardianCheckInMessage(input: { studentName: string; venueName: string; checkInDate: string }): string {
  return `${input.studentName} has checked in at ${input.venueName} on ${formatDateForDisplay(input.checkInDate)}.`;
}

// The check-in flow's equivalent of sendGuardianAttendanceNotification,
// above — same simulated-send reasoning, writing to CheckInNotification
// instead of GuardianNotification since this is triggered by a CheckIn, not
// a class attendance session. Only ever called for isMapStudent students
// (see the call site in src/actions/checkins.ts), and Student.emergencyContactPhone
// is a required field, so "delivered" is always true here — unlike the
// class-attendance version, there's no optional-phone branch to handle.
export async function sendGuardianCheckInNotification(input: { checkInId: string }): Promise<{ delivered: boolean }> {
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: input.checkInId },
    include: { student: true, venue: true },
  });
  if (!checkIn) throw new Error("Check-in not found.");

  const message = buildGuardianCheckInMessage({
    studentName: checkIn.student.name,
    venueName: checkIn.venue.name,
    checkInDate: checkIn.checkInDate,
  });

  console.log(`[guardian-notify] SMS to ${checkIn.student.emergencyContactPhone}: ${message}`);

  await prisma.checkInNotification.create({
    data: {
      studentId: checkIn.studentId,
      checkInId: checkIn.id,
      recipientPhone: checkIn.student.emergencyContactPhone,
      delivered: true,
      message,
    },
  });

  return { delivered: true };
}

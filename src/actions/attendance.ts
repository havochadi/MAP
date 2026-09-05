"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/session";
import { canAccessClass } from "@/lib/authorization";
import { sendGuardianAttendanceNotification } from "@/lib/notifications";
import { markAttendanceSchema, submitSessionSchema, reopenSessionSchema } from "@/validations/attendance";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function markAttendanceRecord(
  input: unknown,
): Promise<ActionResult<{ status: string; sessionId: string }>> {
  const coach = await requireCoach();
  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, sessionDate, studentId, status, excused, remarks } = parsed.data;

  if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) {
    return { success: false, error: "You don't have access to this class." };
  }

  // Upserting on (classId, sessionDate) and then (attendanceSessionId, studentId)
  // is what makes double-tapping or double-submitting safe — every write
  // converges on the same rows instead of duplicating or erroring.
  const session = await prisma.attendanceSession.upsert({
    where: { classId_sessionDate: { classId, sessionDate } },
    update: { markedByCoachId: coach.id },
    create: { classId, sessionDate, markedByCoachId: coach.id },
  });

  if (session.submittedAt) {
    return { success: false, error: "This session is locked — reopen it to make changes." };
  }

  await prisma.attendanceRecord.upsert({
    where: { attendanceSessionId_studentId: { attendanceSessionId: session.id, studentId } },
    update: { status, excused: excused ?? false, remarks },
    create: { attendanceSessionId: session.id, studentId, status, excused: excused ?? false, remarks },
  });

  revalidatePath(`/classes/${classId}/attendance`);
  revalidatePath("/");
  return { success: true, data: { status, sessionId: session.id } };
}

export async function submitAttendanceSession(
  input: unknown,
): Promise<ActionResult<{ notified: number; skipped: number }>> {
  const coach = await requireCoach();
  const parsed = submitSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, sessionDate } = parsed.data;

  if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) {
    return { success: false, error: "You don't have access to this class." };
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { classId_sessionDate: { classId, sessionDate } },
    include: { records: true },
  });
  if (!session) return { success: false, error: "No attendance has been taken for this session yet." };

  const activeCount = await prisma.enrollment.count({ where: { classId, status: "ACTIVE" } });
  if (session.records.length < activeCount) {
    return { success: false, error: "Mark every student before saving." };
  }

  await prisma.attendanceSession.update({
    where: { id: session.id },
    data: { submittedAt: new Date() },
  });

  // Guardians of anyone who actually showed up (Present/Late) get notified —
  // Absent never fires one. Best-effort: a notification failure doesn't undo
  // the already-saved attendance, it just doesn't count toward `notified`.
  const arrivals = session.records.filter(
    (r): r is typeof r & { status: "PRESENT" | "LATE" } => r.status === "PRESENT" || r.status === "LATE",
  );
  let notified = 0;
  let skipped = 0;
  for (const record of arrivals) {
    try {
      const result = await sendGuardianAttendanceNotification({
        studentId: record.studentId,
        classId,
        sessionDate,
        status: record.status,
      });
      if (result.delivered) notified++;
      else skipped++;
    } catch {
      skipped++;
    }
  }

  revalidatePath(`/classes/${classId}/attendance`);
  revalidatePath("/");
  return { success: true, data: { notified, skipped } };
}

export async function reopenAttendanceSession(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = reopenSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { sessionId } = parsed.data;

  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session) return { success: false, error: "Session not found." };

  if (!(await canAccessClass(coach.id, session.classId, coach.isAdmin))) {
    return { success: false, error: "You don't have access to this class." };
  }

  await prisma.attendanceSession.update({ where: { id: sessionId }, data: { submittedAt: null } });
  revalidatePath(`/classes/${session.classId}/attendance`);
  return { success: true, data: undefined };
}

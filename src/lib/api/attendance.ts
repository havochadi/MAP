// src/lib/api/attendance.ts
import { supabase } from "@/lib/supabase/client";
import { formatClassLabel } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";
import { markAttendanceSchema, submitSessionSchema, reopenSessionSchema } from "@/validations/attendance";
import type { ActionResult } from "./types";

export async function getRosterWithSession(classId: string, sessionDate: string) {
  const [{ data: cls, error: clsError }, { data: enrollments, error: enrollmentsError }, { data: session, error: sessionError }] =
    await Promise.all([
      supabase.from("Class").select("*, venue:Venue(*)").eq("id", classId).maybeSingle(),
      supabase.from("Enrollment").select("*, student:Student(*)").eq("classId", classId).eq("status", "ACTIVE"),
      supabase
        .from("AttendanceSession")
        .select("*, records:AttendanceRecord(*)")
        .eq("classId", classId)
        .eq("sessionDate", sessionDate)
        .maybeSingle(),
    ]);
  if (clsError) throw clsError;
  if (enrollmentsError) throw enrollmentsError;
  if (sessionError) throw sessionError;
  if (!cls) return null;

  // coach_public is a view — PostgREST's generated types mark every view
  // column nullable regardless of the underlying data's real nullability
  // (same reasoning as Task 5/6's coach_public usage), so this annotation
  // must allow null fields even though a matched row never actually has one.
  let sessionWithCoach: (typeof session & { markedByCoach: { id: string | null; name: string | null; isAdmin: boolean | null } | null }) | null = null;
  if (session) {
    const { data: coach } = session.markedByCoachId
      ? await supabase.from("coach_public").select("id, name, isAdmin").eq("id", session.markedByCoachId).maybeSingle()
      : { data: null };
    sessionWithCoach = { ...session, markedByCoach: coach };
  }

  const recordByStudent = new Map((session?.records ?? []).map((r) => [r.studentId, r]));
  const roster = enrollments
    .sort((a, b) => a.student.name.localeCompare(b.student.name))
    .map((e) => ({ student: e.student, record: recordByStudent.get(e.studentId) ?? null }));

  return { class: cls, session: sessionWithCoach, roster };
}

export async function getRecentSessionsForClass(classId: string, limit = 8) {
  const { data: sessions, error } = await supabase
    .from("AttendanceSession")
    .select("*, records:AttendanceRecord(id)")
    .eq("classId", classId)
    .order("sessionDate", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (sessions.length === 0) return [];

  const coachIds = [...new Set(sessions.map((s) => s.markedByCoachId).filter((id): id is string => !!id))];
  const { data: coaches } =
    coachIds.length === 0 ? { data: [] as { id: string; name: string; isAdmin: boolean }[] } : await supabase.from("coach_public").select("id, name, isAdmin").in("id", coachIds);
  const coachById = new Map((coaches ?? []).map((c) => [c.id, c]));

  return sessions.map((s) => ({
    ...s,
    markedByCoach: s.markedByCoachId ? (coachById.get(s.markedByCoachId) ?? null) : null,
    _count: { records: s.records.length },
  }));
}

export function buildGuardianMessage(input: {
  studentName: string;
  classLabel: string;
  status: "PRESENT" | "LATE";
  sessionDate: string;
}): string {
  const statusLabel = input.status === "PRESENT" ? "present" : "late";
  return `${input.studentName} has arrived and was marked ${statusLabel} for ${input.classLabel} on ${formatDateForDisplay(input.sessionDate)}.`;
}

export async function sendGuardianAttendanceNotification(input: {
  studentId: string;
  classId: string;
  sessionDate: string;
  status: "PRESENT" | "LATE";
}): Promise<{ delivered: boolean }> {
  const [{ data: student, error: studentError }, { data: cls, error: classError }] = await Promise.all([
    supabase.from("Student").select("*").eq("id", input.studentId).maybeSingle(),
    supabase.from("Class").select("*").eq("id", input.classId).maybeSingle(),
  ]);
  if (studentError) throw studentError;
  if (classError) throw classError;
  if (!student) throw new Error("Student not found.");
  if (!cls) throw new Error("Class not found.");

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

  const { data: existing } = await supabase
    .from("GuardianNotification")
    .select("id")
    .eq("studentId", input.studentId)
    .eq("classId", input.classId)
    .eq("sessionDate", input.sessionDate)
    .maybeSingle();

  const row = {
    studentId: input.studentId,
    classId: input.classId,
    sessionDate: input.sessionDate,
    status: input.status,
    recipientPhone: student.emergencyContactPhone,
    delivered,
    message,
    sentAt: new Date().toISOString(),
  };
  // .select() + emptiness check, not just `error` — same RLS-blocked-write
  // gotcha as every other write in this file.
  const { data: notificationData, error: writeError } = existing
    ? await supabase.from("GuardianNotification").update(row).eq("id", existing.id).select("id").maybeSingle()
    : await supabase.from("GuardianNotification").insert({ id: crypto.randomUUID(), ...row }).select("id").maybeSingle();
  if (writeError || !notificationData) throw writeError ?? new Error("Could not save guardian notification.");

  return { delivered };
}

export async function markAttendanceRecord(
  coachId: string,
  input: unknown,
): Promise<ActionResult<{ status: string; sessionId: string }>> {
  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, sessionDate, studentId, status, excused, remarks } = parsed.data;

  // Find-or-create on (classId, sessionDate), not a single upsert call —
  // id has no Postgres-level default (same gotcha as every other insert in
  // this plan), but supplying it unconditionally in an upsert payload makes
  // PostgREST's ON CONFLICT DO UPDATE also overwrite the id column on every
  // subsequent call for the same (classId, sessionDate). Confirmed
  // empirically against the live project: this silently churns the
  // session's primary key on every student marked (AttendanceRecord's ON
  // UPDATE CASCADE keeps referential integrity intact either way, but any
  // client caching the session id across marks — e.g. to later call
  // reopenAttendanceSession — would see it go stale on every subsequent
  // mark in the same session). Select first, then insert-or-update
  // explicitly so the id is only ever set once, at creation.
  const { data: existingSession } = await supabase
    .from("AttendanceSession")
    .select("*")
    .eq("classId", classId)
    .eq("sessionDate", sessionDate)
    .maybeSingle();

  const { data: session, error: sessionError } = existingSession
    ? await supabase.from("AttendanceSession").update({ markedByCoachId: coachId }).eq("id", existingSession.id).select("*").maybeSingle()
    : await supabase
        .from("AttendanceSession")
        .insert({ id: crypto.randomUUID(), classId, sessionDate, markedByCoachId: coachId, updatedAt: new Date().toISOString() })
        .select("*")
        .maybeSingle();
  if (sessionError || !session) return { success: false, error: "You don't have access to this class." };

  if (session.submittedAt) {
    return { success: false, error: "This session is locked — reopen it to make changes." };
  }

  // Same id-churning concern as above — re-tapping the same student's
  // status (a supported flow, per the schema's own comment on this unique
  // key) must not change the AttendanceRecord row's id either.
  const { data: existingRecord } = await supabase
    .from("AttendanceRecord")
    .select("id")
    .eq("attendanceSessionId", session.id)
    .eq("studentId", studentId)
    .maybeSingle();

  // .select() + emptiness check, not just `error` — an RLS-blocked update
  // reports no error at all (see Global Constraints); matches the same
  // pattern already used for the AttendanceSession branch above.
  const { data: recordData, error: recordError } = existingRecord
    ? await supabase
        .from("AttendanceRecord")
        .update({ status, excused: excused ?? false, remarks })
        .eq("id", existingRecord.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("AttendanceRecord")
        .insert({
          id: crypto.randomUUID(),
          attendanceSessionId: session.id,
          studentId,
          status,
          excused: excused ?? false,
          remarks,
          updatedAt: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();
  if (recordError || !recordData) return { success: false, error: "Could not save attendance." };

  return { success: true, data: { status, sessionId: session.id } };
}

export async function submitAttendanceSession(input: unknown): Promise<ActionResult<{ notified: number; skipped: number }>> {
  const parsed = submitSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, sessionDate } = parsed.data;

  const { data: session, error: sessionError } = await supabase
    .from("AttendanceSession")
    .select("*, records:AttendanceRecord(*)")
    .eq("classId", classId)
    .eq("sessionDate", sessionDate)
    .maybeSingle();
  if (sessionError) return { success: false, error: "You don't have access to this class." };
  if (!session) return { success: false, error: "No attendance has been taken for this session yet." };

  const { count: activeCount } = await supabase
    .from("Enrollment")
    .select("id", { count: "exact", head: true })
    .eq("classId", classId)
    .eq("status", "ACTIVE");
  if (session.records.length < (activeCount ?? 0)) {
    return { success: false, error: "Mark every student before saving." };
  }

  const { data: updated, error: updateError } = await supabase
    .from("AttendanceSession")
    .update({ submittedAt: new Date().toISOString() })
    .eq("id", session.id)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) return { success: false, error: "Could not submit this session." };

  // Guardians of anyone who showed up (Present/Late) get notified — Absent
  // never fires one. Best-effort: a notification failure doesn't undo the
  // already-saved attendance, it just doesn't count toward `notified`.
  // The predicate's parameter must be inferred from session.records' own
  // element type (not a hand-written subset) or TS falls back to the
  // non-narrowing filter() overload — confirmed directly: an explicit
  // { status: string } annotation here leaves `arrivals` typed with the
  // full "PRESENT"|"ABSENT"|"LATE" union, which then fails to satisfy
  // sendGuardianAttendanceNotification's narrower status parameter below.
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

  return { success: true, data: { notified, skipped } };
}

export async function reopenAttendanceSession(input: unknown): Promise<ActionResult> {
  const parsed = reopenSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("AttendanceSession")
    .update({ submittedAt: null })
    .eq("id", parsed.data.sessionId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Session not found, or you don't have access to it." };
  return { success: true, data: undefined };
}

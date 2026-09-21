"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getRosterWithSession } from "@/lib/api/attendance";
import { getSingaporeTodayString, formatDateForDisplay } from "@/lib/dates";
import { formatClassLabel } from "@/lib/format";
import { AttendanceRoster } from "@/components/attendance/attendance-roster";

type RosterData = Awaited<ReturnType<typeof getRosterWithSession>>;

export default function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { classId } = use(params);
  const { date } = use(searchParams);
  const sessionDate = date ?? getSingaporeTodayString();
  const coach = useRequireCoach();
  const [data, setData] = useState<RosterData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setData(undefined);
    setError(null);
    getRosterWithSession(classId, sessionDate)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this class's attendance.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, classId, sessionDate]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (data === null) notFound();

  const { class: cls, session, roster } = data;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{formatClassLabel(cls)}</h1>
        <p className="text-sm text-muted-foreground">
          {cls.venue.name} · {formatDateForDisplay(sessionDate)}
        </p>
      </div>
      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students are enrolled in this class yet.</p>
      ) : (
        <AttendanceRoster
          coachId={coach.id}
          classId={classId}
          sessionDate={sessionDate}
          initialRoster={roster.map((r) => ({
            student: { id: r.student.id, name: r.student.name },
            record: r.record ? { status: r.record.status, excused: r.record.excused } : null,
          }))}
          initialSessionId={session?.id ?? null}
          initialSubmittedAt={session?.submittedAt ?? null}
          // Falls back to the current coach's own name, not null: the old
          // Server Action's revalidatePath re-rendered the whole page after
          // the lazy session-create/submit, picking up the fresh
          // markedByCoach join. Nothing does that now, so without this
          // fallback the lock banner reads "Taken by a coach" instead of
          // the actual name right after the current coach's own first mark
          // — markAttendanceRecord always stamps markedByCoachId as the
          // caller, so "no prior markedByCoach" + "now locked" can only mean
          // the current coach is the one who just marked it.
          markedByCoachName={session?.markedByCoach?.name ?? coach.name}
        />
      )}
    </div>
  );
}

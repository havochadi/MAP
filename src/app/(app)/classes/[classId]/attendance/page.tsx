import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { canAccessClass } from "@/lib/authorization";
import { getRosterWithSession } from "@/data/attendance";
import { getSingaporeTodayString, formatDateForDisplay } from "@/lib/dates";
import { formatClassLabel } from "@/lib/format";
import { AttendanceRoster } from "@/components/attendance/attendance-roster";

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { classId } = await params;
  const { date } = await searchParams;
  const sessionDate = date ?? getSingaporeTodayString();

  const coach = await requireCoach();
  if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) {
    redirect("/");
  }

  const data = await getRosterWithSession(classId, sessionDate);
  if (!data) notFound();

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
          classId={classId}
          sessionDate={sessionDate}
          initialRoster={roster.map((r) => ({
            student: { id: r.student.id, name: r.student.name },
            record: r.record ? { status: r.record.status, excused: r.record.excused } : null,
          }))}
          initialSessionId={session?.id ?? null}
          initialSubmittedAt={session?.submittedAt?.toISOString() ?? null}
          markedByCoachName={session?.markedByCoach?.name ?? null}
        />
      )}
    </div>
  );
}

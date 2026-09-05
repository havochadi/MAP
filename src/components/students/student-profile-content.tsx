import Link from "next/link";
import type { ReactNode } from "react";
import { summarizeAttendance, type AttendanceRecordLike } from "@/lib/attendance-stats";
import { formatClassLabel, formatLevel, getInitials } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AttendanceFlags } from "@/components/students/attendance-flags";
import type { getStudentProfile } from "@/data/students";

type StudentProfileData = NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>;

// Shared between the coach-facing student profile (/students/[id]) and the
// student's own self-view (/student) — same data, same read-only rendering.
// The coach page additionally wraps this with admin-only enrollment
// controls; `classHref` lets the coach view link each class to its detail
// page while the student view (which has no class detail page) renders
// plain text instead.
export function StudentProfileContent({
  student,
  records,
  classHref,
  enrollmentExtra,
}: StudentProfileData & {
  classHref?: (classId: string) => string;
  enrollmentExtra?: (enrollmentId: string) => ReactNode;
}) {
  const toRecordLike = (r: (typeof records)[number]): AttendanceRecordLike => ({
    status: r.status,
    excused: r.excused,
    sessionDate: r.session.sessionDate,
  });

  const pooled = summarizeAttendance(records.map(toRecordLike));

  const recordsByClass = new Map<string, typeof records>();
  for (const r of records) {
    const list = recordsByClass.get(r.session.classId) ?? [];
    list.push(r);
    recordsByClass.set(r.session.classId, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{student.name}</h1>
            {student.status !== "ACTIVE" && (
              <Badge variant={student.status === "REMOVED" ? "destructive" : "secondary"}>{student.status}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatLevel(student.level)} · {student.venue.name}
          </p>
        </div>
      </div>

      <AttendanceFlags summary={pooled} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Overall attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{pooled.percentage != null ? `${pooled.percentage}%` : "—"}</span>
            <span className="text-sm text-muted-foreground">
              {pooled.attended} of {pooled.totalCountable} sessions
            </span>
          </div>
          {pooled.percentage != null && <Progress value={pooled.percentage} />}
        </CardContent>
      </Card>

      {(student.guardianName || student.guardianPhone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Guardian</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {student.guardianName}
            {student.guardianPhone && ` · ${student.guardianPhone}`}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Classes</h2>
        {student.enrollments.length === 0 && <p className="text-sm text-muted-foreground">Not enrolled in any classes.</p>}
        {student.enrollments.map((e) => {
          const classRecords = (recordsByClass.get(e.classId) ?? []).map(toRecordLike);
          const classSummary = summarizeAttendance(classRecords);
          const href = classHref?.(e.classId);

          return (
            <Card key={e.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {href ? (
                      <Link href={href} className="font-medium hover:underline">
                        {formatClassLabel(e.class)}
                      </Link>
                    ) : (
                      <p className="font-medium">{formatClassLabel(e.class)}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{e.class.venue.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium">
                      {classSummary.percentage != null ? `${classSummary.percentage}%` : "No sessions yet"}
                    </span>
                    {enrollmentExtra?.(e.id)}
                  </div>
                </div>
                <AttendanceFlags summary={classSummary} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Recent attendance</h2>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {records.slice(0, 15).map((r) => (
              <li key={r.id} className="flex items-center justify-between px-3 py-2">
                <span>{formatDateForDisplay(r.session.sessionDate)}</span>
                <span className="flex items-center gap-2">
                  {r.excused && <Badge variant="outline">Excused</Badge>}
                  <Badge variant={r.status === "PRESENT" ? "default" : r.status === "LATE" ? "secondary" : "destructive"}>
                    {r.status}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

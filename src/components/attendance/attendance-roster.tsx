"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusButton, type AttendanceStatus } from "./status-button";
import { markAttendanceRecord, submitAttendanceSession, reopenAttendanceSession } from "@/actions/attendance";
import { getInitials } from "@/lib/format";

type RosterEntry = {
  student: { id: string; name: string };
  record: { status: AttendanceStatus; excused: boolean } | null;
};

export function AttendanceRoster({
  classId,
  sessionDate,
  initialRoster,
  initialSessionId,
  initialSubmittedAt,
  markedByCoachName,
}: {
  classId: string;
  sessionDate: string;
  initialRoster: RosterEntry[];
  initialSessionId: string | null;
  initialSubmittedAt: string | null;
  markedByCoachName: string | null;
}) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | null>>(() =>
    Object.fromEntries(initialRoster.map((r) => [r.student.id, r.record?.status ?? null])),
  );
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [submittedAt, setSubmittedAt] = useState(initialSubmittedAt);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [, startTransition] = useTransition();

  const markedCount = Object.values(statuses).filter(Boolean).length;
  const allMarked = markedCount === initialRoster.length;
  const isLocked = submittedAt != null;

  function handleSelect(studentId: string, status: AttendanceStatus) {
    const previous = statuses[studentId];
    setStatuses((s) => ({ ...s, [studentId]: status }));
    startTransition(async () => {
      const result = await markAttendanceRecord({ classId, sessionDate, studentId, status });
      if (!result.success) {
        setStatuses((s) => ({ ...s, [studentId]: previous ?? null }));
        toast.error(result.error);
        return;
      }
      // The first tap for a session lazily creates it server-side — capture
      // the real id so a later reopen doesn't need a separate lookup.
      setSessionId(result.data.sessionId);
    });
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const result = await submitAttendanceSession({ classId, sessionDate });
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setSubmittedAt(new Date().toISOString());
    const { notified, skipped } = result.data;
    toast.success(
      notified + skipped === 0
        ? "Attendance saved."
        : `Attendance saved. Guardians notified: ${notified}/${notified + skipped}${skipped > 0 ? " (no phone on file for the rest)" : ""}.`,
    );
  }

  async function handleReopen() {
    if (!sessionId) return;
    setIsReopening(true);
    const result = await reopenAttendanceSession({ sessionId });
    setIsReopening(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setSubmittedAt(null);
  }

  return (
    <div className="space-y-4 pb-28 md:pb-4">
      {isLocked && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <span>Taken by {markedByCoachName ?? "a coach"}</span>
          <button
            type="button"
            className="font-medium underline underline-offset-2 disabled:opacity-50"
            onClick={handleReopen}
            disabled={isReopening}
          >
            {isReopening ? "Reopening..." : "tap to edit"}
          </button>
        </div>
      )}
      <ul className="divide-y rounded-lg border">
        {initialRoster.map(({ student }) => (
          <li key={student.id} className="flex items-center gap-3 p-3">
            <Avatar size="sm">
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm font-medium">{student.name}</span>
            <div className="flex gap-1.5">
              {(["PRESENT", "LATE", "ABSENT"] as const).map((status) => (
                <StatusButton
                  key={status}
                  status={status}
                  currentStatus={statuses[student.id] ?? null}
                  onSelect={(s) => handleSelect(student.id, s)}
                  disabled={isLocked}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!isLocked && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-background p-3 md:sticky md:bottom-0 md:mt-4 md:border-t-0 md:p-0 md:pt-4">
          <div className="mx-auto max-w-5xl">
            <Button className="w-full" size="lg" disabled={!allMarked || isSubmitting} onClick={handleSubmit}>
              {isSubmitting
                ? "Saving..."
                : allMarked
                  ? "Save Attendance"
                  : `Mark everyone to save (${markedCount}/${initialRoster.length})`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

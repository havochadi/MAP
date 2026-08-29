// Pure functions — no I/O — so the business rules behind the real MAP
// policies (80% attendance for disbursement, 6-consecutive-lesson removal)
// are easy to read, test, and reason about in isolation from data fetching.

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export type AttendanceRecordLike = {
  status: AttendanceStatus;
  excused: boolean;
  sessionDate: string; // "YYYY-MM-DD"
};

export const REMOVAL_THRESHOLD_CONSECUTIVE_ABSENCES = 6;
export const NEAR_REMOVAL_WARNING_THRESHOLD = REMOVAL_THRESHOLD_CONSECUTIVE_ABSENCES - 2;
export const DISBURSEMENT_THRESHOLD_PERCENT = 80;

export type AttendanceSummary = {
  totalCountable: number;
  attended: number;
  percentage: number | null;
  consecutiveUnexcusedAbsences: number;
  lessonsUntilRemoval: number;
  belowDisbursementThreshold: boolean;
  nearRemovalWarning: boolean;
  removalTriggered: boolean;
};

// An excused absence is treated as "no countable opportunity that day" — it
// is dropped from the denominator entirely, not counted as either an attend
// or a miss. This is a stated product assumption (the real MAP rule only
// mentions the 80% figure, not how excused absences interact with it), kept
// consistent with the streak rule below.
export function computeAttendancePercentage(records: AttendanceRecordLike[]): {
  attended: number;
  totalCountable: number;
  percentage: number | null;
} {
  const countable = records.filter((r) => !(r.status === "ABSENT" && r.excused));
  const attended = countable.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return {
    attended,
    totalCountable: countable.length,
    percentage: countable.length === 0 ? null : Math.round((attended / countable.length) * 1000) / 10,
  };
}

// Counts trailing unexcused absences, most recent session first. A Present,
// a Late, OR an excused Absent all stop the count — an excused absence is
// treated as a genuine interruption to a bad pattern (the family had a valid
// reason and stayed in contact), not merely skipped over. Without this, one
// excused day in the middle of a run wouldn't meaningfully change the
// outcome, which would undercut the whole point of the excused flag.
export function computeConsecutiveUnexcusedAbsences(records: AttendanceRecordLike[]): number {
  const sorted = [...records].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  let streak = 0;
  for (const record of sorted) {
    if (record.status === "ABSENT" && !record.excused) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function summarizeAttendance(records: AttendanceRecordLike[]): AttendanceSummary {
  const { attended, totalCountable, percentage } = computeAttendancePercentage(records);
  const consecutiveUnexcusedAbsences = computeConsecutiveUnexcusedAbsences(records);
  const lessonsUntilRemoval = Math.max(REMOVAL_THRESHOLD_CONSECUTIVE_ABSENCES - consecutiveUnexcusedAbsences, 0);

  return {
    totalCountable,
    attended,
    percentage,
    consecutiveUnexcusedAbsences,
    lessonsUntilRemoval,
    belowDisbursementThreshold: percentage !== null && percentage < DISBURSEMENT_THRESHOLD_PERCENT,
    nearRemovalWarning:
      consecutiveUnexcusedAbsences >= NEAR_REMOVAL_WARNING_THRESHOLD &&
      consecutiveUnexcusedAbsences < REMOVAL_THRESHOLD_CONSECUTIVE_ABSENCES,
    removalTriggered: consecutiveUnexcusedAbsences >= REMOVAL_THRESHOLD_CONSECUTIVE_ABSENCES,
  };
}

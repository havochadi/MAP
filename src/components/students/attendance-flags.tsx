import { AlertTriangle, TrendingDown } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { AttendanceSummary } from "@/lib/attendance-stats";

// Renders the real MAP policy thresholds as live, computed flags — 80%
// attendance for the funding disbursement, 6 consecutive unexcused absences
// for removal from the programme.
export function AttendanceFlags({ summary }: { summary: AttendanceSummary }) {
  if (!summary.belowDisbursementThreshold && !summary.nearRemovalWarning && !summary.removalTriggered) {
    return null;
  }

  return (
    <div className="space-y-2">
      {summary.removalTriggered && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Removal threshold reached</AlertTitle>
          <AlertDescription>
            {summary.consecutiveUnexcusedAbsences} consecutive unexcused absences — meets the MAP policy
            threshold for removal from the programme.
          </AlertDescription>
        </Alert>
      )}
      {!summary.removalTriggered && summary.nearRemovalWarning && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>At risk of removal</AlertTitle>
          <AlertDescription>
            {summary.consecutiveUnexcusedAbsences} consecutive unexcused absences — {summary.lessonsUntilRemoval}{" "}
            more triggers removal from the programme.
          </AlertDescription>
        </Alert>
      )}
      {summary.belowDisbursementThreshold && (
        <Alert>
          <TrendingDown />
          <AlertTitle>Below disbursement threshold</AlertTitle>
          <AlertDescription>
            {summary.percentage}% attendance — MAP requires at least {80}% to qualify for the funding
            disbursement.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

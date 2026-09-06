"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reopenShift } from "@/actions/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { formatDateForDisplay } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditShiftDialog } from "@/components/coach/edit-shift-dialog";

type Shift = {
  id: string;
  venue: { name: string };
  shiftDate: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  status: "OPEN" | "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
};

const STATUS_VARIANT = {
  OPEN: "default",
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
} as const;

export function ShiftHistory({ shifts, canReopen }: { shifts: Shift[]; canReopen: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleReopen(shiftId: string) {
    startTransition(async () => {
      const result = await reopenShift({ shiftId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Reopened for editing.");
      router.refresh();
    });
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">No shifts logged yet.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {shifts.map((shift) => (
        <li key={shift.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {shift.venue.name} · {formatDateForDisplay(shift.shiftDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {computeShiftHours(shift).toFixed(2)}h · ${computeShiftPay(shift).toFixed(2)}
              {shift.reviewNote && ` · ${shift.reviewNote}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={STATUS_VARIANT[shift.status]}>{shift.status}</Badge>
            {(shift.status === "OPEN" || shift.status === "PENDING") && <EditShiftDialog shift={shift} />}
            {canReopen && (shift.status === "APPROVED" || shift.status === "REJECTED") && (
              <Button size="sm" variant="ghost" disabled={isPending} onClick={() => handleReopen(shift.id)}>
                Reopen
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { Check, X, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

const CONFIG: Record<AttendanceStatus, { label: string; icon: LucideIcon; active: string }> = {
  PRESENT: { label: "Present", icon: Check, active: "border-green-600 bg-green-600 text-white" },
  LATE: { label: "Late", icon: Clock, active: "border-amber-600 bg-amber-600 text-white" },
  ABSENT: { label: "Absent", icon: X, active: "border-red-600 bg-red-600 text-white" },
};

// The core interaction of the whole app: large (44px+), full-color-fill-when-
// selected tap targets so a coach can mark a roster at arm's length, standing
// in a classroom, without hunting for a small control.
export function StatusButton({
  status,
  currentStatus,
  onSelect,
  disabled,
}: {
  status: AttendanceStatus;
  currentStatus: AttendanceStatus | null;
  onSelect: (status: AttendanceStatus) => void;
  disabled?: boolean;
}) {
  const { label, icon: Icon, active } = CONFIG[status];
  const isActive = currentStatus === status;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(status)}
      aria-pressed={isActive}
      aria-label={`Mark ${label}`}
      className={cn(
        "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        isActive ? active : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

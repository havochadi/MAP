import { GraduationCap } from "lucide-react";

// An original mark for this app — deliberately not an attempt at MENDAKI's
// actual logo. This is an unofficial student project, not a real MENDAKI
// deliverable, and using the organisation's real trademark here would
// misleadingly imply official endorsement. Swap this for a real, approved
// MENDAKI asset if this were ever built with the organisation directly.
export function AppLogo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <GraduationCap className="size-1/2" aria-hidden="true" />
    </div>
  );
}

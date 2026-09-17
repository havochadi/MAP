"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getCoachProfile } from "@/lib/api/coaches";
import { getShiftHistoryForCoach } from "@/lib/api/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ShiftHistory } from "@/components/coach/shift-history";

type CoachProfileData = Awaited<ReturnType<typeof getCoachProfile>>;
type Shifts = Awaited<ReturnType<typeof getShiftHistoryForCoach>>;

export default function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = use(params);
  const router = useRouter();
  const currentCoach = useRequireCoach();
  const [data, setData] = useState<CoachProfileData | undefined>(undefined);
  const [shifts, setShifts] = useState<Shifts | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // A non-admin may view their own profile, not anyone else's — redirected
  // to their own profile (not "/") if they try. Neither useRequireAdmin()
  // nor useRequireCoach() expresses this alone, so it's inline here rather
  // than a third shared hook for one call site.
  const canView = !!currentCoach && (currentCoach.isAdmin || currentCoach.id === coachId);

  useEffect(() => {
    if (currentCoach && !currentCoach.isAdmin && currentCoach.id !== coachId) {
      router.replace(`/coaches/${currentCoach.id}`);
    }
  }, [currentCoach, coachId, router]);

  // Resets `data`/`error` on every coachId change, not just on mount — a
  // real, reachable navigation via the bottom tab bar's persistent
  // "Profile" link (src/components/nav/bottom-tab-bar.tsx), which points
  // at whatever coachId is current and does not force a remount when it
  // changes (e.g. an admin browsing from one coach's profile to their
  // own). Without the reset, the *previous* coach's data would stay
  // visible under the new URL until the new fetch resolved, and a stuck
  // `error` from an earlier coachId would permanently mask a later,
  // successful fetch (this page checks `error` before `data === undefined`
  // below). Caught during this plan's own drafting — prompted by the
  // venue-detail slice's final review flagging this exact reachability
  // path on a structurally similar page that didn't happen to hit it.
  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    setData(undefined);
    setError(null);
    getCoachProfile(coachId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this coach.");
      });
    return () => {
      cancelled = true;
    };
  }, [canView, coachId]);

  // Deliberately does NOT reset `shifts` first — this is also called after
  // a successful reopen/edit (see ShiftHistory below), where the fresh
  // list should swap in quietly, not flash the page back to "Loading…".
  // The coachId-change reset lives in the separate effect right below,
  // which only runs on navigation, not on every mutation.
  const refreshShifts = useCallback(() => {
    getShiftHistoryForCoach(coachId)
      .then(setShifts)
      .catch(() => setError("Could not load shift history."));
  }, [coachId]);

  useEffect(() => {
    if (!canView) return;
    setShifts(undefined);
    setError(null);
    refreshShifts();
  }, [canView, coachId, refreshShifts]);

  if (!currentCoach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined || shifts === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (data === null) notFound();

  const { coach } = data;
  const approvedShifts = shifts.filter((s) => s.status === "APPROVED");
  const approvedHours = approvedShifts.reduce((sum, s) => sum + computeShiftHours(s), 0);
  const approvedPay = approvedShifts.reduce((sum, s) => sum + computeShiftPay(s), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{coach.name}</h1>
            {coach.isAdmin && <Badge>Admin</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{coach.email}</p>
          {coach.phone && <p className="text-sm text-muted-foreground">{coach.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">{approvedHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Approved hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">${approvedPay.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Approved pay</p>
          </CardContent>
        </Card>
      </div>

      {currentCoach.isAdmin && (
        <Link href="/payroll" className={buttonVariants({ variant: "outline" })}>
          Go to payroll
        </Link>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Shifts</h2>
        <ShiftHistory shifts={shifts} canReopen={currentCoach.isAdmin} onChanged={refreshShifts} />
      </div>
    </div>
  );
}

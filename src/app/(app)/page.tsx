"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireCoach } from "@/lib/supabase/session";
import { getOpenShiftForCoach } from "@/lib/api/coach-shifts";
import { getCheckInCountForShift } from "@/lib/api/checkins";
import { getAllVenues } from "@/lib/api/venues";
import { getSingaporeTodayString, getDayOfWeek } from "@/lib/dates";
import { blocksForDay, SHIFT_BLOCKS } from "@/lib/shift-blocks";
import { ClockInForm } from "@/components/checkin/clock-in-form";
import { CheckInDesk } from "@/components/checkin/check-in-desk";

type OpenShift = Awaited<ReturnType<typeof getOpenShiftForCoach>>;
type Venue = { id: string; name: string };

export default function DashboardPage() {
  const coach = useRequireCoach();
  // Recomputed every render, not hoisted to module scope — see Global Constraints.
  const todayBlocks = blocksForDay(getDayOfWeek(getSingaporeTodayString()));

  const [openShift, setOpenShift] = useState<OpenShift | undefined>(undefined);
  const [venues, setVenues] = useState<Venue[] | undefined>(undefined);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Owned here (not inside ClockInForm/CheckInDesk) because clocking in or
  // out changes which of those two components should even be on screen —
  // there's no Server Action revalidatePath to do this for us anymore, see
  // this plan's Architecture note.
  const refreshShift = useCallback(() => {
    if (!coach) return;
    getOpenShiftForCoach(coach.id)
      .then(setOpenShift)
      .catch(() => setError("Could not load your shift."));
  }, [coach]);

  useEffect(() => {
    refreshShift();
  }, [refreshShift]);

  useEffect(() => {
    if (openShift === undefined) return;
    if (openShift) {
      getCheckInCountForShift(openShift.id)
        .then(setCount)
        .catch(() => setError("Could not load check-in count."));
    } else if (todayBlocks.length > 0) {
      getAllVenues()
        .then(setVenues)
        .catch(() => setError("Could not load venues."));
    }
    // todayBlocks is derived from the current date, not external state that
    // changes within this effect's lifetime — omitted from deps deliberately,
    // same reasoning as every other date-derived value in this codebase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openShift]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (openShift === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!openShift) {
    if (todayBlocks.length === 0) {
      return (
        <div className="mx-auto max-w-sm space-y-2 pt-10 text-center">
          <h1 className="text-xl font-semibold">No session today</h1>
          <p className="text-sm text-muted-foreground">
            Study Space runs Tue &amp; Thu evenings, and Sat &amp; Sun. Check back on the next session day.
          </p>
        </div>
      );
    }
    if (venues === undefined) {
      return <p className="text-sm text-muted-foreground">Loading…</p>;
    }
    const blocks = todayBlocks.map((key) => ({ key, label: SHIFT_BLOCKS[key].label }));
    return <ClockInForm coachId={coach.id} venues={venues} blocks={blocks} onClockedIn={refreshShift} />;
  }

  if (count === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  return <CheckInDesk shift={openShift} initialCount={count} onClockedOut={refreshShift} />;
}

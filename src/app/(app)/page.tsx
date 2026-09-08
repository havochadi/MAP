import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach } from "@/data/coach-shifts";
import { getCheckInCountForShift } from "@/data/checkins";
import { getAllVenues } from "@/data/venues";
import { getSingaporeTodayString, getDayOfWeek } from "@/lib/dates";
import { blocksForDay, SHIFT_BLOCKS } from "@/lib/shift-blocks";
import { ClockInForm } from "@/components/checkin/clock-in-form";
import { CheckInDesk } from "@/components/checkin/check-in-desk";

export default async function DashboardPage() {
  const coach = await requireCoach();
  const openShift = await getOpenShiftForCoach(coach.id);

  if (!openShift) {
    const todayBlocks = blocksForDay(getDayOfWeek(getSingaporeTodayString()));
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
    const venues = await getAllVenues();
    const blocks = todayBlocks.map((key) => ({ key, label: SHIFT_BLOCKS[key].label }));
    return <ClockInForm venues={venues} blocks={blocks} />;
  }

  const count = await getCheckInCountForShift(openShift.id);
  return <CheckInDesk shift={openShift} initialCount={count} />;
}

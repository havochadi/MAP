import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach } from "@/data/coach-shifts";
import { getCheckInCountForShift } from "@/data/checkins";
import { getAllVenues } from "@/data/venues";
import { ClockInForm } from "@/components/checkin/clock-in-form";
import { CheckInDesk } from "@/components/checkin/check-in-desk";

export default async function DashboardPage() {
  const coach = await requireCoach();
  const openShift = await getOpenShiftForCoach(coach.id);

  if (!openShift) {
    const venues = await getAllVenues();
    return <ClockInForm venues={venues} />;
  }

  const count = await getCheckInCountForShift(openShift.id);
  return <CheckInDesk shift={openShift} initialCount={count} />;
}

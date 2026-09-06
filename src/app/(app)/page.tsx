import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach } from "@/data/coach-shifts";
import { getAllVenues } from "@/data/venues";
import { ClockInForm } from "@/components/checkin/clock-in-form";

export default async function DashboardPage() {
  const coach = await requireCoach();
  const openShift = await getOpenShiftForCoach(coach.id);

  if (!openShift) {
    const venues = await getAllVenues();
    return <ClockInForm venues={venues} />;
  }

  // Task 15 replaces this placeholder with the real CheckInDesk (scanner,
  // manual code fallback, running count, clock-out, register-new-visitor).
  return <p>Clocked in at {openShift.venue.name}. Check-in desk coming in Task 15.</p>;
}

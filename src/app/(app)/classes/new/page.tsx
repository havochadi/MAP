import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getAllVenuesWithClassCounts } from "@/data/classes";
import { CreateClassForm } from "@/components/classes/create-class-form";

export default async function NewClassPage({
  searchParams,
}: {
  searchParams: Promise<{ venueId?: string }>;
}) {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/");

  const { venueId } = await searchParams;
  const venues = await getAllVenuesWithClassCounts();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Create a class</h1>
        <p className="text-sm text-muted-foreground">A class is one subject + level taught at a venue on a weekly slot.</p>
      </div>
      <CreateClassForm venues={venues} defaultVenueId={venueId} />
    </div>
  );
}

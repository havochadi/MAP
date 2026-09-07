import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getAllVenuesWithClassCounts } from "@/data/classes";
import { Card, CardContent } from "@/components/ui/card";
import { CreateVenueForm } from "@/components/venues/create-venue-form";

export default async function VenuesPage() {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/");

  const venues = await getAllVenuesWithClassCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Venues</h1>
        <p className="text-sm text-muted-foreground">MENDAKI centres where classes are held.</p>
      </div>

      <CreateVenueForm />

      {venues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No venues yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent>
                  <p className="font-medium">{venue.name}</p>
                  {venue.address && <p className="text-sm text-muted-foreground">{venue.address}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {venue._count.classes} classes · {venue._count.checkIns} check-ins
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getVenueWithClasses } from "@/data/classes";
import { formatClassLabel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function VenueDetailPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/");

  const venue = await getVenueWithClasses(venueId);
  if (!venue) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{venue.name}</h1>
          {venue.address && <p className="text-sm text-muted-foreground">{venue.address}</p>}
        </div>
        <Link href={`/classes/new?venueId=${venue.id}`} className={buttonVariants({ variant: "outline" })}>
          Add class
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Classes</h2>
        {venue.classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes at this venue yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {venue.classes.map((cls) => (
              <Link key={cls.id} href={`/classes/${cls.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent>
                    <p className="font-medium">{formatClassLabel(cls)}</p>
                    <p className="text-sm text-muted-foreground">{cls._count.enrollments} students enrolled</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

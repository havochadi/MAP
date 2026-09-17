"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getVenueWithClasses } from "@/lib/api/classes";
import { formatClassLabel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

type VenueWithClasses = Awaited<ReturnType<typeof getVenueWithClasses>>;

export default function VenueDetailPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = use(params);
  const coach = useRequireAdmin();
  const [venue, setVenue] = useState<VenueWithClasses | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getVenueWithClasses(venueId)
      .then((data) => {
        if (!cancelled) setVenue(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this venue.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, venueId]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (venue === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (venue === null) notFound();

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

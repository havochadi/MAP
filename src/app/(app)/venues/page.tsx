"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getAllVenuesWithClassCounts } from "@/lib/api/classes";
import { Card, CardContent } from "@/components/ui/card";
import { CreateVenueForm } from "@/components/venues/create-venue-form";

type VenueWithCounts = Awaited<ReturnType<typeof getAllVenuesWithClassCounts>>[number];

export default function VenuesPage() {
  const coach = useRequireAdmin();
  const [venues, setVenues] = useState<VenueWithCounts[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Derived boolean, not the coach object itself: session.tsx's context can
  // hand back a new coach object reference across re-resolutions (e.g. the
  // documented double-resolve-on-mount in Plan 2a's final review, Minor M3)
  // even when the underlying session hasn't actually changed — depending on
  // `ready` instead of `coach` avoids re-fetching venues on every such
  // reference change while still fetching exactly once real access starts.
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getAllVenuesWithClassCounts()
      .then((data) => {
        if (!cancelled) setVenues(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load venues.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Venues</h1>
        <p className="text-sm text-muted-foreground">MENDAKI centres where classes are held.</p>
      </div>

      <CreateVenueForm />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : venues === null ? (
        <p className="text-sm text-muted-foreground">Loading venues…</p>
      ) : venues.length === 0 ? (
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

"use client";

import { use, useEffect, useState } from "react";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getAllVenuesWithClassCounts } from "@/lib/api/classes";
import { CreateClassForm } from "@/components/classes/create-class-form";

type Venues = Awaited<ReturnType<typeof getAllVenuesWithClassCounts>>;

export default function NewClassPage({
  searchParams,
}: {
  searchParams: Promise<{ venueId?: string }>;
}) {
  const coach = useRequireAdmin();
  const { venueId } = use(searchParams);
  const [venues, setVenues] = useState<Venues | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
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
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (venues === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

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

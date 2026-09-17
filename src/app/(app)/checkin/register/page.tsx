"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireCoach } from "@/lib/supabase/session";
import { getOpenShiftForCoach } from "@/lib/api/coach-shifts";
import { registerAndCheckInStudent } from "@/lib/api/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buttonVariants } from "@/components/ui/button";

type OpenShift = Awaited<ReturnType<typeof getOpenShiftForCoach>>;

export default function RegisterVisitorPage() {
  const router = useRouter();
  const coach = useRequireCoach();
  const [openShift, setOpenShift] = useState<OpenShift | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready || !coach) return;
    let cancelled = false;
    getOpenShiftForCoach(coach.id)
      .then((data) => {
        if (!cancelled) setOpenShift(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your shift.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, coach]);

  // Matches the original's redirect("/") when there's no open shift — a
  // separate effect, not an inline call during render, same convention as
  // every other post-fetch redirect in this plan-lineage.
  useEffect(() => {
    if (openShift === null) router.replace("/");
  }, [openShift, router]);

  if (!coach) return null;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (openShift === undefined || openShift === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Register new visitor</h1>
        <p className="text-sm text-muted-foreground">Checks them in immediately at {openShift.venue.name}.</p>
      </div>
      <RegistrationFlow
        onSubmitAction={registerAndCheckInStudent}
        footer={
          <Link href="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to check-in desk
          </Link>
        }
      />
    </div>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getClassDetail } from "@/lib/api/classes";
import { getAllCoachesForSelect } from "@/lib/api/coaches";
import { formatClassLabel, getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AssignCoachForm } from "@/components/classes/assign-coach-form";

type ClassDetail = Awaited<ReturnType<typeof getClassDetail>>;
type SelectableCoach = Awaited<ReturnType<typeof getAllCoachesForSelect>>[number];

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const coach = useRequireCoach();
  const [cls, setCls] = useState<ClassDetail | undefined>(undefined);
  const [allCoaches, setAllCoaches] = useState<SelectableCoach[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;
  const isAdmin = !!coach?.isAdmin;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setCls(undefined);
    setError(null);
    getClassDetail(classId)
      .then((result) => {
        if (!cancelled) setCls(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this class.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, classId]);

  // Depends on classId too (even though the coach list itself is the same
  // regardless of which class is open) so a navigation to a different class
  // gives this fetch a fresh retry attempt if it previously failed — without
  // resetting `allCoaches` itself, which would otherwise re-flash "Loading…"
  // for classId-independent data on every class-to-class navigation.
  useEffect(() => {
    if (!ready || !isAdmin) return;
    let cancelled = false;
    setError(null);
    getAllCoachesForSelect()
      .then((result) => {
        if (!cancelled) setAllCoaches(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load coaches.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, isAdmin, classId]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (cls === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (cls === null) notFound();

  // Filters out a null coach on an assignment row (should never happen for a
  // valid assignment, but getClassDetail's type allows it — see this plan's
  // Architecture note) rather than asserting non-null, so a real data gap
  // fails safe (the coach is silently omitted) instead of crashing the page.
  // The inner `.id!`/`.name!` assertions are a second, separate nullability:
  // coach_public is a Postgres view, and PostgREST's generated types mark
  // every view column nullable regardless of the underlying (NOT NULL)
  // column's real nullability (same quirk already documented in
  // src/lib/api/attendance.ts's getRosterWithSession) — a matched row's
  // id/name are never actually null, only typed that way.
  const assignedCoaches = cls.assignments
    .filter((a) => a.coach !== null)
    .map((a) => ({ id: a.coach!.id!, name: a.coach!.name! }));
  const availableCoaches =
    isAdmin && allCoaches ? allCoaches.filter((c) => !assignedCoaches.some((a) => a.id === c.id)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{formatClassLabel(cls)}</h1>
        <p className="text-sm text-muted-foreground">{cls.venue.name}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/classes/${classId}/attendance`} className={buttonVariants()}>
          Take attendance
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Coaches</h2>
        {isAdmin ? (
          allCoaches === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <AssignCoachForm classId={classId} assignedCoaches={assignedCoaches} availableCoaches={availableCoaches} />
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedCoaches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coaches assigned yet.</p>
            ) : (
              assignedCoaches.map((c) => (
                <Link
                  key={c.id}
                  href={`/coaches/${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm hover:bg-muted/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                  </Avatar>
                  {c.name}
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Students ({cls.enrollments.length})</h2>
        {cls.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {cls.enrollments.map((e) => (
                <Link
                  key={e.id}
                  href={`/students/${e.student.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(e.student.name)}</AvatarFallback>
                  </Avatar>
                  {e.student.name}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

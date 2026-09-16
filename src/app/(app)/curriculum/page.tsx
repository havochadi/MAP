"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireCoach } from "@/lib/supabase/session";
import { getSubjectLevelCombos } from "@/lib/api/curriculum";
import { formatSubject, formatLevel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

type Combo = Awaited<ReturnType<typeof getSubjectLevelCombos>>[number];

export default function CurriculumIndexPage() {
  const coach = useRequireCoach();
  const [combos, setCombos] = useState<Combo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getSubjectLevelCombos()
      .then((data) => {
        if (!cancelled) setCombos(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load curriculum.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (combos === null) {
    return <p className="text-sm text-muted-foreground">Loading curriculum…</p>;
  }

  const bySubject = new Map<Combo["subject"], Combo[]>();
  for (const c of combos) {
    const list = bySubject.get(c.subject) ?? [];
    list.push(c);
    bySubject.set(c.subject, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Curriculum guide</h1>
        <p className="text-sm text-muted-foreground">
          Browse what to teach for each subject and level, based on the MOE syllabus. Open to any coach.
        </p>
      </div>
      {[...bySubject.entries()].map(([subject, levels]) => (
        <div key={subject} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{formatSubject(subject)}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {levels.map((c) => (
              <Link key={`${c.subject}-${c.level}`} href={`/curriculum/${c.subject.toLowerCase()}/${c.level.toLowerCase()}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="py-3 text-center text-sm font-medium">{formatLevel(c.level)}</CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getStudentProfile } from "@/lib/api/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";
import { LoginCodeCard } from "@/components/students/login-code-card";

type StudentProfileData = Awaited<ReturnType<typeof getStudentProfile>>;

export default function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const coach = useRequireCoach();
  // undefined = not yet fetched (loading); null = fetched, RLS/not-found;
  // object = fetched and visible to this coach. Distinct from `undefined`
  // because getStudentProfile's own real return type already includes
  // `null` as "not found" — collapsing that into the loading state would
  // make a genuine 404 show "Loading…" forever instead of notFound().
  const [data, setData] = useState<StudentProfileData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getStudentProfile(studentId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this student.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, studentId]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (data === null) notFound();

  return (
    <>
      {coach.isAdmin && (
        <div className="mb-4">
          <LoginCodeCard studentId={studentId} initialCode={data.student.loginCode} />
        </div>
      )}
      <StudentProfileContent {...data} />
    </>
  );
}

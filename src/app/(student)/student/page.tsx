"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireStudent } from "@/lib/supabase/session";
import { getStudentProfile } from "@/lib/api/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";

type StudentProfileData = Awaited<ReturnType<typeof getStudentProfile>>;

export default function StudentDashboardPage() {
  const router = useRouter();
  const student = useRequireStudent();
  const [data, setData] = useState<StudentProfileData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!student;

  useEffect(() => {
    if (!ready || !student) return;
    let cancelled = false;
    getStudentProfile(student.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your profile.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, student]);

  // Matches the original's redirect("/login") rather than notFound() — a
  // student whose own profile can't be found (e.g. their account was
  // removed after their session was issued) is bounced back to sign in
  // again, not shown a generic 404. A separate effect, not an inline call
  // during render, since the redirect is a side effect that must happen
  // after commit, same convention useRequireStudent itself uses.
  useEffect(() => {
    if (data === null) router.replace("/login");
  }, [data, router]);

  if (!student) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined || data === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return <StudentProfileContent {...data} />;
}

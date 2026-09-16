"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getStudentsForCoach } from "@/lib/api/students";
import { formatLevel, getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Student = Awaited<ReturnType<typeof getStudentsForCoach>>[number];

export default function StudentsPage() {
  const coach = useRequireAdmin();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getStudentsForCoach()
      .then((data) => {
        if (!cancelled) setStudents(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load students.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {coach.isAdmin ? "Every student across all venues." : "Students in your classes."}
          </p>
        </div>
        {coach.isAdmin && (
          <Link href="/students/new" className={buttonVariants()}>
            Register student
          </Link>
        )}
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : students === null ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students to show yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                href={`/students/${student.id}`}
                className={cn("flex items-center gap-3 px-4 py-3 hover:bg-muted/50")}
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLevel(student.level)} · {student.schoolName}
                  </p>
                </div>
                {student.status !== "ACTIVE" && (
                  <Badge variant={student.status === "REMOVED" ? "destructive" : "secondary"}>{student.status}</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

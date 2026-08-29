"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { enrollStudentInClass, dropEnrollment } from "@/actions/students";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { formatClassLabel } from "@/lib/format";
import type { Subject, Level, DayOfWeek } from "@/generated/prisma/client";

type ClassOption = {
  id: string;
  venue: { name: string };
  subject: Subject;
  level: Level;
  dayOfWeek: DayOfWeek;
  startTime: string;
};

export function EnrollInClassForm({
  studentId,
  availableClasses,
}: {
  studentId: string;
  availableClasses: ClassOption[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(availableClasses[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (availableClasses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Already enrolled in the maximum of 3 classes, or no other classes exist to enroll in.
      </p>
    );
  }

  function handleEnroll() {
    if (!selectedId) return;
    startTransition(async () => {
      const result = await enrollStudentInClass({ studentId, classId: selectedId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Enrolled.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <NativeSelect
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="max-w-xs"
        aria-label="Class to enroll in"
      >
        {availableClasses.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {formatClassLabel(cls)} — {cls.venue.name}
          </option>
        ))}
      </NativeSelect>
      <Button type="button" size="sm" variant="outline" onClick={handleEnroll} disabled={isPending}>
        Enroll
      </Button>
    </div>
  );
}

export function DropEnrollmentButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDrop() {
    startTransition(async () => {
      const result = await dropEnrollment({ enrollmentId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Dropped from class.");
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={handleDrop} disabled={isPending}>
      Drop
    </Button>
  );
}

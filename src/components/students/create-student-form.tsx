"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createStudent } from "@/actions/students";
import { LEVELS } from "@/validations/student";
import { formatClassLabel, formatLevel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Venue = { id: string; name: string };
type ClassOption = { id: string; venue: { name: string }; subject: "ENGLISH" | "MATH" | "SCIENCE"; level: (typeof LEVELS)[number]; dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"; startTime: string };

type FormState = { error?: string } | undefined;

export function CreateStudentForm({ venues, classes }: { venues: Venue[]; classes: ClassOption[] }) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const initialClassId = formData.get("initialClassId");
    const result = await createStudent({
      name: formData.get("name"),
      level: formData.get("level"),
      venueId: formData.get("venueId"),
      guardianName: formData.get("guardianName") || undefined,
      guardianPhone: formData.get("guardianPhone") || undefined,
      initialClassId: initialClassId ? initialClassId : undefined,
    });
    if (!result.success) return { error: result.error };
    router.push(`/students/${result.data.studentId}`);
    return undefined;
  }

  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="level">Level</Label>
          <NativeSelect id="level" name="level" required defaultValue="">
            <option value="" disabled>
              Select level
            </option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {formatLevel(level)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="venueId">Venue</Label>
          <NativeSelect id="venueId" name="venueId" required defaultValue="">
            <option value="" disabled>
              Select venue
            </option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="initialClassId">Enroll in class (optional)</Label>
        <NativeSelect id="initialClassId" name="initialClassId" defaultValue="">
          <option value="">No initial enrollment</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {formatClassLabel(cls)} — {cls.venue.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="guardianName">Guardian name</Label>
          <Input id="guardianName" name="guardianName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardianPhone">Guardian phone</Label>
          <Input id="guardianPhone" name="guardianPhone" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Registering..." : "Register student"}
      </Button>
    </form>
  );
}

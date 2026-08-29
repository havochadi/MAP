"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createClass } from "@/actions/classes";
import { SUBJECTS, DAYS_OF_WEEK } from "@/validations/class";
import { LEVELS } from "@/validations/student";
import { formatSubject, formatLevel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Venue = { id: string; name: string };
type FormState = { error?: string } | undefined;

const DAY_LABELS: Record<(typeof DAYS_OF_WEEK)[number], string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export function CreateClassForm({ venues, defaultVenueId }: { venues: Venue[]; defaultVenueId?: string }) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await createClass({
      venueId: formData.get("venueId"),
      subject: formData.get("subject"),
      level: formData.get("level"),
      dayOfWeek: formData.get("dayOfWeek"),
      startTime: formData.get("startTime"),
      durationMinutes: formData.get("durationMinutes"),
    });
    if (!result.success) return { error: result.error };
    router.push(`/classes/${result.data.classId}`);
    return undefined;
  }

  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="venueId">Venue</Label>
        <NativeSelect id="venueId" name="venueId" required defaultValue={defaultVenueId ?? ""}>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <NativeSelect id="subject" name="subject" required defaultValue="">
            <option value="" disabled>
              Select subject
            </option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {formatSubject(s)}
              </option>
            ))}
          </NativeSelect>
        </div>
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="dayOfWeek">Day</Label>
          <NativeSelect id="dayOfWeek" name="dayOfWeek" required defaultValue="">
            <option value="" disabled>
              Select day
            </option>
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {DAY_LABELS[day]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="durationMinutes">Duration (minutes)</Label>
        <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={90} min={15} max={240} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create class"}
      </Button>
    </form>
  );
}

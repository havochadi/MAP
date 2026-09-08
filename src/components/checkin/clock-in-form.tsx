"use client";

import { useActionState } from "react";
import { clockIn } from "@/actions/coach-shifts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Venue = { id: string; name: string };
type Block = { key: string; label: string };
type FormState = { error?: string } | undefined;

export function ClockInForm({ venues, blocks }: { venues: Venue[]; blocks: Block[] }) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await clockIn({ venueId: formData.get("venueId"), shiftBlock: formData.get("shiftBlock") });
    if (!result.success) return { error: result.error };
    return undefined;
  }
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-5 pt-10 text-center">
      <div>
        <h1 className="text-xl font-semibold">Clock in to start</h1>
        <p className="text-sm text-muted-foreground">Pick your session and where you&apos;re coaching today.</p>
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="shiftBlock">Session</Label>
        <NativeSelect id="shiftBlock" name="shiftBlock" required defaultValue={blocks.length === 1 ? blocks[0].key : ""}>
          {blocks.length !== 1 && (
            <option value="" disabled>
              Select a session
            </option>
          )}
          {blocks.map((b) => (
            <option key={b.key} value={b.key}>
              {b.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="venueId">Location</Label>
        <NativeSelect id="venueId" name="venueId" required defaultValue="">
          <option value="" disabled>
            Select a venue
          </option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white hover:opacity-90"
      >
        {isPending ? "Clocking in…" : "Clock In"}
      </Button>
    </form>
  );
}

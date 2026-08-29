"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createVenue } from "@/actions/venues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = { error?: string } | undefined;

export function CreateVenueForm() {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await createVenue({
      name: formData.get("name"),
      address: formData.get("address") || undefined,
    });
    if (!result.success) return { error: result.error };
    router.push(`/venues/${result.data.venueId}`);
    return undefined;
  }

  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="name">Venue name</Label>
        <Input id="name" name="name" placeholder="e.g. Tampines Centre" required minLength={2} />
      </div>
      <div className="flex-1 space-y-2">
        <Label htmlFor="address">Address (optional)</Label>
        <Input id="address" name="address" />
      </div>
      <div className="space-y-2">
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add venue"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createCoach } from "@/actions/coaches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = { error?: string } | undefined;

export function CreateCoachForm() {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await createCoach({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      phone: formData.get("phone") || undefined,
      isAdmin: formData.get("isAdmin") === "on",
    });
    if (!result.success) return { error: result.error };
    router.push(`/coaches/${result.data.coachId}`);
    return undefined;
  }

  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="flex items-center gap-2">
        <input id="isAdmin" name="isAdmin" type="checkbox" className="size-4 rounded border-input" />
        <Label htmlFor="isAdmin" className="font-normal">
          Grant admin access
        </Label>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create coach"}
      </Button>
    </form>
  );
}

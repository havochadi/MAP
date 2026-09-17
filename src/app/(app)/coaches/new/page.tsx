"use client";

import { useRequireAdmin } from "@/lib/supabase/session";
import { CreateCoachForm } from "@/components/coaches/create-coach-form";

export default function NewCoachPage() {
  const coach = useRequireAdmin();
  if (!coach) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Add a coach</h1>
        <p className="text-sm text-muted-foreground">
          They&apos;ll sign in with this email and temporary password, then can be assigned to classes.
        </p>
      </div>
      <CreateCoachForm />
    </div>
  );
}

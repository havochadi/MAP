import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { CreateCoachForm } from "@/components/coaches/create-coach-form";

export default async function NewCoachPage() {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/");

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

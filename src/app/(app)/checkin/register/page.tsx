import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach } from "@/data/coach-shifts";
import { registerAndCheckInStudent } from "@/actions/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buttonVariants } from "@/components/ui/button";

export default async function RegisterVisitorPage() {
  const coach = await requireCoach();
  const openShift = await getOpenShiftForCoach(coach.id);
  if (!openShift) redirect("/");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Register new visitor</h1>
        <p className="text-sm text-muted-foreground">Checks them in immediately at {openShift.venue.name}.</p>
      </div>
      <RegistrationFlow
        onSubmitAction={registerAndCheckInStudent}
        footer={
          <Link href="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to check-in desk
          </Link>
        }
      />
    </div>
  );
}

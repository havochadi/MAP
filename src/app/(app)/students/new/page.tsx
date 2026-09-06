import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { registerStudent } from "@/actions/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buttonVariants } from "@/components/ui/button";

export default async function NewStudentPage() {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/students");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Register a student</h1>
        <p className="text-sm text-muted-foreground">
          Pre-register a student without checking them in right now (e.g. after a phone enquiry).
        </p>
      </div>
      <RegistrationFlow
        onSubmitAction={registerStudent}
        footer={
          <Link href="/students" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to students
          </Link>
        }
      />
    </div>
  );
}

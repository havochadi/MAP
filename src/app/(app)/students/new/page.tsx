import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getAllClassesForSelect, getAllVenuesWithClassCounts } from "@/data/classes";
import { CreateStudentForm } from "@/components/students/create-student-form";

export default async function NewStudentPage() {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/students");

  const [venues, classes] = await Promise.all([getAllVenuesWithClassCounts(), getAllClassesForSelect()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Register a student</h1>
        <p className="text-sm text-muted-foreground">Add a new student and optionally enroll them in a class.</p>
      </div>
      <CreateStudentForm venues={venues} classes={classes} />
    </div>
  );
}

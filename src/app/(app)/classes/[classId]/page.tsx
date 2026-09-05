import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { canAccessClass } from "@/lib/authorization";
import { getClassDetail } from "@/data/classes";
import { getAllCoachesForSelect } from "@/data/coaches";
import { formatClassLabel, getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AssignCoachForm } from "@/components/classes/assign-coach-form";

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const coach = await requireCoach();
  if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) redirect("/");

  const cls = await getClassDetail(classId);
  if (!cls) notFound();

  const assignedCoaches = cls.assignments.map((a) => ({ id: a.coach.id, name: a.coach.name }));
  const availableCoaches = coach.isAdmin
    ? (await getAllCoachesForSelect()).filter((c) => !assignedCoaches.some((a) => a.id === c.id))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{formatClassLabel(cls)}</h1>
        <p className="text-sm text-muted-foreground">{cls.venue.name}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/classes/${classId}/attendance`} className={buttonVariants()}>
          Take attendance
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Coaches</h2>
        {coach.isAdmin ? (
          <AssignCoachForm classId={classId} assignedCoaches={assignedCoaches} availableCoaches={availableCoaches} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {cls.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coaches assigned yet.</p>
            ) : (
              cls.assignments.map((a) => (
                <Link
                  key={a.coach.id}
                  href={`/coaches/${a.coach.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm hover:bg-muted/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(a.coach.name)}</AvatarFallback>
                  </Avatar>
                  {a.coach.name}
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Students ({cls.enrollments.length})</h2>
        {cls.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {cls.enrollments.map((e) => (
                <Link
                  key={e.id}
                  href={`/students/${e.student.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(e.student.name)}</AvatarFallback>
                  </Avatar>
                  {e.student.name}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

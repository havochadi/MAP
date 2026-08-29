import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getCoachProfile } from "@/data/coaches";
import { formatClassLabel, getInitials } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = await params;
  const currentCoach = await requireCoach();
  if (!currentCoach.isAdmin && currentCoach.id !== coachId) redirect(`/coaches/${currentCoach.id}`);

  const data = await getCoachProfile(coachId);
  if (!data) notFound();
  const { coach, sessionsCount, studentCount } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{coach.name}</h1>
            {coach.isAdmin && <Badge>Admin</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{coach.email}</p>
          {coach.phone && <p className="text-sm text-muted-foreground">{coach.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">{coach.assignments.length}</p>
            <p className="text-xs text-muted-foreground">Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">{studentCount}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">{sessionsCount}</p>
            <p className="text-xs text-muted-foreground">Sessions taken</p>
          </CardContent>
        </Card>
      </div>

      {coach.trainingCompletedAt && (
        <p className="text-sm text-muted-foreground">
          Training completed {formatDateForDisplay(coach.trainingCompletedAt.toISOString().slice(0, 10))}
        </p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Classes</h2>
        {coach.assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not assigned to any classes yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {coach.assignments.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/classes/${a.classId}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{formatClassLabel(a.class)}</p>
                    <p className="text-xs text-muted-foreground">{a.class.venue.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.class._count.enrollments} students</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

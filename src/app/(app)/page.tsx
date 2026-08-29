import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { getClassesForCoach } from "@/data/classes";
import { formatClassLabel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const coach = await requireCoach();
  const classes = await getClassesForCoach(coach.id, coach.isAdmin);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {coach.isAdmin ? "All classes" : "My classes"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {coach.isAdmin
            ? "You have admin access to every class across all venues."
            : "Tap a class to take today's attendance."}
        </p>
      </div>

      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You aren&apos;t assigned to any classes yet. Ask an admin to assign you to one.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {classes.map((cls) => {
            const taken = cls.todaySession?.submittedAt != null;
            return (
              <li key={cls.id}>
                <Link href={`/classes/${cls.id}/attendance`} className="block">
                  <Card className="h-full transition-colors hover:bg-muted/40">
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{formatClassLabel(cls)}</p>
                          <p className="text-sm text-muted-foreground">{cls.venue.name}</p>
                        </div>
                        <Badge variant={taken ? "secondary" : "default"}>
                          {taken ? "Attendance taken" : "Take attendance"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{cls.studentCount} students enrolled</p>
                      {cls.todayTopic && (
                        <p className="text-xs font-medium text-primary">Today: {cls.todayTopic.title}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {coach.isAdmin && (
        <Link href="/venues" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
          Manage venues &amp; classes
        </Link>
      )}
    </div>
  );
}

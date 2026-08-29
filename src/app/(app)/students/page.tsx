import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { getStudentsForCoach } from "@/data/students";
import { formatLevel, getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function StudentsPage() {
  const coach = await requireCoach();
  const students = await getStudentsForCoach(coach.id, coach.isAdmin);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {coach.isAdmin ? "Every student across all venues." : "Students in your classes."}
          </p>
        </div>
        {coach.isAdmin && (
          <Link href="/students/new" className={buttonVariants()}>
            Register student
          </Link>
        )}
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students to show yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                href={`/students/${student.id}`}
                className={cn("flex items-center gap-3 px-4 py-3 hover:bg-muted/50")}
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLevel(student.level)} · {student.venue.name}
                  </p>
                </div>
                {student.status !== "ACTIVE" && (
                  <Badge variant={student.status === "REMOVED" ? "destructive" : "secondary"}>{student.status}</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

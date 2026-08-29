import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { canAccessClass } from "@/lib/authorization";
import { getClassProgress } from "@/data/progress";
import { formatClassLabel } from "@/lib/format";
import { getSingaporeTodayString } from "@/lib/dates";
import { ProgressChecklist } from "@/components/progress/progress-checklist";

export default async function ClassProgressPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const coach = await requireCoach();
  if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) redirect("/");

  const data = await getClassProgress(classId);
  if (!data) notFound();

  const today = getSingaporeTodayString();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{formatClassLabel(data.class)}</h1>
        <p className="text-sm text-muted-foreground">{data.class.venue.name} · Curriculum progress</p>
      </div>
      {data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No curriculum topics have been added yet for this subject and level.
        </p>
      ) : (
        <ProgressChecklist classId={classId} items={data.items} today={today} />
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getCoachProfile } from "@/data/coaches";
import { getShiftHistoryForCoach } from "@/data/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ShiftHistory } from "@/components/coach/shift-history";

export default async function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = await params;
  const currentCoach = await requireCoach();
  if (!currentCoach.isAdmin && currentCoach.id !== coachId) redirect(`/coaches/${currentCoach.id}`);

  const data = await getCoachProfile(coachId);
  if (!data) notFound();
  const { coach } = data;

  const shifts = await getShiftHistoryForCoach(coachId);
  const approvedShifts = shifts.filter((s) => s.status === "APPROVED");
  const approvedHours = approvedShifts.reduce((sum, s) => sum + computeShiftHours(s), 0);
  const approvedPay = approvedShifts.reduce((sum, s) => sum + computeShiftPay(s), 0);

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

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">{approvedHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Approved hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">${approvedPay.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Approved pay</p>
          </CardContent>
        </Card>
      </div>

      {currentCoach.isAdmin && (
        <Link href="/payroll" className={buttonVariants({ variant: "outline" })}>
          Go to payroll
        </Link>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Shifts</h2>
        <ShiftHistory shifts={shifts} canReopen={currentCoach.isAdmin} />
      </div>
    </div>
  );
}

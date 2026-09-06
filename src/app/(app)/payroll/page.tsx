import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getPendingShifts, getPaySummary } from "@/data/coach-shifts";
import { getSingaporeTodayString } from "@/lib/dates";
import { summarizePayByCoach } from "@/lib/pay";
import { PendingShiftsTable } from "@/components/payroll/pending-shifts-table";
import { PaySummary } from "@/components/payroll/pay-summary";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/");

  const pending = await getPendingShifts();

  const today = getSingaporeTodayString();
  const { from = `${today.slice(0, 7)}-01`, to = today } = await searchParams;
  const approvedShifts = await getPaySummary(from, to);
  const rows = summarizePayByCoach(approvedShifts);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Review clocked shifts and see coaching pay.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pending review</h2>
        <PendingShiftsTable shifts={pending} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pay summary</h2>
        <PaySummary from={from} to={to} rows={rows} />
      </div>
    </div>
  );
}

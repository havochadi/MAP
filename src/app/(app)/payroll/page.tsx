"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getPendingShifts, getPaySummary } from "@/lib/api/coach-shifts";
import { getSingaporeTodayString } from "@/lib/dates";
import { summarizePayByCoach } from "@/lib/pay";
import { PendingShiftsTable } from "@/components/payroll/pending-shifts-table";
import { PaySummary } from "@/components/payroll/pay-summary";

type PendingShifts = Awaited<ReturnType<typeof getPendingShifts>>;
type ApprovedShifts = Awaited<ReturnType<typeof getPaySummary>>;

export default function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const coach = useRequireAdmin();
  const { from: fromParam, to: toParam } = use(searchParams);
  const today = getSingaporeTodayString();
  const from = fromParam ?? `${today.slice(0, 7)}-01`;
  const to = toParam ?? today;

  const [pending, setPending] = useState<PendingShifts | undefined>(undefined);
  const [approvedShifts, setApprovedShifts] = useState<ApprovedShifts | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;
  const latestPendingRequestRef = useRef(0);
  const latestPaySummaryRequestRef = useRef(0);

  const refreshPending = useCallback(() => {
    const requestId = ++latestPendingRequestRef.current;
    getPendingShifts()
      .then((data) => {
        if (latestPendingRequestRef.current === requestId) setPending(data);
      })
      .catch(() => {
        if (latestPendingRequestRef.current === requestId) setError("Could not load pending shifts.");
      });
  }, []);

  const refreshApprovedShifts = useCallback(() => {
    const requestId = ++latestPaySummaryRequestRef.current;
    getPaySummary(from, to)
      .then((data) => {
        if (latestPaySummaryRequestRef.current === requestId) setApprovedShifts(data);
      })
      .catch(() => {
        if (latestPaySummaryRequestRef.current === requestId) setError("Could not load pay summary.");
      });
  }, [from, to]);

  useEffect(() => {
    if (!ready) return;
    refreshPending();
  }, [ready, refreshPending]);

  useEffect(() => {
    if (!ready) return;
    setError(null);
    refreshApprovedShifts();
  }, [ready, from, to, refreshApprovedShifts]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (pending === undefined || approvedShifts === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const rows = summarizePayByCoach(approvedShifts);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Review clocked shifts and see coaching pay.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pending review</h2>
        <PendingShiftsTable
          shifts={pending}
          adminId={coach.id}
          onChanged={() => {
            refreshPending();
            refreshApprovedShifts();
          }}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pay summary</h2>
        <PaySummary from={from} to={to} rows={rows} />
      </div>
    </div>
  );
}

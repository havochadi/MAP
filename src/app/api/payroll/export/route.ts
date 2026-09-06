import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/session";
import { getPaySummary } from "@/data/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { formatDateForDisplay } from "@/lib/dates";

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const coach = await requireCoach().catch(() => null);
  if (!coach?.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to are required." }, { status: 400 });

  const shifts = await getPaySummary(from, to);

  const header = "Coach,Date,Venue,Clock In,Clock Out,Hours,Pay";
  const rows = shifts.map((shift) => {
    const hours = computeShiftHours(shift).toFixed(2);
    const pay = computeShiftPay(shift).toFixed(2);
    const clockIn = shift.clockInAt.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
    const clockOut = shift.clockOutAt
      ? shift.clockOutAt.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })
      : "";
    return [csvField(shift.coach.name), csvField(formatDateForDisplay(shift.shiftDate)), csvField(shift.venue.name), csvField(clockIn), csvField(clockOut), hours, pay].join(",");
  });

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payroll-${from}-to-${to}.csv"`,
    },
  });
}

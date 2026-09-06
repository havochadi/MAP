"use client";

import { useRouter, usePathname } from "next/navigation";
import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { HOURLY_RATE, type CoachPaySummaryRow } from "@/lib/pay";

export function PaySummary({ from, to, rows }: { from: string; to: string; rows: CoachPaySummaryRow[] }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      from: String(formData.get("from")),
      to: String(formData.get("to")),
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Update
        </button>
        <a href={`/api/payroll/export?from=${from}&to=${to}`} className={buttonVariants({ variant: "outline" })}>
          Download CSV
        </a>
      </form>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No approved shifts in this range.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Pay (${HOURLY_RATE}/hr)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.coachId}>
                <TableCell>{row.coachName}</TableCell>
                <TableCell>{row.hours.toFixed(2)}</TableCell>
                <TableCell>${row.pay.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

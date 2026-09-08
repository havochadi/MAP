"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveShift, rejectShift } from "@/actions/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { formatDateForDisplay } from "@/lib/dates";
import { SHIFT_BLOCKS, type ShiftBlockKey } from "@/lib/shift-blocks";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { EditShiftDialog } from "@/components/coach/edit-shift-dialog";

type Shift = {
  id: string;
  coach: { name: string };
  venue: { name: string };
  shiftDate: string;
  shiftBlock: ShiftBlockKey;
  clockInAt: Date;
  clockOutAt: Date | null;
};

export function PendingShiftsTable({ shifts }: { shifts: Shift[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove(shiftId: string) {
    startTransition(async () => {
      const result = await approveShift({ shiftId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Approved.");
      router.refresh();
    });
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Coach</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Session</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Pay</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shifts.map((shift) => (
          <TableRow key={shift.id}>
            <TableCell>{shift.coach.name}</TableCell>
            <TableCell>{shift.venue.name}</TableCell>
            <TableCell>{formatDateForDisplay(shift.shiftDate)}</TableCell>
            <TableCell>{SHIFT_BLOCKS[shift.shiftBlock].label}</TableCell>
            <TableCell>{computeShiftHours(shift).toFixed(2)}</TableCell>
            <TableCell>${computeShiftPay(shift).toFixed(2)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <EditShiftDialog shift={shift} />
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleApprove(shift.id)}>
                  Approve
                </Button>
                <RejectShiftDialog shiftId={shift.id} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RejectShiftDialog({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await rejectShift({ shiftId, reviewNote: formData.get("reviewNote") });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Rejected.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive" />}>Reject</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject shift</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reviewNote">Reason</Label>
            <Textarea id="reviewNote" name="reviewNote" required minLength={1} />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              Confirm reject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

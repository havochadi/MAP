"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { editShift } from "@/actions/coach-shifts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

type Shift = { id: string; clockInAt: Date; clockOutAt: Date | null };

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditShiftDialog({ shift }: { shift: Shift }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await editShift({
        shiftId: shift.id,
        clockInAt: formData.get("clockInAt"),
        clockOutAt: formData.get("clockOutAt") || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Shift updated.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit shift</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`clockInAt-${shift.id}`}>Clock in</Label>
            <Input
              id={`clockInAt-${shift.id}`}
              name="clockInAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(shift.clockInAt)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`clockOutAt-${shift.id}`}>Clock out</Label>
            <Input
              id={`clockOutAt-${shift.id}`}
              name="clockOutAt"
              type="datetime-local"
              defaultValue={shift.clockOutAt ? toDatetimeLocal(shift.clockOutAt) : ""}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

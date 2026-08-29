"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { assignCoachToClass, unassignCoachFromClass } from "@/actions/coaches";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Coach = { id: string; name: string };

export function AssignCoachForm({
  classId,
  assignedCoaches,
  availableCoaches,
}: {
  classId: string;
  assignedCoaches: Coach[];
  availableCoaches: Coach[];
}) {
  const [assigned, setAssigned] = useState(assignedCoaches);
  const [available, setAvailable] = useState(availableCoaches);
  const [selectedId, setSelectedId] = useState(availableCoaches[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    if (!selectedId) return;
    const coach = available.find((c) => c.id === selectedId);
    if (!coach) return;
    startTransition(async () => {
      const result = await assignCoachToClass({ coachId: selectedId, classId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAssigned((prev) => [...prev, coach]);
      setAvailable((prev) => prev.filter((c) => c.id !== selectedId));
      setSelectedId("");
    });
  }

  function handleRemove(coachId: string) {
    const coach = assigned.find((c) => c.id === coachId);
    if (!coach) return;
    startTransition(async () => {
      const result = await unassignCoachFromClass({ coachId, classId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAssigned((prev) => prev.filter((c) => c.id !== coachId));
      setAvailable((prev) => [...prev, coach]);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {assigned.length === 0 && <p className="text-sm text-muted-foreground">No coaches assigned yet.</p>}
        {assigned.map((coach) => (
          <span
            key={coach.id}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm"
          >
            <Avatar size="sm">
              <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
            </Avatar>
            {coach.name}
            <button
              type="button"
              onClick={() => handleRemove(coach.id)}
              disabled={isPending}
              aria-label={`Remove ${coach.name} from this class`}
              className="text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <NativeSelect
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="max-w-xs"
            aria-label="Coach to assign"
          >
            {available.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name}
              </option>
            ))}
          </NativeSelect>
          <Button type="button" size="sm" variant="outline" onClick={handleAssign} disabled={isPending}>
            Assign
          </Button>
        </div>
      )}
    </div>
  );
}

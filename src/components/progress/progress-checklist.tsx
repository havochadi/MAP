"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Circle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markTopicCompleted, markTopicPlanned } from "@/actions/progress";
import { formatDateForDisplay } from "@/lib/dates";

type ProgressStatus = "PLANNED" | "COMPLETED";
type Item = {
  topic: { id: string; title: string; strand: string | null; order: number };
  progress: { status: ProgressStatus; plannedDate: string; completedDate: string | null } | null;
};

export function ProgressChecklist({ classId, items, today }: { classId: string; items: Item[]; today: string }) {
  const [localItems, setLocalItems] = useState(items);
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleComplete(topicId: string) {
    setPendingId(topicId);
    startTransition(async () => {
      const result = await markTopicCompleted({ classId, curriculumTopicId: topicId, completedDate: today });
      setPendingId(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLocalItems((prev) =>
        prev.map((item) =>
          item.topic.id === topicId
            ? { ...item, progress: { status: "COMPLETED", plannedDate: item.progress?.plannedDate ?? today, completedDate: today } }
            : item,
        ),
      );
      toast.success("Marked as taught.");
    });
  }

  function handlePlanToday(topicId: string) {
    setPendingId(topicId);
    startTransition(async () => {
      const result = await markTopicPlanned({ classId, curriculumTopicId: topicId, plannedDate: today });
      setPendingId(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLocalItems((prev) =>
        prev.map((item) =>
          item.topic.id === topicId ? { ...item, progress: { status: "PLANNED", plannedDate: today, completedDate: null } } : item,
        ),
      );
    });
  }

  return (
    <ul className="space-y-2">
      {localItems.map(({ topic, progress }) => {
        const isCompleted = progress?.status === "COMPLETED";
        const isDueToday = progress?.status === "PLANNED" && progress.plannedDate === today;
        const isPending = pendingId === topic.id;

        return (
          <li key={topic.id} className="flex items-center gap-3 rounded-lg border p-3">
            <button
              type="button"
              onClick={() => !isCompleted && handleComplete(topic.id)}
              disabled={isCompleted || isPending}
              aria-label={isCompleted ? `${topic.title} completed` : `Mark ${topic.title} as taught`}
              className="flex size-6 shrink-0 items-center justify-center rounded-full border disabled:opacity-100"
            >
              {isCompleted ? (
                <Check className="size-4 text-green-600" aria-hidden="true" />
              ) : (
                <Circle className="size-3 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${isCompleted ? "text-muted-foreground line-through" : ""}`}>
                {topic.title}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {topic.strand && <span>{topic.strand}</span>}
                {isCompleted && progress?.completedDate && <span>Taught {formatDateForDisplay(progress.completedDate)}</span>}
                {!isCompleted && progress && <span>Planned for {formatDateForDisplay(progress.plannedDate)}</span>}
                {!isCompleted && !progress && <span>Not yet planned</span>}
              </div>
            </div>
            {isDueToday && <Badge>Due today</Badge>}
            {!isCompleted && !isDueToday && (
              <Button type="button" variant="outline" size="sm" onClick={() => handlePlanToday(topic.id)} disabled={isPending}>
                <CalendarClock className="size-3.5" aria-hidden="true" />
                Plan for today
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

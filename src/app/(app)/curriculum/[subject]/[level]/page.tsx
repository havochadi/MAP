"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useRequireCoach } from "@/lib/supabase/session";
import { getTopics } from "@/lib/api/curriculum";
import { formatSubject, formatLevel, parseTeachingSteps, parseWorkedExamples } from "@/lib/format";
import { parseDiagramSpec } from "@/lib/diagrams";
import { TopicDiagram } from "@/components/curriculum/topic-diagram";
import { SUBJECTS } from "@/validations/class";
import { LEVELS } from "@/validations/student";
import type { Enums } from "@/lib/supabase/database.types";

type Subject = Enums<"Subject">;
type Level = Enums<"Level">;
type Topic = Awaited<ReturnType<typeof getTopics>>[number];

export default function CurriculumTopicsPage({
  params,
}: {
  params: Promise<{ subject: string; level: string }>;
}) {
  // Next 15 still hands Client Component pages a Promise-shaped params prop
  // (only Server Components may `await` it directly) — React's `use()` is
  // the client-side equivalent, and unlike other hooks it's allowed to run
  // before an early return, which is what makes the notFound() call below
  // (after every hook in this component) safe under the Rules of Hooks.
  const { subject: subjectParam, level: levelParam } = use(params);
  const subjectUpper = subjectParam.toUpperCase();
  const levelUpper = levelParam.toUpperCase();
  const paramsValid = (SUBJECTS as readonly string[]).includes(subjectUpper) && (LEVELS as readonly string[]).includes(levelUpper);
  const subject = paramsValid ? (subjectUpper as Subject) : null;
  const level = paramsValid ? (levelUpper as Level) : null;

  const coach = useRequireCoach();
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach && paramsValid;

  useEffect(() => {
    if (!ready || !subject || !level) return;
    let cancelled = false;
    getTopics(subject, level)
      .then((data) => {
        if (!cancelled) setTopics(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load topics.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, subject, level]);

  if (!paramsValid || !subject || !level) notFound();
  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (topics === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (topics.length === 0) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {formatSubject(subject)} — {formatLevel(level)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Suggested teaching sequence, based on the MOE syllabus. Tap a topic for the concept explained, worked
          examples, and a step-by-step teaching guide.
        </p>
      </div>
      <ol className="space-y-2">
        {topics.map((topic, i) => {
          const steps = parseTeachingSteps(topic.teachingSteps);
          const examples = parseWorkedExamples(topic.workedExamples);
          const diagram = parseDiagramSpec(topic.diagramSpec);
          const hasGuide = !!topic.conceptExplanation || examples.length > 0 || steps.length > 0 || !!diagram;

          return (
            <li key={topic.id} className="rounded-lg border">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-3 p-3 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{topic.title}</p>
                    {topic.strand && <p className="text-xs text-muted-foreground">{topic.strand}</p>}
                    {topic.description && <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>}
                  </div>
                  {hasGuide && (
                    <ChevronDown
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                </summary>

                {topic.conceptExplanation && (
                  <div className="border-t px-3 py-3 pl-12">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Understanding this topic</p>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{topic.conceptExplanation}</p>
                  </div>
                )}

                {diagram && (
                  <div className="border-t px-3 py-3 pl-12">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Diagram</p>
                    <TopicDiagram spec={diagram} />
                  </div>
                )}

                {examples.length > 0 && (
                  <div className="border-t px-3 py-3 pl-12">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Worked examples</p>
                    <div className="space-y-3">
                      {examples.map((example, ei) => (
                        <div key={ei} className="rounded-md bg-muted/40 p-3">
                          <p className="text-sm font-medium">{example.problem}</p>
                          <ol className="mt-2 space-y-1">
                            {example.solution.map((step, si) => (
                              <li key={si} className="flex gap-2 text-sm text-muted-foreground">
                                <span className="shrink-0">{si + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {steps.length > 0 && (
                  <div className="border-t px-3 py-3 pl-12">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">How to teach this, step by step</p>
                    <ol className="space-y-2">
                      {steps.map((step, si) => (
                        <li key={si} className="flex gap-2 text-sm">
                          <span className="shrink-0 font-medium text-muted-foreground">{si + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

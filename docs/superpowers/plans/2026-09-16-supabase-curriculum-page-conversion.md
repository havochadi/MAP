# Supabase Curriculum Pages Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `(app)/curriculum/page.tsx` and `(app)/curriculum/[subject]/[level]/page.tsx` to Plan 2a's Supabase-based client-side data layer, following the pattern the venues-page plan already established — and introduce that pattern's first dynamic-route-param variant.

**Architecture:** Both pages follow the same shape as `venues/page.tsx` (already converted, already proven): `useRequireCoach()` in place of the old server-side session check (curriculum has no admin-gating, unlike venues — "open to any coach," by design, unchanged), a plain `useEffect`/`useState` pair for the data fetch (still no shared hook — this is only the 2nd/3rd page, still too early to extract one), and the same `error`/`loading`/`empty-or-list` render-branch ordering. The detail page (`curriculum/[subject]/[level]/page.tsx`) is the first page in this plan's lineage with a dynamic route segment: in Next 15, a Client Component page still receives `params` as a `Promise`, but can't `await` it (Client Components can't be async functions) — it uses React 19's `use()` hook instead, called unconditionally alongside every other hook, with the `notFound()` call for invalid params moved to strictly *after* all hooks (satisfying the Rules of Hooks regardless of whether it throws). Both pages also drop the `export const dynamic = "force-dynamic";` the venues-page plan added to them — once they're real Client Components with no server-side data fetching, keeping that annotation would force needless per-request server rendering of what should be a static shell (confirmed empirically: without it, `/curriculum` builds as `○` static, matching `/venues` and `/login`).

**A consequence already accepted, not new to this plan:** these two pages currently show their *original, correct* content (the `force-dynamic` fix already applied kept their old NextAuth-based rendering working). Converting them moves them from "correctly showing old content" to "correctly showing new content via the new auth/data path" — a pure improvement, not a new regression. No other page's behavior changes.

**Tech Stack:** Next.js App Router, React 19's `use()` hook (first use of it in this codebase), `useEffect`/`useState` — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as the venues-page plan (which this plan is a direct continuation of); no new architectural ground.

## Global Constraints

- No UI redesign — every visual element on both curriculum pages stays pixel-identical; only the underlying session/data mechanism changes, and only the loading/error states are new (the same unavoidable, already-accepted consequence of moving from a blocking server fetch to a client fetch that `venues/page.tsx` already introduced).
- `src/lib/session.ts` and `src/data/curriculum.ts` are left completely untouched — dead code once these pages stop importing them, but deletion is Plan 2d's job.
- Reuse Plan 2a's existing functions verbatim: `useRequireCoach` (`src/lib/supabase/session.tsx`), `getSubjectLevelCombos` and `getTopics` (`src/lib/api/curriculum.ts`). Do not modify their signatures or behavior.
- `notFound()` (from `next/navigation`) must still be called for both invalid route params and an empty topics list, matching the original page's behavior exactly — it works the same way in a Client Component as a Server Component (confirmed: it's a documented, supported call in both), but the *ordering* relative to hooks matters (see Architecture above) and must be preserved exactly as written in this plan's code.
- No new test framework or script — this is UI/routing behavior. Verification is manual: run the dev server and exercise both pages by hand (browser automation is currently broken in this environment due to an unrelated extension conflict — see project memory; static verification via `tsc`/`eslint`/`next build` plus careful manual reasoning about the code substitutes where live interaction isn't possible).

---

## File Structure

- Modify: `src/app/(app)/curriculum/page.tsx` — convert to a Client Component using `useRequireCoach()` + `useEffect`/`useState`, remove `force-dynamic`
- Modify: `src/app/(app)/curriculum/[subject]/[level]/page.tsx` — same, plus `use(params)` for the dynamic route segment, remove `force-dynamic`

## Task 1: Convert both curriculum pages

**Files:**
- Modify: `src/app/(app)/curriculum/page.tsx`
- Modify: `src/app/(app)/curriculum/[subject]/[level]/page.tsx`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a — do not modify): `useRequireCoach(): CurrentCoach | null` from `@/lib/supabase/session`; `getSubjectLevelCombos(): Promise<Array<{subject: Subject; level: Level}>>` and `getTopics(subject: Subject, level: Level): Promise<Topic[]>` from `@/lib/api/curriculum`, where `Subject`/`Level` are `Enums<"Subject">`/`Enums<"Level">` from `@/lib/supabase/database.types`.
- Produces: nothing new — this task only rewires existing UI to existing functions.

- [ ] **Step 1: Convert the curriculum index page**

Replace the entire contents of `src/app/(app)/curriculum/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireCoach } from "@/lib/supabase/session";
import { getSubjectLevelCombos } from "@/lib/api/curriculum";
import { formatSubject, formatLevel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

type Combo = Awaited<ReturnType<typeof getSubjectLevelCombos>>[number];

export default function CurriculumIndexPage() {
  const coach = useRequireCoach();
  const [combos, setCombos] = useState<Combo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getSubjectLevelCombos()
      .then((data) => {
        if (!cancelled) setCombos(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load curriculum.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (combos === null) {
    return <p className="text-sm text-muted-foreground">Loading curriculum…</p>;
  }

  const bySubject = new Map<Combo["subject"], Combo[]>();
  for (const c of combos) {
    const list = bySubject.get(c.subject) ?? [];
    list.push(c);
    bySubject.set(c.subject, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Curriculum guide</h1>
        <p className="text-sm text-muted-foreground">
          Browse what to teach for each subject and level, based on the MOE syllabus. Open to any coach.
        </p>
      </div>
      {[...bySubject.entries()].map(([subject, levels]) => (
        <div key={subject} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{formatSubject(subject)}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {levels.map((c) => (
              <Link key={`${c.subject}-${c.level}`} href={`/curriculum/${c.subject.toLowerCase()}/${c.level.toLowerCase()}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="py-3 text-center text-sm font-medium">{formatLevel(c.level)}</CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

Note: `Combo["subject"]`/`Combo["subject"], Combo[]` is used for the `Map` type instead of importing a separate `Subject` type — this infers the type directly from `getSubjectLevelCombos`'s own return shape, avoiding any dependency on `@/generated/prisma/client` (the old, Prisma-generated types this page previously imported, which the end-state architecture treats as build/schema-time only, not a runtime dependency).

- [ ] **Step 2: Convert the curriculum detail page**

Replace the entire contents of `src/app/(app)/curriculum/[subject]/[level]/page.tsx` with:

```tsx
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
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0). This is the primary check for the `use(params)` pattern's correctness — Next.js generates strict page-prop types during the TypeScript pass (via `.next/types`) that validate the default export's prop signature against what the framework expects for this exact route; a wrong `params` shape fails here, not silently.

Run: `npx eslint "src/app/(app)/curriculum/page.tsx" "src/app/(app)/curriculum/[subject]/[level]/page.tsx"`
Expected: clean, 0 problems.

- [ ] **Step 4: Confirm the app builds, and confirm the staticness changed as expected**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds. In the route summary, `/curriculum` should now show as `○` (static) — confirming it has zero remaining server-side dependencies now that `force-dynamic` is gone, matching `/venues` and `/login`. `/curriculum/[subject]/[level]` will show as `ƒ` (dynamic) — this is expected and fine for a route with a dynamic segment and no `generateStaticParams()`, not a regression (the old `force-dynamic`-forced version was also effectively per-request; this one is per-request because it's a parameterized route with no static param list, a different but equally correct reason).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, sign in via the "Coach" or "Admin" quick-login button on `/login` (both work — curriculum has no admin gating), then:

1. Navigate to `http://localhost:3000/curriculum`. Expected: shows "Loading curriculum…" briefly, then the real subject/level grid (same layout as before).
2. Click into any subject/level card (e.g. Math P3). Expected: navigates to `/curriculum/math/p3` (or similar), shows "Loading…" briefly, then the real topic list with working expand/collapse `<details>` sections.
3. Navigate directly to an invalid URL, e.g. `http://localhost:3000/curriculum/invalidsubject/p3`. Expected: Next's not-found page (this exercises the `notFound()` call for invalid params — confirm it doesn't crash or show a raw error instead).
4. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), perform these checks by hand if a browser is available, or rely on the Step 3/4 static verification and note in the report exactly which of the 3 checks above could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/curriculum/page.tsx" "src/app/(app)/curriculum/[subject]/[level]/page.tsx"
git status
git commit -m "feat: convert curriculum pages to Supabase session/data layer"
```

The `git status` check confirms only these 2 files are staged.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `git diff --stat ebb0d9d..HEAD -- src/lib/session.ts src/data/curriculum.ts` (substitute the actual commit this plan branched from if different — `ebb0d9d` is the previous plan's final commit, `HEAD` as of this plan's writing) — empty. These files must be byte-identical to before this plan.
- [ ] Step 3: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds with `/curriculum` showing `○`.

**Next Plan 2b task** (not part of this plan — separately planned): `/students` (admin-gated list with more fields — the next step up in complexity from curriculum's no-gating case), then the remaining detail pages with dynamic params (`/venues/[venueId]`, `/classes/[classId]`, `/coaches/[coachId]`, `/students/[studentId]`), which can now directly reuse this plan's `use(params)` pattern as a proven template.

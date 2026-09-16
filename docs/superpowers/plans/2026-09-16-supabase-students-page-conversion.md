# Supabase Students Page Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `(app)/students/page.tsx` (the students list) to Plan 2a's Supabase-based client-side data layer, following the exact pattern the venues-page plan already established.

**Architecture:** Same shape as `venues/page.tsx`: `useRequireAdmin()` in place of the old `requireCoach()` + `if (!coach.isAdmin) redirect("/")` pair, a plain `useEffect`/`useState` pair for the data fetch, the same `error`/`loading`/`empty-or-list` render-branch ordering. No new technical pattern this time — this is a mechanical repetition of the proven template, not a design task.

**A deliberate, non-obvious decision made before writing this plan, not a default:** the old page's UI copy already has a branch for non-admin coaches ("Students in your classes.") that's currently dead code — the page's own `redirect` blocks every non-admin before that branch could ever render. Plan 2a's new `getStudentsForCoach()` also dropped its old `(coachId, isAdmin)` parameters entirely — it now returns whatever RLS permits for the current session, which per the migration spec's own design is "admin sees everyone, an assigned coach sees their own students" — meaning the *underlying data layer* would already support opening this page to non-admin coaches. **This plan does not do that.** Confirmed with the user directly: keep the page's gating behavior byte-for-byte identical (admin-only, via `useRequireAdmin()`), because opening it to coaches is a real, separate product decision that deserves its own deliberate choice, not something to fold silently into a "swap the data source" mechanical conversion. The now-still-dead non-admin copy branch is left exactly as it is in the code (unchanged, still unreachable) — not cleaned up, since that's unrelated to this task.

**Tech Stack:** Next.js App Router, React `useEffect`/`useState` — no new dependencies, no new patterns.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as the venues-page plan (which this plan is a direct continuation of); no new architectural ground. Note the spec's own RLS table explicitly describes the "admin + assigned coaches" access model this plan's gating decision above deliberately doesn't yet expose at the page level.

## Global Constraints

- No UI redesign — every visual element on the students page stays pixel-identical; only the underlying session/data mechanism changes, plus the same unavoidable loading/error states every prior page conversion has added.
- Gating stays admin-only — use `useRequireAdmin()`, not `useRequireCoach()`. This is a deliberate scope boundary (see Architecture above), not an oversight — do not "fix" it to open the page to coaches as part of this task.
- `src/lib/session.ts` and `src/data/students.ts` are left completely untouched — dead code once this page stops importing them, but deletion is Plan 2d's job.
- Reuse Plan 2a's existing function verbatim: `useRequireAdmin` (`src/lib/supabase/session.tsx`), `getStudentsForCoach()` (`src/lib/api/students.ts` — note it now takes **no arguments**, a real signature change from the old `(coachId, isAdmin)` version; do not pass arguments to it). Do not modify their signatures or behavior.
- This task touches only the students *list* page — `/students/new` and `/students/[studentId]` are separate pages, out of scope, to be converted in their own later tasks (matching how venues' list and detail pages were kept separate).
- No new test framework or script — this is UI/routing behavior. Verification is manual: run the dev server and exercise the page by hand (browser automation is currently broken in this environment due to an unrelated extension conflict — see project memory; static verification via `tsc`/`eslint`/`next build` substitutes where live interaction isn't possible).

---

## File Structure

- Modify: `src/app/(app)/students/page.tsx` — convert to a Client Component using `useRequireAdmin()` + `useEffect`/`useState`

## Task 1: Convert the students list page

**Files:**
- Modify: `src/app/(app)/students/page.tsx`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a — do not modify): `useRequireAdmin(): CurrentCoach | null` from `@/lib/supabase/session`; `getStudentsForCoach(): Promise<Student[]>` (no arguments) from `@/lib/api/students`.
- Produces: nothing new — this task only rewires existing UI to an existing function.

- [ ] **Step 1: Convert the students page**

Replace the entire contents of `src/app/(app)/students/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getStudentsForCoach } from "@/lib/api/students";
import { formatLevel, getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Student = Awaited<ReturnType<typeof getStudentsForCoach>>[number];

export default function StudentsPage() {
  const coach = useRequireAdmin();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getStudentsForCoach()
      .then((data) => {
        if (!cancelled) setStudents(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load students.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {coach.isAdmin ? "Every student across all venues." : "Students in your classes."}
          </p>
        </div>
        {coach.isAdmin && (
          <Link href="/students/new" className={buttonVariants()}>
            Register student
          </Link>
        )}
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : students === null ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students to show yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                href={`/students/${student.id}`}
                className={cn("flex items-center gap-3 px-4 py-3 hover:bg-muted/50")}
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLevel(student.level)} · {student.schoolName}
                  </p>
                </div>
                {student.status !== "ACTIVE" && (
                  <Badge variant={student.status === "REMOVED" ? "destructive" : "secondary"}>{student.status}</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Note: `coach.isAdmin` in the copy-text ternary is always `true` here (since `useRequireAdmin()` never returns a non-null, non-admin coach), so the `"Students in your classes."` branch stays unreachable — this matches the original file's own already-existing dead-code shape exactly (see this plan's Architecture section) and is intentional, not a mistake to fix.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint "src/app/(app)/students/page.tsx"`
Expected: clean, 0 problems.

- [ ] **Step 3: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds. `/students` should show as `○` (static) in the route summary, matching `/venues`, `/curriculum`, and `/login`.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, sign in via the "Admin" quick-login button on `/login` (must be admin — the page still redirects non-admins to `/`).

1. Navigate to `http://localhost:3000/students`. Expected: shows "Loading students…" briefly, then the real student list (avatars, level/school, status badges where applicable), plus the "Register student" button.
2. Sign out, sign back in via the "Coach" quick-login button (non-admin), navigate to `http://localhost:3000/students` directly. Expected: redirected to `/` (the `useRequireAdmin()` non-admin path, matching the original page's `redirect("/")`).
3. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/students/page.tsx"
git status
git commit -m "feat: convert students list page to Supabase session/data layer"
```

The `git status` check confirms only this 1 file is staged.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `git diff --stat b3096ef..HEAD -- src/lib/session.ts src/data/students.ts` (substitute the actual commit this plan branched from if different — `b3096ef` is the previous plan's final commit, `HEAD` as of this plan's writing) — empty. These files must be byte-identical to before this plan.
- [ ] Step 3: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds with `/students` showing `○`.

**Next Plan 2b task** (not part of this plan — separately planned): detail pages with dynamic route params (`/venues/[venueId]`, `/classes/[classId]`, `/coaches/[coachId]`, `/students/[studentId]`), reusing the `use(params)` pattern the curriculum-pages plan proved — but check that plan's own carried-forward finding first (stale data on param change without remount) if any of these detail pages turn out to have sibling-to-sibling navigation links. `/students/new` (the registration form page) is also still open.

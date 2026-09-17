# Supabase Class Detail and Creation Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `src/app/(app)/classes/[classId]/page.tsx` (class detail — coach assignment + enrolled students) and `src/app/(app)/classes/new/page.tsx` (admin class creation), plus `AssignCoachForm` and `CreateClassForm`, to Plan 2a's Supabase-based client-side data layer.

**Architecture:** Two things not yet needed by any prior slice:

1. **Drop `canAccessClass` entirely — it is fully redundant under RLS, per Plan 2a's own documented finding #6** (`canAccessClass`, `src/lib/authorization.ts`, is not ported anywhere in this migration, and this is the first slice that would otherwise need to port it). The old page: `if (!(await canAccessClass(coach.id, classId, coach.isAdmin))) redirect("/")`. The RLS policy on `Class`/`ClassAssignment`/`Enrollment` already enforces the identical "admin, or assigned coach" rule server-side — `getClassDetail(classId)` simply returns `null` for a class the caller can't see, which this page already needs to treat as not-found (matching the existing `students/[studentId]`/`venues/[venueId]` 3-state pattern). No client-side authorization check is added to replace it — RLS is the boundary, not a UX nicety layered on top, same as every prior detail page.
2. **`getClassDetail`'s `assignments[].coach` is typed nullable (`Coach | null`), unlike the old Prisma path's non-null `a.coach`.** Plan 2a's `getClassDetail` (`src/lib/api/classes.ts`) merges `coach_public` rows in client-side (a view, can't be nested-joined via `supabase-js`'s FK embedding — Plan 2a finding #4) via `coachById.get(a.coachId) ?? null` — a defensive fallback for a lookup that should always succeed for a valid assignment, but the type reflects the real possibility. Both places this task reads `a.coach.id`/`a.coach.name` must filter out (or otherwise handle) a null `coach` first, or `tsc` will correctly reject the old code's direct `a.coach.id` access.

All data functions this task needs already exist verbatim in Plan 2a's client modules (`@/lib/api/classes.ts`, `@/lib/api/coaches.ts`) — no new backend/data-layer work.

**Tech Stack:** Next.js App Router, React `use()` (route param, and `searchParams` for the one-time `venueId` prefill on the creation page) + `useEffect`/`useState` — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice.

## Global Constraints

- No UI redesign — every visual element stays pixel-identical; only the underlying session/data mechanism changes.
- `classes/[classId]/page.tsx` uses `useRequireCoach()` (any coach, matching the old page's "admin or assigned coach" gating being entirely RLS's job now, not a client-side admin-only gate) — the admin-vs-non-admin *rendering* branch (`AssignCoachForm` vs. read-only coach list) is unchanged, driven by `coach.isAdmin`, same as before.
- `classes/new/page.tsx` uses `useRequireAdmin()`, matching the old page's `if (!coach.isAdmin) redirect("/")`.
- Every data fetch has a `.catch()` that sets an error state rendered before any loading branch, and that error is reset to `null` at the start of any effect that has a legitimate retry trigger (a route-param or searchParams-driven refetch) — this is now a standing requirement in this migration (two prior slices' reviews found real bugs from skipping this).
- Fetch effects depend on derived primitives (`ready`, `classId`, `coach?.isAdmin` where an actual value is needed) — never on the `coach`/`currentCoach` object itself.
- `cls.assignments` entries with a `null` coach are filtered out before being read as `{id, name}` — both in the `assignedCoaches` list passed to `AssignCoachForm` and in the read-only JSX list for non-admins.
- Reuse Plan 2a's existing functions verbatim: `useRequireCoach`, `useRequireAdmin` (`@/lib/supabase/session`); `getClassDetail(classId)`, `getAllVenuesWithClassCounts()`, `createClass(input)` (`@/lib/api/classes`); `getAllCoachesForSelect()`, `assignCoachToClass(input)`, `unassignCoachFromClass(input)` (`@/lib/api/coaches`). Do not modify their signatures or behavior.
- `src/lib/authorization.ts` (`canAccessClass`) is not imported anywhere in the new code — confirm this directly in review, it would be an easy thing to reflexively port from the old page.
- `src/actions/classes.ts`, `src/actions/coaches.ts`, `src/data/classes.ts`, `src/data/coaches.ts` are left completely untouched.
- No new test framework or script — verification is manual (dev server) plus `tsc`/`eslint`/`next build`. Browser automation has worked in this environment this session via the login page's "Quick demo login" buttons (avoiding a narrower, still-real documented conflict specifically about typing into email/password fields) — use it for manual verification if it's still working; if not, fall back to static verification and disclose exactly which checks weren't performed live.

## File Structure

- Modify: `src/app/(app)/classes/[classId]/page.tsx` — convert to a Client Component, `useRequireCoach()` + `use(params)` + effect-based fetches (class detail, and coach list for admins only)
- Modify: `src/app/(app)/classes/new/page.tsx` — convert to a Client Component using `useRequireAdmin()` + `use(searchParams)`
- Modify: `src/components/classes/assign-coach-form.tsx` — swap import
- Modify: `src/components/classes/create-class-form.tsx` — swap import

## Task 1: Convert the class detail page

**Files:**
- Modify: `src/app/(app)/classes/[classId]/page.tsx`
- Modify: `src/components/classes/assign-coach-form.tsx`

**Interfaces:**
- Consumes (pre-existing, from Plan 2a — do not modify): `useRequireCoach(): CurrentCoach | null` from `@/lib/supabase/session`; `getClassDetail(classId: string): Promise<(Class & {venue: Venue; enrollments: (Enrollment & {student: Student})[]; assignments: (ClassAssignment & {coach: {id,name,isAdmin} | null})[]}) | null>` from `@/lib/api/classes`; `getAllCoachesForSelect(): Promise<{id,name,email}[]>`, `assignCoachToClass(input: unknown): Promise<ActionResult>`, `unassignCoachFromClass(input: unknown): Promise<ActionResult>` from `@/lib/api/coaches`.
- Produces: nothing new — this task only rewires existing UI to existing functions.

- [ ] **Step 1: Convert the class detail page**

Replace the entire contents of `src/app/(app)/classes/[classId]/page.tsx` with:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getClassDetail } from "@/lib/api/classes";
import { getAllCoachesForSelect } from "@/lib/api/coaches";
import { formatClassLabel, getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AssignCoachForm } from "@/components/classes/assign-coach-form";

type ClassDetail = Awaited<ReturnType<typeof getClassDetail>>;
type SelectableCoach = Awaited<ReturnType<typeof getAllCoachesForSelect>>[number];

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const coach = useRequireCoach();
  const [cls, setCls] = useState<ClassDetail | undefined>(undefined);
  const [allCoaches, setAllCoaches] = useState<SelectableCoach[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;
  const isAdmin = !!coach?.isAdmin;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setError(null);
    getClassDetail(classId)
      .then((result) => {
        if (!cancelled) setCls(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this class.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, classId]);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    let cancelled = false;
    getAllCoachesForSelect()
      .then((result) => {
        if (!cancelled) setAllCoaches(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load coaches.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, isAdmin]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (cls === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (cls === null) notFound();

  // Filters out a null coach on an assignment row (should never happen for a
  // valid assignment, but getClassDetail's type allows it — see this plan's
  // Architecture note) rather than asserting non-null, so a real data gap
  // fails safe (the coach is silently omitted) instead of crashing the page.
  const assignedCoaches = cls.assignments
    .filter((a) => a.coach !== null)
    .map((a) => ({ id: a.coach!.id, name: a.coach!.name }));
  const availableCoaches =
    isAdmin && allCoaches ? allCoaches.filter((c) => !assignedCoaches.some((a) => a.id === c.id)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{formatClassLabel(cls)}</h1>
        <p className="text-sm text-muted-foreground">{cls.venue.name}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/classes/${classId}/attendance`} className={buttonVariants()}>
          Take attendance
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Coaches</h2>
        {isAdmin ? (
          allCoaches === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <AssignCoachForm classId={classId} assignedCoaches={assignedCoaches} availableCoaches={availableCoaches} />
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedCoaches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coaches assigned yet.</p>
            ) : (
              assignedCoaches.map((c) => (
                <Link
                  key={c.id}
                  href={`/coaches/${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm hover:bg-muted/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                  </Avatar>
                  {c.name}
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Students ({cls.enrollments.length})</h2>
        {cls.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {cls.enrollments.map((e) => (
                <Link
                  key={e.id}
                  href={`/students/${e.student.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(e.student.name)}</AvatarFallback>
                  </Avatar>
                  {e.student.name}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

Note the admin branch shows its own `Loading…` state while `allCoaches` is still `undefined`, rather than gating the *whole page* on it — a non-admin viewing the same class never waits on the coach-list fetch at all (it's never even requested for them, per the `isAdmin` guard on that effect).

- [ ] **Step 2: Convert AssignCoachForm**

In `src/components/classes/assign-coach-form.tsx`, change only the import:

```tsx
import { assignCoachToClass, unassignCoachFromClass } from "@/lib/api/coaches";
```

Everything else in this file is unchanged — both functions' signatures are identical between the old and new modules, and this component already manages its own optimistic local state (no `router.refresh()` anywhere in it to fix).

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint "src/app/(app)/classes/[classId]/page.tsx" src/components/classes/assign-coach-form.tsx`
Expected: clean, 0 problems.

- [ ] **Step 4: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`.

1. Sign in as admin, navigate to a class detail page via `/venues` → a venue → a class. Expected: shows class label, venue name, assigned coaches with the assign/unassign form, and enrolled students — matching the old page.
2. Assign a coach not currently assigned. Expected: they appear in the assigned list immediately, disappear from the dropdown, no page reload.
3. Unassign a coach. Expected: reverse of the above, immediately.
4. Sign in as a non-admin coach assigned to this class, navigate to the same class. Expected: read-only coach list (no assign/unassign controls), each coach name links to their profile.
5. Sign in as a non-admin coach with no relationship to this class. Expected: **RLS-backed not-found** — `getClassDetail` returns `null` for a class this coach has no access to, so the page shows the standard Next.js not-found UI, not a redirect to `/` (this is a real, deliberate behavior difference from the old page's `redirect("/")` — the old page's `canAccessClass` check is gone, replaced entirely by RLS returning no data; confirm this is the actual observed behavior, not an oversight).
6. Click "Take attendance". Expected: navigates to `/classes/<id>/attendance` (not yet converted — it's fine if it still errors, out of scope for this plan).
7. Click a student. Expected: navigates to their already-converted profile page.
8. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory — though it worked for the previous two slices via the "Quick demo login" workaround), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/classes/[classId]/page.tsx" src/components/classes/assign-coach-form.tsx
git status
git commit -m "feat: convert class detail page to Supabase session/data layer"
```

The `git status` check confirms only these 2 files are staged.

## Task 2: Convert class creation

**Files:**
- Modify: `src/app/(app)/classes/new/page.tsx`
- Modify: `src/components/classes/create-class-form.tsx`

**Interfaces:**
- Consumes (pre-existing, from Plan 2a — do not modify): `useRequireAdmin(): CurrentCoach | null` from `@/lib/supabase/session`; `getAllVenuesWithClassCounts(): Promise<(Venue & {_count: {classes: number; checkIns: number}})[]>`, `createClass(input: unknown): Promise<ActionResult<{classId: string}>>` from `@/lib/api/classes`.
- Produces: nothing new.

- [ ] **Step 1: Convert the class creation page**

Replace the entire contents of `src/app/(app)/classes/new/page.tsx` with:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getAllVenuesWithClassCounts } from "@/lib/api/classes";
import { CreateClassForm } from "@/components/classes/create-class-form";

type Venues = Awaited<ReturnType<typeof getAllVenuesWithClassCounts>>;

export default function NewClassPage({
  searchParams,
}: {
  searchParams: Promise<{ venueId?: string }>;
}) {
  const coach = useRequireAdmin();
  const { venueId } = use(searchParams);
  const [venues, setVenues] = useState<Venues | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getAllVenuesWithClassCounts()
      .then((data) => {
        if (!cancelled) setVenues(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load venues.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (venues === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Create a class</h1>
        <p className="text-sm text-muted-foreground">A class is one subject + level taught at a venue on a weekly slot.</p>
      </div>
      <CreateClassForm venues={venues} defaultVenueId={venueId} />
    </div>
  );
}
```

`venueId` is read once via `use(searchParams)` purely as a form default (`CreateClassForm`'s `defaultVenueId` prop) — no reactivity concern here (unlike the payroll page's date range), since nothing on this page re-fetches based on it changing.

- [ ] **Step 2: Convert CreateClassForm**

In `src/components/classes/create-class-form.tsx`, change only the import:

```tsx
import { createClass } from "@/lib/api/classes";
```

Everything else in this file is unchanged — `createClass`'s signature is identical between the old and new modules.

- [ ] **Step 3: Type-check, lint, and build**

Run: `npx tsc --noEmit` — expected clean.
Run: `npx eslint "src/app/(app)/classes/new/page.tsx" src/components/classes/create-class-form.tsx` — expected 0 problems.
Run: `npx next build --turbopack` — expected success.

- [ ] **Step 4: Manual verification**

1. Sign in as admin, navigate to `/venues` → a venue → "Add class" (carries `?venueId=<id>`). Expected: the venue dropdown is pre-selected to that venue. Fill out the rest, submit. Expected: creates the class, navigates to its detail page (Task 1's converted page).
2. Sign in as a non-admin, navigate directly to `/classes/new`. Expected: redirected to `/`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/classes/new/page.tsx" src/components/classes/create-class-form.tsx
git status
git commit -m "feat: convert class creation page to Supabase session/data layer"
```

---

## Verification (whole plan)

- [ ] Step 1: Both tasks' steps all complete.
- [ ] Step 2: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds.
- [ ] Step 3: Manual verification confirms the RLS-backed not-found behavior for an unrelated coach, the assign/unassign flow, and class creation with a pre-filled venue.

**Next Plan 2b task** (not part of this plan — separately planned, and the last one needed to close out Plan 2b entirely): `/classes/[classId]/attendance` — drops the same `canAccessClass` check, needs both `use(params)` and `use(searchParams)` together for the first time, and threads `coachId` into `AttendanceRoster`'s `markAttendanceRecord` call. **Known landmine already found, not yet fixed:** that page's current code calls `session?.submittedAt?.toISOString()` — once converted, `submittedAt` is a Supabase `string`, and `.toISOString()` on a string is a hard runtime crash; the attendance plan must simply pass the string through unchanged (`AttendanceRoster`'s `initialSubmittedAt` prop already expects `string | null`).

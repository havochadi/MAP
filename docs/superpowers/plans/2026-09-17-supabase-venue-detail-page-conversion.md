# Supabase Venue Detail Page Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `src/app/(app)/venues/[venueId]/page.tsx` — the admin-only venue detail page listing a venue's classes — to Plan 2a's Supabase-based client-side data layer.

**Architecture:** This is the simplest remaining Plan 2b page: a single admin-gated, read-only query keyed on a dynamic route param, with no forms and no mutations anywhere on the page. It's the same shape as `students/[studentId]/page.tsx` (Slice 5) and `curriculum/[subject]/[level]/page.tsx` (Slice 3) — `use(params)` for the route param, a 3-state (`undefined`/loading, `null`/not-found-or-RLS-hidden, object/loaded) fetch, `notFound()` on `null`. `getVenueWithClasses(venueId)` already exists verbatim in `@/lib/api/classes.ts` (Plan 2a) and returns the exact same shape the old `@/data/classes.ts` version did — this is pure rewiring, no new data-layer work.

**A settled inconsistency, not a new decision — and settled more narrowly than an earlier draft of this note claimed.** Prior slices have split on whether a fetch effect's dependency array includes the `coach` object itself (student portal, registration's checkin/register) or just a derived `ready` boolean (`venues/page.tsx`, the *list* page). `venues/page.tsx`'s own comment has the correct reasoning: `session.tsx`'s context can hand back a new `coach` object reference across re-resolutions (e.g. a token refresh) without the underlying session actually changing, so depending on the object causes redundant refetches. This page needs no value *from* `coach` beyond its existence, so it depends on `[ready, venueId]`, not `[ready, coach, venueId]`. **The general rule future slices should follow is narrower than "always use `[ready, id]`": depend on derived primitives — `ready` (a boolean) or, when a callback genuinely needs an actual field value, something like `coach?.id` (a stable string) — never the `coach` object itself.** A page whose effect actually reads `coach.id` (e.g. `/coaches/[coachId]`'s self-or-admin guard) correctly needs that value in its deps; dropping it there would itself be a missing-dependency bug, not a fix. (Caught by this plan's own final review, which found this page correctly avoids the bug class but flagged the over-generalized phrasing before a later slice could misapply it.)

**Tech Stack:** Next.js App Router, React `use()` (for the route param) + `useEffect`/`useState` — no new dependencies, no new patterns.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice.

## Global Constraints

- No UI redesign — every visual element stays pixel-identical; only the underlying session/data mechanism changes.
- Use `useRequireAdmin()` (matching the old `if (!coach.isAdmin) redirect("/")` behavior exactly — `useRequireAdmin()` already redirects non-admins to `/` and only ever returns a coach object when `coach.isAdmin` is true, per `src/lib/supabase/session.tsx`).
- The fetch effect depends on `[ready, venueId]`, not `[ready, coach, venueId]` — see the Architecture note above. `ready` is `!!coach`.
- The fetch's `.catch()` sets an error state rendered before the loading check, matching `src/app/(app)/venues/page.tsx`'s exact shape — every fetch in this migration must have one (a prior slice's final review found a real, reachable bug from a missing one).
- Reuse `getVenueWithClasses(venueId)` from `@/lib/api/classes.ts` verbatim — do not modify its signature or behavior.
- `src/data/classes.ts` is left completely untouched — dead code once nothing here imports it, but deletion is a later cleanup plan's job.
- No new test framework or script — verification is manual (dev server) plus `tsc`/`eslint`/`next build` (browser automation is documented as broken in this environment — see project memory).

## File Structure

- Modify: `src/app/(app)/venues/[venueId]/page.tsx` — convert to a Client Component using `useRequireAdmin()` + `use(params)` + effect-based fetch

## Task 1: Convert the venue detail page

**Files:**
- Modify: `src/app/(app)/venues/[venueId]/page.tsx`

**Interfaces:**
- Consumes (pre-existing, from Plan 2a — do not modify): `useRequireAdmin(): CurrentCoach | null` from `@/lib/supabase/session`; `getVenueWithClasses(venueId: string): Promise<(Venue & {classes: (Class & {_count: {enrollments: number}})[]}) | null>` from `@/lib/api/classes`.
- Produces: nothing new — this task only rewires existing UI to an existing function.

- [ ] **Step 1: Convert the venue detail page**

Replace the entire contents of `src/app/(app)/venues/[venueId]/page.tsx` with:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getVenueWithClasses } from "@/lib/api/classes";
import { formatClassLabel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

type VenueWithClasses = Awaited<ReturnType<typeof getVenueWithClasses>>;

export default function VenueDetailPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = use(params);
  const coach = useRequireAdmin();
  const [venue, setVenue] = useState<VenueWithClasses | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getVenueWithClasses(venueId)
      .then((data) => {
        if (!cancelled) setVenue(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this venue.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, venueId]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (venue === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (venue === null) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{venue.name}</h1>
          {venue.address && <p className="text-sm text-muted-foreground">{venue.address}</p>}
        </div>
        <Link href={`/classes/new?venueId=${venue.id}`} className={buttonVariants({ variant: "outline" })}>
          Add class
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Classes</h2>
        {venue.classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes at this venue yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {venue.classes.map((cls) => (
              <Link key={cls.id} href={`/classes/${cls.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent>
                    <p className="font-medium">{formatClassLabel(cls)}</p>
                    <p className="text-sm text-muted-foreground">{cls._count.enrollments} students enrolled</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint "src/app/(app)/venues/[venueId]/page.tsx"`
Expected: clean, 0 problems.

- [ ] **Step 3: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`.

1. Sign in as an admin coach, navigate to `/venues`, click into a venue. Expected: shows the venue's name, address, and its classes, matching the old page exactly.
2. Click "Add class". Expected: navigates to `/classes/new?venueId=<id>` (this route isn't converted yet — it's fine if it still errors, that's expected and out of scope for this plan).
3. Click a class card. Expected: navigates to `/classes/<id>` (also not yet converted — same caveat).
4. Sign in as a non-admin coach, navigate directly to a venue's URL. Expected: redirected to `/`.
5. Navigate to a venue URL that doesn't exist (e.g. a random UUID). Expected: Next.js not-found page.
6. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/venues/[venueId]/page.tsx"
git status
git commit -m "feat: convert venue detail page to Supabase session/data layer"
```

The `git status` check confirms only this 1 file is staged.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds.
- [ ] Step 3: Manual verification confirms the page renders correctly for an admin and redirects a non-admin.

**Next Plan 2b task** (not part of this plan — separately planned): coach detail (`/coaches/[coachId]`) and coach creation (`/coaches/new`) — introduces a "self-or-admin" route guard (a non-admin coach may view their own profile) and a refetch-callback fix for `ShiftHistory`/`EditShiftDialog`'s dead `router.refresh()` calls. After that: `/payroll` (reuses the same refetch-callback pattern for `PendingShiftsTable`), then `/classes/[classId]` + `/classes/new` (drops the now-redundant `canAccessClass` check), then `/classes/[classId]/attendance`.

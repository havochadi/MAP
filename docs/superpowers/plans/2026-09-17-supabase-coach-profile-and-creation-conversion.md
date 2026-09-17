# Supabase Coach Profile and Creation Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `src/app/(app)/coaches/[coachId]/page.tsx` (a coach's profile — showing their stats and shift history) and `src/app/(app)/coaches/new/page.tsx` (admin coach creation), plus the three components they render (`ShiftHistory`, `EditShiftDialog`, `CreateCoachForm`), to Plan 2a's Supabase-based client-side data layer. This page is reachable from the bottom tab bar's "Profile" link for every signed-in coach (`(app)/layout.tsx` already links to `/coaches/${coach.id}`), so it's a frequently-hit, currently-broken page.

**Architecture:** Two genuinely new patterns not yet needed by any prior Plan 2b slice:

1. **State must reset on a `coachId` change, not just on mount.** The bottom tab bar's "Profile" link (`src/components/nav/bottom-tab-bar.tsx`) is present on every `(app)` page, including this one, and always points at `/coaches/${coach.id}` — so an admin viewing coach A's profile who taps "Profile" navigates to their *own* profile at a different URL, without a full remount. `data`/`shifts`/`error` must all reset when `coachId` changes (not just be fetched fresh — the *state* itself must clear first), or the previous coach's content stays visible under the new URL until the new fetch resolves, and a stuck `error` from the old coachId would permanently mask a later successful fetch (this page checks `error` before the loading state). Verified not yet reachable for the structurally similar `venues/[venueId]` page (no venue-to-venue links exist), but immediately reachable here — this plan's Step 1 code includes the reset from the start rather than shipping the gap and fixing it later.

2. **A "self-or-admin" route guard.** The old page: `if (!currentCoach.isAdmin && currentCoach.id !== coachId) redirect(`/coaches/${currentCoach.id}`)` — a non-admin coach may view *their own* profile, but is redirected to it (not to `/`) if they try to view someone else's. Neither `useRequireAdmin()` nor `useRequireCoach()` expresses this on their own; it's built inline in this page as a small `useEffect`, following the exact shape those two hooks already use internally (`src/lib/supabase/session.tsx`) rather than adding a third shared hook for what is currently a single call site (matching this codebase's own established threshold for extracting shared code — see Slice 2's reasoning, "too early to guess its shape from one page").

3. **`router.refresh()` → refetch-callback, the same class of dead-code-after-conversion bug the dashboard slice (Slice 8) fixed for `revalidatePath`.** `ShiftHistory.handleReopen` and `EditShiftDialog.handleSubmit` both call `router.refresh()` after a successful mutation — this did nothing client-side-relevant on the old Server Component page (it forced a fresh server render, which *did* pick up the change), but once this page's `shifts` list is client-fetched `useState`, `router.refresh()` becomes a genuine no-op for that data: the shift list would silently go stale after every reopen/edit. Fix: this page owns a `refreshShifts` callback, threaded down through `ShiftHistory` as a new **optional** `onChanged?: () => void` prop, threaded further into `EditShiftDialog` as `onSaved?: () => void`. Both fall back to `router.refresh()` when the prop is absent, using an explicit `if (onChanged) onChanged(); else router.refresh();` — **not** `onChanged?.() ?? router.refresh()`, which looks equivalent but isn't: `onChanged()` returns `undefined`, so `??`'s right-hand side would run unconditionally regardless of whether `onChanged` was provided, double-firing both on every success (caught during this plan's own drafting, before any implementer touched it — see the dashboard slice's final-review ledger for how). The fallback exists because **`EditShiftDialog` is also rendered by `src/components/payroll/pending-shifts-table.tsx`, which this plan does not touch** (payroll is a separately-planned slice) — it keeps that still-unconverted caller working exactly as it does today (its page is still a Server Component, where `router.refresh()` is still correct) until payroll's own slice converts it and starts passing the callback explicitly. Making the prop optional-with-fallback, not required, is what makes converting `EditShiftDialog` once, here, safe for its other not-yet-converted caller.

**A real runtime crash this plan's own scoping caught before implementation, not just a type-annotation nicety:** both `ShiftHistory` and `EditShiftDialog` have local `Shift` types with `clockInAt: Date`/`clockOutAt: Date | null` — copied from the pre-existing file, correct under the old Prisma-backed data but wrong now that `getShiftHistoryForCoach`/`getPendingShifts` return Supabase/Postgrest rows, which the generated types (`src/lib/supabase/database.types.ts`, `CoachShift.Row`) confirm are `clockInAt: string`/`clockOutAt: string | null`. For `ShiftHistory` this would only be a `tsc` error (its one use of these fields, inside `computeShiftHours`/`computeShiftPay` in the parent page, just does a truthiness check on `clockOutAt` — see `src/lib/pay.ts` below). For `EditShiftDialog` it's worse: `toDatetimeLocal(date: Date)` calls `date.getFullYear()`/`.getMonth()`/`.getDate()`/`.getHours()`/`.getMinutes()` directly — real `Date`-only methods, not just a type annotation — so passing a `string` through unchanged would be a **hard runtime crash** (`"...".getFullYear is not a function`) the instant anyone opens the edit-shift dialog, not merely a compile error. Both are fixed in this plan's Steps 2 and 3 below; `src/lib/pay.ts`'s own type also needs a matching widen (see the new Step in Task 1).

All data functions this task needs already exist verbatim in Plan 2a's client modules (`@/lib/api/coaches.ts`, `@/lib/api/coach-shifts.ts`) — no new backend/data-layer work.

**Tech Stack:** Next.js App Router, React `use()` (route param) + `useEffect`/`useState`/`useCallback` — no new dependencies. `coaches/new/page.tsx` and `CreateCoachForm` need no new patterns at all (pure mechanical import swap, same shape as every prior `create*Form` conversion).

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice.

## Global Constraints

- No UI redesign — every visual element on all five files stays pixel-identical; only the underlying session/data mechanism and the new optional callback props change.
- The self-or-admin redirect (`coaches/[coachId]/page.tsx`) must redirect to `/coaches/${currentCoach.id}`, not `/`, matching the old page's exact target.
- The data-fetch effects depend on a derived `canView` boolean (`!!currentCoach && (currentCoach.isAdmin || currentCoach.id === coachId)`), not on the `currentCoach` object itself — this also means the fetch never even starts for a coach who's about to be redirected away, avoiding a wasted fetch-then-discard. This plan settles the `[ready]`-vs-`[ready, coach]` inconsistency flagged during Slice 7/8's scoping the same way `venues/[venueId]`'s plan (Slice 9) did: derive a boolean, never depend on the coach object reference itself.
- Every data fetch (`getCoachProfile`, `getShiftHistoryForCoach`) must have a `.catch()` that sets an error state rendered before any loading branch — this is a standing requirement in this migration now (a prior slice's final review found a real bug from a missing one).
- `ShiftHistory`'s new `onChanged` prop and `EditShiftDialog`'s new `onSaved` prop are both **optional** (`?: () => void`), falling back to `router.refresh()` when absent via explicit `if (onChanged) onChanged(); else router.refresh();` — **not** `onChanged?.() ?? router.refresh()` (see the Architecture note on why that specific form is broken). See the Architecture note on why this specific file needs the bridge at all (its other caller, `PendingShiftsTable`, is out of scope for this plan).
- `ShiftHistory`'s and `EditShiftDialog`'s local `Shift` types use `clockInAt: string`/`clockOutAt: string | null`, not `Date`/`Date | null` — see the Architecture note. `EditShiftDialog`'s `toDatetimeLocal` must wrap its input in `new Date(...)` before calling any `Date` method.
- `src/lib/pay.ts`'s `PayShiftLike.clockOutAt` widens from `Date | null` to `Date | string | null` — a one-token change, no behavior change (its only use, `computeShiftHours`, does a plain truthiness check, never a `Date`-specific method).
- Reuse Plan 2a's existing functions verbatim: `useRequireCoach` (`@/lib/supabase/session`); `getCoachProfile(coachId)`, `createCoach(input)` (`@/lib/api/coaches`); `getShiftHistoryForCoach(coachId)`, `reopenShift(input)`, `editShift(input)` (`@/lib/api/coach-shifts`). Do not modify their signatures or behavior.
- `src/actions/coaches.ts`, `src/actions/coach-shifts.ts`, `src/data/coaches.ts`, `src/data/coach-shifts.ts` are left completely untouched — dead code once nothing here imports them, but deletion is a later cleanup plan's job. Note `src/components/payroll/pending-shifts-table.tsx` still imports `@/actions/coach-shifts` after this plan — that's expected, it's out of scope here.
- No new test framework or script — verification is manual (dev server) plus `tsc`/`eslint`/`next build` (browser automation is documented as broken in this environment — see project memory).

## File Structure

- Modify: `src/app/(app)/coaches/[coachId]/page.tsx` — convert to a Client Component, `useRequireCoach()` + self-or-admin guard + `use(params)` + effect-based fetches, owning `refreshShifts`
- Modify: `src/app/(app)/coaches/new/page.tsx` — convert to a Client Component using `useRequireAdmin()`
- Modify: `src/components/coach/shift-history.tsx` — swap import, add optional `onChanged` prop, thread into `EditShiftDialog`
- Modify: `src/components/coach/edit-shift-dialog.tsx` — swap import, add optional `onSaved` prop, widen `Shift` type, fix `toDatetimeLocal`
- Modify: `src/lib/pay.ts` — widen `PayShiftLike.clockOutAt` to accept a Supabase-returned `string`
- Modify: `src/components/coaches/create-coach-form.tsx` — swap import

## Task 1: Convert the coach profile page and its shift-history components

**Files:**
- Modify: `src/app/(app)/coaches/[coachId]/page.tsx`
- Modify: `src/components/coach/shift-history.tsx`
- Modify: `src/components/coach/edit-shift-dialog.tsx`
- Modify: `src/lib/pay.ts`

**Interfaces:**
- Consumes (pre-existing, from Plan 2a — do not modify): `useRequireCoach(): CurrentCoach | null` from `@/lib/supabase/session`; `getCoachProfile(coachId: string): Promise<{coach: Coach & {assignments: ...}; sessionsCount: number; studentCount: number} | null>`, `createCoach(input: unknown)` from `@/lib/api/coaches`; `getShiftHistoryForCoach(coachId: string): Promise<(CoachShift & {venue: Venue})[]>`, `reopenShift(input: unknown): Promise<ActionResult>`, `editShift(input: unknown): Promise<ActionResult>` from `@/lib/api/coach-shifts`.
- Produces: `onChanged?: () => void` (new prop on `ShiftHistory`), `onSaved?: () => void` (new prop on `EditShiftDialog`) — both consumed within this task's own files; `EditShiftDialog`'s other caller (`PendingShiftsTable`, unmodified by this plan) keeps working via the fallback. Widened `PayShiftLike` type in `src/lib/pay.ts`, consumed by this page's own `computeShiftHours`/`computeShiftPay` calls and, later, by the separately-planned payroll slice.

- [ ] **Step 1: Convert the coach profile page**

Replace the entire contents of `src/app/(app)/coaches/[coachId]/page.tsx` with:

```tsx
"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getCoachProfile } from "@/lib/api/coaches";
import { getShiftHistoryForCoach } from "@/lib/api/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ShiftHistory } from "@/components/coach/shift-history";

type CoachProfileData = Awaited<ReturnType<typeof getCoachProfile>>;
type Shifts = Awaited<ReturnType<typeof getShiftHistoryForCoach>>;

export default function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = use(params);
  const router = useRouter();
  const currentCoach = useRequireCoach();
  const [data, setData] = useState<CoachProfileData | undefined>(undefined);
  const [shifts, setShifts] = useState<Shifts | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // A non-admin may view their own profile, not anyone else's — redirected
  // to their own profile (not "/") if they try. Neither useRequireAdmin()
  // nor useRequireCoach() expresses this alone, so it's inline here rather
  // than a third shared hook for one call site.
  const canView = !!currentCoach && (currentCoach.isAdmin || currentCoach.id === coachId);

  useEffect(() => {
    if (currentCoach && !currentCoach.isAdmin && currentCoach.id !== coachId) {
      router.replace(`/coaches/${currentCoach.id}`);
    }
  }, [currentCoach, coachId, router]);

  // Resets `data`/`error` on every coachId change, not just on mount — a
  // real, reachable navigation via the bottom tab bar's persistent
  // "Profile" link (src/components/nav/bottom-tab-bar.tsx), which points
  // at whatever coachId is current and does not force a remount when it
  // changes (e.g. an admin browsing from one coach's profile to their
  // own). Without the reset, the *previous* coach's data would stay
  // visible under the new URL until the new fetch resolved, and a stuck
  // `error` from an earlier coachId would permanently mask a later,
  // successful fetch (this page checks `error` before `data === undefined`
  // below). Caught during this plan's own drafting — prompted by the
  // venue-detail slice's final review flagging this exact reachability
  // path on a structurally similar page that didn't happen to hit it.
  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    setData(undefined);
    setError(null);
    getCoachProfile(coachId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this coach.");
      });
    return () => {
      cancelled = true;
    };
  }, [canView, coachId]);

  // Deliberately does NOT reset `shifts` first — this is also called after
  // a successful reopen/edit (see ShiftHistory below), where the fresh
  // list should swap in quietly, not flash the page back to "Loading…".
  // The coachId-change reset lives in the separate effect right below,
  // which only runs on navigation, not on every mutation.
  const refreshShifts = useCallback(() => {
    getShiftHistoryForCoach(coachId)
      .then(setShifts)
      .catch(() => setError("Could not load shift history."));
  }, [coachId]);

  useEffect(() => {
    if (!canView) return;
    setShifts(undefined);
    setError(null);
    refreshShifts();
  }, [canView, coachId, refreshShifts]);

  if (!currentCoach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined || shifts === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (data === null) notFound();

  const { coach } = data;
  const approvedShifts = shifts.filter((s) => s.status === "APPROVED");
  const approvedHours = approvedShifts.reduce((sum, s) => sum + computeShiftHours(s), 0);
  const approvedPay = approvedShifts.reduce((sum, s) => sum + computeShiftPay(s), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{coach.name}</h1>
            {coach.isAdmin && <Badge>Admin</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{coach.email}</p>
          {coach.phone && <p className="text-sm text-muted-foreground">{coach.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">{approvedHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Approved hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">${approvedPay.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Approved pay</p>
          </CardContent>
        </Card>
      </div>

      {currentCoach.isAdmin && (
        <Link href="/payroll" className={buttonVariants({ variant: "outline" })}>
          Go to payroll
        </Link>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Shifts</h2>
        <ShiftHistory shifts={shifts} canReopen={currentCoach.isAdmin} onChanged={refreshShifts} />
      </div>
    </div>
  );
}
```

Note: `sessionsCount`/`studentCount` from `getCoachProfile`'s return value are not rendered by the old page either (confirmed by reading the original — only `coach` is destructured) — do not add UI for them, that would be scope creep beyond matching the existing page.

- [ ] **Step 2: Convert ShiftHistory**

In `src/components/coach/shift-history.tsx`, make exactly these changes:

1. Change the import: `import { reopenShift } from "@/lib/api/coach-shifts";`
2. Add an optional `onChanged` prop:
```tsx
export function ShiftHistory({
  shifts,
  canReopen,
  onChanged,
}: {
  shifts: Shift[];
  canReopen: boolean;
  onChanged?: () => void;
}) {
```
3. In `handleReopen`, use it with an explicit fallback instead of the unconditional `router.refresh()` — **use an `if`/`else`, not `onChanged?.() ?? router.refresh()`** (that form is broken: `onChanged()` returns `undefined`, so the `??` would run `router.refresh()` unconditionally too, every time):
```tsx
  function handleReopen(shiftId: string) {
    startTransition(async () => {
      const result = await reopenShift({ shiftId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Reopened for editing.");
      if (onChanged) onChanged();
      else router.refresh();
    });
  }
```
4. Pass `onChanged` through to `EditShiftDialog` as `onSaved`:
```tsx
{(shift.status === "OPEN" || shift.status === "PENDING") && (
  <EditShiftDialog shift={shift} onSaved={onChanged} />
)}
```
5. Widen the local `Shift` type's `clockInAt`/`clockOutAt` fields to match what `getShiftHistoryForCoach` actually returns:
```tsx
type Shift = {
  id: string;
  venue: { name: string };
  shiftDate: string;
  shiftBlock: ShiftBlockKey;
  clockInAt: string;
  clockOutAt: string | null;
  status: "OPEN" | "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
};
```
Everything else in this file is unchanged.

- [ ] **Step 3: Convert EditShiftDialog**

In `src/components/coach/edit-shift-dialog.tsx`, make exactly these changes:

1. Change the import: `import { editShift } from "@/lib/api/coach-shifts";`
2. Widen the local `Shift` type and fix `toDatetimeLocal` to accept what Supabase actually returns — **this one is a real runtime crash if skipped, not just a type nicety**: `getFullYear()`/`getMonth()`/`getDate()`/`getHours()`/`getMinutes()` are `Date`-only methods, and `shift.clockInAt` is now a `string`:
```tsx
type Shift = { id: string; clockInAt: string; clockOutAt: string | null };

function toDatetimeLocal(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
```
3. Add an optional `onSaved` prop:
```tsx
export function EditShiftDialog({ shift, onSaved }: { shift: Shift; onSaved?: () => void }) {
```
4. In `handleSubmit`, use it with an explicit fallback instead of the unconditional `router.refresh()` — same `if`/`else`, not `??`, as `ShiftHistory`'s Step 2:
```tsx
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Shift updated.");
      setOpen(false);
      if (onSaved) onSaved();
      else router.refresh();
```
Everything else in this file (the dialog JSX, the two `<Input type="datetime-local">` call sites passing `toDatetimeLocal(shift.clockInAt)`/`toDatetimeLocal(shift.clockOutAt)` — unchanged call sites, just now calling the fixed function) is unchanged. `editShift`'s signature is identical between the old and new modules.

**Confirm `src/components/payroll/pending-shifts-table.tsx` is not in your diff** — it renders `<EditShiftDialog shift={shift} />` with no `onSaved`, which after this task's change falls back to `router.refresh()`, identical to today's behavior (that page is still a Server Component, unconverted, out of scope for this plan).

- [ ] **Step 4: Widen PayShiftLike in src/lib/pay.ts**

In `src/lib/pay.ts`, change only this line:

```tsx
export type PayShiftLike = { shiftBlock: ShiftBlockKey; clockOutAt: Date | string | null };
```

(was `clockOutAt: Date | null`). No other change to this file — `computeShiftHours`'s only use of `clockOutAt` is `if (!shift.clockOutAt) return 0;`, a plain truthiness check that works identically for a `string`, `Date`, or `null`. This widening is needed because `ShiftHistory`'s shifts (now `clockOutAt: string | null`, Step 2) are passed through `computeShiftHours`/`computeShiftPay` in this page's own render, and the separately-planned payroll slice's `PendingShiftsTable` shifts will need the same widened type.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint "src/app/(app)/coaches/[coachId]/page.tsx" src/components/coach/shift-history.tsx src/components/coach/edit-shift-dialog.tsx src/lib/pay.ts`
Expected: clean, 0 problems.

- [ ] **Step 6: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`.

1. Sign in as an admin, tap the "Profile" tab. Expected: shows your own coach profile, stats, and shift history.
2. Navigate to another coach's profile URL directly (as admin). Expected: shows that coach's profile.
2a. From that other coach's profile, tap the "Profile" tab in the bottom bar (which navigates to your own profile, a `coachId` change with no remount). Expected: briefly shows "Loading…", then your own profile — **not** a flash of the other coach's data lingering, and not a stuck error. This is the critical check for this plan's Architecture note on resetting state across a `coachId` change.
3. Sign in as a non-admin coach, tap "Profile". Expected: shows your own profile.
4. As that same non-admin coach, navigate directly to a *different* coach's profile URL. Expected: redirected to your own profile URL, not `/`.
5. As an admin, on a coach with an APPROVED or REJECTED shift, click "Reopen". Expected: shift status changes to PENDING immediately in the list, without a page reload — this is the critical check for this plan's Architecture note on the dead `router.refresh()`.
6. As an admin, click "Edit" on any shift to open its dialog. Expected: the dialog opens showing correctly pre-filled clock-in/out datetime fields — **this is the critical check for the `toDatetimeLocal` fix**; if the dialog fails to open or the console shows a `getFullYear is not a function`-style error, the fix in Step 3 is missing or wrong. Change the time and save. Expected: the shift history list reflects the new time immediately, without a page reload.
7. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(app)/coaches/[coachId]/page.tsx" src/components/coach/shift-history.tsx src/components/coach/edit-shift-dialog.tsx src/lib/pay.ts
git status
git commit -m "feat: convert coach profile page and shift history to Supabase session/data layer"
```

The `git status` check confirms only these 3 files are staged (and specifically that `pending-shifts-table.tsx` is not).

## Task 2: Convert coach creation

**Files:**
- Modify: `src/app/(app)/coaches/new/page.tsx`
- Modify: `src/components/coaches/create-coach-form.tsx`

**Interfaces:**
- Consumes (pre-existing, from Plan 2a — do not modify): `useRequireAdmin(): CurrentCoach | null` from `@/lib/supabase/session`; `createCoach(input: unknown): Promise<ActionResult<{coachId: string}>>` from `@/lib/api/coaches`.
- Produces: nothing new.

- [ ] **Step 1: Convert the coach creation page**

Replace the entire contents of `src/app/(app)/coaches/new/page.tsx` with:

```tsx
"use client";

import { useRequireAdmin } from "@/lib/supabase/session";
import { CreateCoachForm } from "@/components/coaches/create-coach-form";

export default function NewCoachPage() {
  const coach = useRequireAdmin();
  if (!coach) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Add a coach</h1>
        <p className="text-sm text-muted-foreground">
          They&apos;ll sign in with this email and temporary password, then can be assigned to classes.
        </p>
      </div>
      <CreateCoachForm />
    </div>
  );
}
```

- [ ] **Step 2: Convert CreateCoachForm**

In `src/components/coaches/create-coach-form.tsx`, change only the import:

```tsx
import { createCoach } from "@/lib/api/coaches";
```

Everything else in this file is unchanged — `createCoach`'s signature is identical between the old and new modules.

- [ ] **Step 3: Type-check, lint, and build**

Run: `npx tsc --noEmit` — expected clean.
Run: `npx eslint "src/app/(app)/coaches/new/page.tsx" src/components/coaches/create-coach-form.tsx` — expected 0 problems.
Run: `npx next build --turbopack` — expected success.

- [ ] **Step 4: Manual verification**

1. Sign in as admin, navigate to `/coaches/new`. Fill out the form, submit. Expected: creates the coach, navigates to their new profile page (Task 1's converted page).
2. Sign in as a non-admin, navigate directly to `/coaches/new`. Expected: redirected to `/`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/coaches/new/page.tsx" src/components/coaches/create-coach-form.tsx
git status
git commit -m "feat: convert coach creation page to Supabase session/data layer"
```

---

## Verification (whole plan)

- [ ] Step 1: Both tasks' steps all complete.
- [ ] Step 2: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds.
- [ ] Step 3: Manual verification confirms the self-or-admin guard, the reopen/edit refetch, and coach creation all work without a page reload where claimed.
- [ ] Step 4: `git diff --stat c6e2fcf..HEAD -- src/components/payroll/pending-shifts-table.tsx` (substitute the actual commit this plan branched from if different) — empty. This file must be byte-identical to before this plan.

**Next Plan 2b task** (not part of this plan — separately planned): `/payroll` (reuses this plan's `onChanged`/`onSaved` bridge pattern for `PendingShiftsTable`, adds a `useSearchParams()`-driven refetch for the date-range filter, and needs `approveShift`/`rejectShift` updated to take an explicit `adminId`). After that: `/classes/[classId]` + `/classes/new` (drops the now-redundant `canAccessClass` check), then `/classes/[classId]/attendance`.

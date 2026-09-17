# Supabase Payroll Page Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `src/app/(app)/payroll/page.tsx` (admin shift approval + pay summary) and `src/components/payroll/pending-shifts-table.tsx` to Plan 2a's Supabase-based client-side data layer. `src/components/payroll/pay-summary.tsx` needs zero changes (confirmed by reading it directly — it imports nothing from `@/actions/*` or `@/data/*`, it's already pure/presentational plus client-side navigation).

**Architecture:** Two things this page needs that no prior slice has combined before:

1. **Reactive `searchParams` (the date-range filter), using the already-proven `use()` pattern, not `useSearchParams()`.** The old page reads `searchParams.from`/`.to` and re-runs server-side on every navigation `PaySummary`'s own "Update" button triggers (`router.push(pathname?from=&to=)`). The Client Component replacement uses `use(searchParams)` exactly like every dynamic-route-param page in this migration uses `use(params)` — this is the same framework mechanism (Next's App Router passes a fresh props object to the page component tree on every navigation that matches the route, client or server component alike), already validated in production by Slice 3's `curriculum/[subject]/[level]` page reacting correctly to param changes without a remount. This plan reuses that same mechanism for `searchParams` rather than introducing `useSearchParams()` (which needs a `Suspense` boundary this codebase doesn't otherwise use). The fetch effect for the pay summary is keyed on the *unwrapped* `[ready, from, to]` values, not on the `searchParams` promise itself.
2. **`PendingShiftsTable` completes the `onChanged`/`onSaved` bridge the coach-profile slice started.** That prior slice made `EditShiftDialog`'s callback prop *optional* specifically because `PendingShiftsTable` (this file) was still unconverted and needed the `router.refresh()` fallback to keep working. This slice is that other shoe: `PendingShiftsTable` now has exactly one caller (this page, after conversion), so it takes `onChanged` as a **required** prop (no other unconverted caller to bridge for) and passes it straight through to its own `EditShiftDialog` usage as `onSaved={onChanged}`, completing the pattern. Its own `approveShift`/`rejectShift` calls need the same `router.refresh()` → callback fix for the same underlying reason (dead code once this page is a Client Component).

**A real signature change, not just an import swap:** `approveShift`/`rejectShift` in `@/lib/api/coach-shifts.ts` take an explicit `adminId` as their first argument (the old Server Actions derived it server-side via `requireAdmin()`; the client-side replacement can't) — `PendingShiftsTable` needs a new required `adminId` prop, supplied by the page from `useRequireAdmin()`'s return value.

**A prerequisite from the coach-profile slice, not this plan's own work:** `PendingShiftsTable`'s shifts (from `getPendingShifts()`) have `clockOutAt: string | null` (Supabase/Postgrest, not Prisma `Date`) and flow through `computeShiftHours`/`computeShiftPay` (`@/lib/pay.ts`). The coach-profile-and-creation plan (executed before this one) widens `PayShiftLike.clockOutAt` to `Date | string | null` for the identical reason on `ShiftHistory`'s shifts — by the time this plan runs, that widening should already be in place. If `tsc` fails on this file with a `clockOutAt` type mismatch against `PayShiftLike`, confirm the coach-profile slice actually landed that change (`grep 'clockOutAt' src/lib/pay.ts`) before assuming this plan's own code is wrong.

**A known, pre-existing gap this plan does not fix:** the "Download CSV" link in `PaySummary` (`<a href="/api/payroll/export?from=..&to=..">`) points to `src/app/api/payroll/export/route.ts`, a Route Handler that still calls the old `requireCoach()` and will keep 403ing even after this page converts — Route Handlers run server-side with no access to the client's Supabase browser session (this migration's architecture is browser-client/localStorage-based, no `@supabase/ssr` cookie bridge), so fixing it needs its own deliberate decision (Bearer-token auth on the route, or moving CSV generation client-side) that's out of scope here. Do not attempt to fix it as part of this plan; do not silently ignore it either — the manual verification step below explicitly checks and reports its (expected-broken) state.

**Tech Stack:** Next.js App Router, React `use()` (searchParams) + `useEffect`/`useState`/`useCallback` — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice.

## Global Constraints

- No UI redesign — every visual element stays pixel-identical; only the underlying session/data mechanism and the new `adminId`/`onChanged` props change. `PaySummary` (`src/components/payroll/pay-summary.tsx`) is **not modified** — confirm this directly in review, it would be an easy file to touch by mistake since it's central to this page.
- The pay-summary fetch effect depends on `[ready, from, to]` (unwrapped primitive strings), not on the `searchParams` promise or the `coach` object.
- Every data fetch (`getPendingShifts`, `getPaySummary`) must have a `.catch()` that sets an error state rendered before any loading branch.
- `PendingShiftsTable` takes `adminId: string` (required) and `onChanged: () => void` (required — this file has exactly one caller after this plan, unlike `EditShiftDialog`'s two-caller bridge). It passes `onSaved={onChanged}` to its own `EditShiftDialog` usage. Do not make these optional — there's no other caller to bridge for, and an unused fallback would be dead code.
- Reuse Plan 2a's existing functions verbatim: `useRequireAdmin` (`@/lib/supabase/session`); `getPendingShifts()`, `getPaySummary(from, to)`, `approveShift(adminId, input)`, `rejectShift(adminId, input)`, `editShift(input)` (`@/lib/api/coach-shifts`). Do not modify their signatures or behavior.
- `src/actions/coach-shifts.ts`, `src/data/coach-shifts.ts` are left completely untouched.
- `src/app/api/payroll/export/route.ts` is not modified — see the Architecture note on why.
- No new test framework or script — verification is manual (dev server) plus `tsc`/`eslint`/`next build` (browser automation is documented as broken in this environment — see project memory).

## File Structure

- Modify: `src/app/(app)/payroll/page.tsx` — convert to a Client Component using `useRequireAdmin()` + `use(searchParams)` + effect-based fetches, owning `refreshPending`
- Modify: `src/components/payroll/pending-shifts-table.tsx` — swap imports, add `adminId`/`onChanged` props, thread `onSaved` into `EditShiftDialog`, thread `adminId`/`onChanged` into the internal `RejectShiftDialog`
- Modify: `src/components/coach/edit-shift-dialog.tsx` — narrow `Shift`/`toDatetimeLocal` back to `string`-only now that this plan removes its last `Date`-typed caller (Step 2b)

## Task 1: Convert the payroll page and pending-shifts table

**Files:**
- Modify: `src/app/(app)/payroll/page.tsx`
- Modify: `src/components/payroll/pending-shifts-table.tsx`
- Modify: `src/components/coach/edit-shift-dialog.tsx`

**Interfaces:**
- Consumes (pre-existing, from Plan 2a — do not modify): `useRequireAdmin(): CurrentCoach | null` from `@/lib/supabase/session`; `getPendingShifts()`, `getPaySummary(from: string, to: string)`, `approveShift(adminId: string, input: unknown): Promise<ActionResult>`, `rejectShift(adminId: string, input: unknown): Promise<ActionResult>`, `editShift(input: unknown): Promise<ActionResult>` from `@/lib/api/coach-shifts`; `summarizePayByCoach` from `@/lib/pay` (unchanged, pure utility); `EditShiftDialog` (already converted in the coach-profile slice, with an optional `onSaved` prop) from `@/components/coach/edit-shift-dialog`.
- Produces: nothing new outside this task's own 2 files.

- [ ] **Step 1: Convert the payroll page**

Replace the entire contents of `src/app/(app)/payroll/page.tsx` with:

```tsx
"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getPendingShifts, getPaySummary } from "@/lib/api/coach-shifts";
import { getSingaporeTodayString } from "@/lib/dates";
import { summarizePayByCoach } from "@/lib/pay";
import { PendingShiftsTable } from "@/components/payroll/pending-shifts-table";
import { PaySummary } from "@/components/payroll/pay-summary";

type PendingShifts = Awaited<ReturnType<typeof getPendingShifts>>;
type ApprovedShifts = Awaited<ReturnType<typeof getPaySummary>>;

export default function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const coach = useRequireAdmin();
  const { from: fromParam, to: toParam } = use(searchParams);
  const today = getSingaporeTodayString();
  const from = fromParam ?? `${today.slice(0, 7)}-01`;
  const to = toParam ?? today;

  const [pending, setPending] = useState<PendingShifts | undefined>(undefined);
  const [approvedShifts, setApprovedShifts] = useState<ApprovedShifts | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  const refreshPending = useCallback(() => {
    getPendingShifts()
      .then(setPending)
      .catch(() => setError("Could not load pending shifts."));
  }, []);

  useEffect(() => {
    if (!ready) return;
    refreshPending();
  }, [ready, refreshPending]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getPaySummary(from, to)
      .then((data) => {
        if (!cancelled) setApprovedShifts(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load pay summary.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, from, to]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (pending === undefined || approvedShifts === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const rows = summarizePayByCoach(approvedShifts);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Review clocked shifts and see coaching pay.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pending review</h2>
        <PendingShiftsTable shifts={pending} adminId={coach.id} onChanged={refreshPending} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pay summary</h2>
        <PaySummary from={from} to={to} rows={rows} />
      </div>
    </div>
  );
}
```

Note on a deliberately accepted, minor cosmetic behavior (do not "fix" this — it matches an already-documented pattern from Slice 3): changing the date range via `PaySummary`'s form navigates to the same route with new `?from=&to=`, which updates `from`/`to` here and re-triggers the pay-summary fetch — but `approvedShifts` isn't reset to `undefined` first, so the *old* rows stay visible until the new fetch resolves, rather than showing a loading state in between. This is the same "stale data briefly visible on a same-page param change" shape Slice 3's plan flagged for `use(params)`-based pages; it's acceptable here for the same reason (a brief, correct-eventually flicker on an admin reporting view, not a correctness bug), not something to add extra state-resetting logic for.

- [ ] **Step 2: Convert PendingShiftsTable**

Replace the entire contents of `src/components/payroll/pending-shifts-table.tsx` with:

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveShift, rejectShift } from "@/lib/api/coach-shifts";
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
  clockInAt: string;
  clockOutAt: string | null;
};

export function PendingShiftsTable({
  shifts,
  adminId,
  onChanged,
}: {
  shifts: Shift[];
  adminId: string;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleApprove(shiftId: string) {
    startTransition(async () => {
      const result = await approveShift(adminId, { shiftId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Approved.");
      onChanged();
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
                <EditShiftDialog shift={shift} onSaved={onChanged} />
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleApprove(shift.id)}>
                  Approve
                </Button>
                <RejectShiftDialog shiftId={shift.id} adminId={adminId} onChanged={onChanged} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RejectShiftDialog({ shiftId, adminId, onChanged }: { shiftId: string; adminId: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await rejectShift(adminId, { shiftId, reviewNote: formData.get("reviewNote") });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Rejected.");
      setOpen(false);
      onChanged();
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
```

Note the local `Shift` type's `clockInAt`/`clockOutAt` are now `string`/`string | null`, not `Date`/`Date | null` — same Prisma-`Date`-vs-Supabase-`string` reasoning as the dashboard slice's `CheckInDesk` fix. Confirmed directly against the generated types (`src/lib/supabase/database.types.ts`'s `CoachShift.Row`: `clockInAt: string`, `clockOutAt: string | null`) — this is required for `tsc` to pass against `getPendingShifts`'s real return type, not optional polish. `useRouter` is no longer imported — this file no longer calls `router.refresh()` anywhere.

- [ ] **Step 2b: Narrow EditShiftDialog back to string-only, now that this was its last Date-typed caller**

`src/components/coach/edit-shift-dialog.tsx`'s `Shift` type is currently `{ id: string; clockInAt: Date | string; clockOutAt: Date | string | null }` — widened by the coach-profile-and-creation slice specifically to keep *this* file (`pending-shifts-table.tsx`, then still unconverted and still passing real Prisma `Date` objects) type-checking. After Step 2 above, this file passes `string`-typed shifts too, so `EditShiftDialog` has no remaining `Date`-typed caller. Narrow it back:

```tsx
type Shift = { id: string; clockInAt: string; clockOutAt: string | null };

function toDatetimeLocal(value: string): string {
```

(removing the `Date |` union from both the type and the function parameter — `new Date(value)` inside stays unchanged, it already works for a `string` alone). This isn't required for `tsc` to pass (the wider type still accepts a `string`), but leaving it wide after its reason for being wide is gone is exactly the kind of unnecessary-abstraction residue this codebase's own conventions call out — narrow it back in the same commit that removes its last other caller, don't leave it for a later cleanup pass to rediscover.

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint "src/app/(app)/payroll/page.tsx" src/components/payroll/pending-shifts-table.tsx src/components/coach/edit-shift-dialog.tsx`
Expected: clean, 0 problems.

- [ ] **Step 4: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`.

1. Sign in as admin, navigate to `/payroll`. Expected: shows pending shifts and the current month's pay summary, matching the old page.
2. Approve a pending shift. Expected: it disappears from the pending list immediately, without a page reload.
3. Reject a pending shift with a reason. Expected: same — disappears immediately.
4. Edit a pending shift's time via its `EditShiftDialog`. Expected: the pending list reflects the change immediately (this is the completed half of the coach-profile slice's bridge — confirm it actually works now that both callers pass `onSaved`/`onChanged`).
5. Change the date range in the pay summary form and click "Update". Expected: the URL updates with the new `?from=&to=`, and the pay summary table refreshes to match (may briefly show the old range's rows first — see the Step 1 note, that's expected).
6. Click "Download CSV". Expected: **still fails** (403 or an error) — this is the known, documented, out-of-scope gap from this plan's Architecture section. Confirm it fails in the same way it already did before this plan (not a new failure mode), and note the exact behavior observed in the report.
7. Sign in as a non-admin, navigate directly to `/payroll`. Expected: redirected to `/`.
8. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/payroll/page.tsx" src/components/payroll/pending-shifts-table.tsx src/components/coach/edit-shift-dialog.tsx
git status
git commit -m "feat: convert payroll page to Supabase session/data layer"
```

The `git status` check confirms only these 3 files are staged — in particular, confirm `src/components/payroll/pay-summary.tsx` is **not** in the diff. `edit-shift-dialog.tsx` *is* expected here (Step 2b's narrowing), unlike every other file this plan leaves untouched.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds.
- [ ] Step 3: Manual verification confirms approve/reject/edit all refresh the pending list live, the date-range filter works, and the CSV export's known-broken state is unchanged (not newly broken, not accidentally fixed in a way that bypasses the documented architectural gap).

**Next Plan 2b task** (not part of this plan — separately planned): `/classes/[classId]` + `/classes/new` (drops the now-redundant `canAccessClass` check, per Plan 2a finding #6). After that: `/classes/[classId]/attendance`.

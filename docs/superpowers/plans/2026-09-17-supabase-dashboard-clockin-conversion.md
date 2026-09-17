# Supabase Dashboard and Clock-In Desk Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `(app)/page.tsx` — the coach dashboard, and the page every coach lands on immediately after logging in — and the two components it renders (`ClockInForm`, `CheckInDesk`) to Plan 2a's Supabase-based client-side data layer. This is the highest-priority remaining Plan 2b slice: it is currently the very first page a real coach hits post-login, and it is currently broken (still on the old NextAuth-based `requireCoach()` path, which throws since the login/middleware cutover in Slice 1).

**Architecture:** The old page is an `async` Server Component with a 3-way branch: no open shift + no session scheduled today → "No session today" message; no open shift + a session is scheduled → `ClockInForm`; open shift → `CheckInDesk`. All the data functions this page and its two components need already exist verbatim in Plan 2a's client modules: `getOpenShiftForCoach`, `getCheckInCountForShift`, `getAllVenues` (reads), `clockIn`, `clockOut`, `scanCheckIn` (writes) — no new backend/data-layer work, this is pure rewiring, same as every prior Plan 2b slice.

**A real, verified architectural requirement, not a style choice — read before implementing:** the old page's server-side transitions (clock in → see the check-in desk; clock out → see the clock-in form again) worked entirely because `clockIn`/`clockOut` (`src/actions/coach-shifts.ts`) are Server Actions that call `revalidatePath("/")`, which forces the whole Server Component tree at `/` to re-render fresh on the next paint. Plan 2a's client-side replacements are ordinary async functions with no such mechanism — nothing will make the dashboard notice a successful clock-in or clock-out on its own. Confirmed by tracing both call sites: `ClockInForm`'s submit handler and `CheckInDesk`'s `handleClockOut` each currently do nothing beyond the Server Action call + `revalidatePath` on success. Without an explicit fix, clocking in would leave the coach stuck looking at the same clock-in form (or a stale loading state) instead of transitioning to the check-in desk, and clocking out would leave them stuck on the check-in desk. The fix: the dashboard page owns one `refreshShift` callback (re-fetches `getOpenShiftForCoach` and updates local state), and passes it down as a new prop — `onClockedIn` to `ClockInForm`, `onClockedOut` to `CheckInDesk` — each calling it after its own successful mutation. This is the same "props down, callbacks up" shape already used by `AssignCoachForm`'s optimistic local updates elsewhere in this codebase, applied here as an explicit refetch instead of an optimistic splice (simpler and correct: the shift object itself, not just one field, changes shape between the two states).

**Tech Stack:** Next.js App Router, React `useState`/`useEffect`/`useCallback` — no new dependencies, no new patterns beyond what prior Plan 2b slices established, plus the callback-refetch pattern described above (first time this exact shape is needed in this migration; ShiftHistory/EditShiftDialog/PendingShiftsTable will need the same treatment in later, separately-planned slices — same root cause, `router.refresh()` instead of `revalidatePath`, equally dead once their own pages convert).

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice.

## Global Constraints

- No UI redesign — every visual element on all three files stays pixel-identical; only the underlying session/data mechanism and the two new callback props change.
- `blocksForDay(getDayOfWeek(getSingaporeTodayString()))` must be computed **inside** the component body (a plain `const`, recomputed each render), not hoisted to module scope — the original evaluated this fresh on every request; module-scope hoisting would freeze "today" for as long as the client bundle stays loaded (e.g. a tab left open across midnight).
- `Scanner` (`src/components/checkin/scanner.tsx`) is not modified — it has no session/data dependency and is out of scope.
- Reuse Plan 2a's existing functions verbatim: `useRequireCoach` (`src/lib/supabase/session`); `getOpenShiftForCoach`, `clockIn(coachId, input)`, `clockOut(input)` (`@/lib/api/coach-shifts`); `getCheckInCountForShift`, `scanCheckIn(input)` (`@/lib/api/checkins`); `getAllVenues` (`@/lib/api/venues`). Do not modify their signatures or behavior. Note `clockIn` now takes `coachId` as an explicit first argument (the old Server Action derived it server-side from the session; the client-side replacement can't, so the caller — `ClockInForm` — now needs a `coachId` prop). `clockOut` and `scanCheckIn` keep their original single-argument shape; no new prop is needed for those besides the new callback.
- Every data fetch (`getOpenShiftForCoach`, `getCheckInCountForShift`, `getAllVenues`) must have a `.catch()` that sets an error state rendered before any loading branch — these functions `throw` on a Postgrest error (confirmed: `getOpenShiftForCoach` in particular errors, rather than returning null, if `.maybeSingle()` ever matches more than one row). This is not optional polish: the immediately-prior Plan 2b slice's final review found exactly this gap (an uncaught rejection leaving a page on "Loading…" forever, no error, no recovery) in `checkin/register/page.tsx`, fixed as a follow-up. Match `src/app/(app)/venues/page.tsx`'s exact shape (`error` state, checked immediately after the `!coach` guard, before any `=== undefined` loading check) — do not repeat the gap here.
- `src/actions/coach-shifts.ts`, `src/actions/checkins.ts`, `src/data/coach-shifts.ts`, `src/data/checkins.ts`, `src/data/venues.ts` are left completely untouched — dead code once nothing imports them here, but deletion is a later cleanup plan's job, not this one.
- No new test framework or script — this is UI/routing behavior. Verification is manual: run the dev server and exercise both branches by hand (browser automation is currently broken in this environment due to an unrelated extension conflict — see project memory; static verification via `tsc`/`eslint`/`next build` substitutes where live interaction isn't possible).

## File Structure

- Modify: `src/app/(app)/page.tsx` — convert to a Client Component using `useRequireCoach()` + effect-based fetch of the open shift, owning the `refreshShift` callback
- Modify: `src/components/checkin/clock-in-form.tsx` — swap import, add `coachId` and `onClockedIn` props
- Modify: `src/components/checkin/check-in-desk.tsx` — swap imports, add `onClockedOut` prop

## Task 1: Convert the dashboard page and its two components

**Files:**
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/components/checkin/clock-in-form.tsx`
- Modify: `src/components/checkin/check-in-desk.tsx`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a — do not modify): `useRequireCoach(): CurrentCoach | null` from `@/lib/supabase/session`; `getOpenShiftForCoach(coachId: string): Promise<(CoachShift & {venue: Venue}) | null>`, `clockIn(coachId: string, input: unknown): Promise<ActionResult<{shiftId: string}>>`, `clockOut(input: unknown): Promise<ActionResult>` from `@/lib/api/coach-shifts`; `getCheckInCountForShift(coachShiftId: string): Promise<number>`, `scanCheckIn(input: unknown): Promise<ScanResult>` from `@/lib/api/checkins`; `getAllVenues(): Promise<{id: string; name: string}[]>` from `@/lib/api/venues`.
- Produces: nothing new for other files — the two new props (`onClockedIn`, `onClockedOut`) are internal to this task's own three files.

- [ ] **Step 1: Convert the dashboard page**

Replace the entire contents of `src/app/(app)/page.tsx` with:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireCoach } from "@/lib/supabase/session";
import { getOpenShiftForCoach } from "@/lib/api/coach-shifts";
import { getCheckInCountForShift } from "@/lib/api/checkins";
import { getAllVenues } from "@/lib/api/venues";
import { getSingaporeTodayString, getDayOfWeek } from "@/lib/dates";
import { blocksForDay, SHIFT_BLOCKS } from "@/lib/shift-blocks";
import { ClockInForm } from "@/components/checkin/clock-in-form";
import { CheckInDesk } from "@/components/checkin/check-in-desk";

type OpenShift = Awaited<ReturnType<typeof getOpenShiftForCoach>>;
type Venue = { id: string; name: string };

export default function DashboardPage() {
  const coach = useRequireCoach();
  // Recomputed every render, not hoisted to module scope — see Global Constraints.
  const todayBlocks = blocksForDay(getDayOfWeek(getSingaporeTodayString()));

  const [openShift, setOpenShift] = useState<OpenShift | undefined>(undefined);
  const [venues, setVenues] = useState<Venue[] | undefined>(undefined);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Owned here (not inside ClockInForm/CheckInDesk) because clocking in or
  // out changes which of those two components should even be on screen —
  // there's no Server Action revalidatePath to do this for us anymore, see
  // this plan's Architecture note.
  const refreshShift = useCallback(() => {
    if (!coach) return;
    getOpenShiftForCoach(coach.id)
      .then(setOpenShift)
      .catch(() => setError("Could not load your shift."));
  }, [coach]);

  useEffect(() => {
    refreshShift();
  }, [refreshShift]);

  useEffect(() => {
    if (openShift === undefined) return;
    if (openShift) {
      getCheckInCountForShift(openShift.id)
        .then(setCount)
        .catch(() => setError("Could not load check-in count."));
    } else if (todayBlocks.length > 0) {
      getAllVenues()
        .then(setVenues)
        .catch(() => setError("Could not load venues."));
    }
    // todayBlocks is derived from the current date, not external state that
    // changes within this effect's lifetime — omitted from deps deliberately,
    // same reasoning as every other date-derived value in this codebase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openShift]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (openShift === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!openShift) {
    if (todayBlocks.length === 0) {
      return (
        <div className="mx-auto max-w-sm space-y-2 pt-10 text-center">
          <h1 className="text-xl font-semibold">No session today</h1>
          <p className="text-sm text-muted-foreground">
            Study Space runs Tue &amp; Thu evenings, and Sat &amp; Sun. Check back on the next session day.
          </p>
        </div>
      );
    }
    if (venues === undefined) {
      return <p className="text-sm text-muted-foreground">Loading…</p>;
    }
    const blocks = todayBlocks.map((key) => ({ key, label: SHIFT_BLOCKS[key].label }));
    return <ClockInForm coachId={coach.id} venues={venues} blocks={blocks} onClockedIn={refreshShift} />;
  }

  if (count === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  return <CheckInDesk shift={openShift} initialCount={count} onClockedOut={refreshShift} />;
}
```

- [ ] **Step 2: Convert ClockInForm**

Replace the entire contents of `src/components/checkin/clock-in-form.tsx` with:

```tsx
"use client";

import { useActionState } from "react";
import { clockIn } from "@/lib/api/coach-shifts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Venue = { id: string; name: string };
type Block = { key: string; label: string };
type FormState = { error?: string } | undefined;

export function ClockInForm({
  coachId,
  venues,
  blocks,
  onClockedIn,
}: {
  coachId: string;
  venues: Venue[];
  blocks: Block[];
  onClockedIn: () => void;
}) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await clockIn(coachId, { venueId: formData.get("venueId"), shiftBlock: formData.get("shiftBlock") });
    if (!result.success) return { error: result.error };
    onClockedIn();
    return undefined;
  }
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-5 pt-10 text-center">
      <div>
        <h1 className="text-xl font-semibold">Clock in to start</h1>
        <p className="text-sm text-muted-foreground">Pick your session and where you&apos;re coaching today.</p>
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="shiftBlock">Session</Label>
        <NativeSelect id="shiftBlock" name="shiftBlock" required defaultValue={blocks.length === 1 ? blocks[0].key : ""}>
          {blocks.length !== 1 && (
            <option value="" disabled>
              Select a session
            </option>
          )}
          {blocks.map((b) => (
            <option key={b.key} value={b.key}>
              {b.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="venueId">Location</Label>
        <NativeSelect id="venueId" name="venueId" required defaultValue="">
          <option value="" disabled>
            Select a venue
          </option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white hover:opacity-90"
      >
        {isPending ? "Clocking in…" : "Clock In"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Convert CheckInDesk**

In `src/components/checkin/check-in-desk.tsx`, make exactly these changes:

1. Change the imports:
```tsx
import { scanCheckIn } from "@/lib/api/checkins";
import { clockOut } from "@/lib/api/coach-shifts";
```
2. Add `onClockedOut` to the props type and destructuring:
```tsx
export function CheckInDesk({
  shift,
  initialCount,
  onClockedOut,
}: {
  shift: Shift;
  initialCount: number;
  onClockedOut: () => void;
}) {
```
3. In `handleClockOut`, call it after a successful clock-out:
```tsx
  function handleClockOut() {
    startClockOutTransition(async () => {
      const result = await clockOut({ shiftId: shift.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onClockedOut();
    });
  }
```
Everything else in this file (the scanner, manual-code form, check-in count display) is unchanged — `scanCheckIn`'s and `clockOut`'s signatures are identical between the old and new modules, so no other call site needs editing.

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint "src/app/(app)/page.tsx" src/components/checkin/clock-in-form.tsx src/components/checkin/check-in-desk.tsx`
Expected: clean, 0 problems. If Step 1's unused `clockIn` import note applies, this is where it would surface — remove it if so.

- [ ] **Step 5: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds. `/` should show as `○` (static) in the route summary.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`.

1. Sign in as a coach with no open shift, on a day a session is scheduled. Expected: `ClockInForm` renders. Submit it. Expected: transitions to `CheckInDesk` showing 0 checked in (or a fresh count) — this is the critical check for this plan's Architecture note; if it instead hangs on "Loading…" or stays on the clock-in form, the `onClockedIn`/`refreshShift` wiring is broken.
2. From the check-in desk, scan or manually enter a registered student's login code. Expected: shows "X checked in.", count increments.
3. Click "Clock Out". Expected: transitions back to `ClockInForm` (or "No session today" if none is scheduled anymore) — the critical check for the clock-out half of the same architecture note.
4. If no session is scheduled today at all, confirm the "No session today" message renders instead of either form.
5. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/page.tsx" src/components/checkin/clock-in-form.tsx src/components/checkin/check-in-desk.tsx
git status
git commit -m "feat: convert dashboard and clock-in desk to Supabase session/data layer"
```

The `git status` check confirms only these 3 files are staged.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds with `/` showing `○`.
- [ ] Step 3: Manual verification confirms both transitions (clock-in → desk, clock-out → form) actually happen without a page reload.

**Next Plan 2b task** (not part of this plan — separately planned): the remaining detail pages with dynamic route params (`/venues/[venueId]`, `/classes/[classId]`, `/coaches/[coachId]`), `/coaches/new`, `/classes/new`, `/classes/[classId]/attendance`, `/payroll`.

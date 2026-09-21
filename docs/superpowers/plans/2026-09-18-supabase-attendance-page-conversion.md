# Supabase Attendance Page Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `src/app/(app)/classes/[classId]/attendance/page.tsx` and `src/components/attendance/attendance-roster.tsx` to Plan 2a's Supabase-based client-side data layer. **This is the last unconverted page in Plan 2b** — once done, every page in the app uses the Supabase session/data layer end to end.

**Architecture:**

1. **`canAccessClass` is dropped here too, and here the reasoning IS accurate** (unlike the class-detail slice's plan, which wrongly generalized this same claim to the `Class` table itself — see that slice's memory entry before doubting this). Plan 2a finding #6 specifically states `AttendanceSession`/`AttendanceRecord` RLS enforces the identical check `canAccessClass` used to perform, confirmed directly against `prisma/migrations/20260914110420_rls_class_membership_tables/migration.sql`'s `attendance_session_access`/`attendance_record_access` policies (`is_admin() or exists(ClassAssignment...)`). `getRosterWithSession` will correctly return `null` for a class a coach has no access to — real RLS-backed not-found, not the `Class`-table gap the prior slice hit.
2. **Both `params` and `searchParams` are needed simultaneously for the first time** — `classId` (route param) and `date` (query param, defaults to today). Both via `use()`, following the already-proven pattern from Slice 3 (`params`) and Slice 11/payroll (`searchParams`).
3. **A real runtime crash, already found and documented in memory, fixed here:** the old page does `session?.submittedAt?.toISOString()`. `submittedAt` becomes a Supabase `string` (not a Prisma `Date`) once converted — `AttendanceRoster`'s `initialSubmittedAt` prop already expects `string | null`, so the fix is simply to stop calling `.toISOString()` and pass the string through unchanged.
4. **`markAttendanceRecord` needs an explicit `coachId` first argument** (`@/lib/api/attendance`'s signature differs from the old Server Action, which derived it from the session server-side) — `AttendanceRoster` needs a new `coachId` prop, threaded from the page.

All data functions already exist verbatim in `@/lib/api/attendance.ts` — no new backend work.

**Tech Stack:** Next.js App Router, React `use()` (both `params` and `searchParams`) + `useEffect`/`useState`.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md`.

## Global Constraints

- No UI redesign.
- `useRequireCoach()` (any coach — matches the old page's access model, now backed entirely by RLS on `AttendanceSession`/`AttendanceRecord`, no client-side gate needed).
- The fetch effect resets `data`/`error` on any `classId`/`sessionDate` change (both are legitimate navigation triggers — changing the date picker, or a future class-to-class link) and depends on derived primitives only (`ready`, `classId`, `sessionDate`) — never the `coach` object.
- `.catch()` on the fetch, error rendered before loading.
- `session?.submittedAt` is passed through as-is (already a `string | null`) — **do not** call `.toISOString()` on it.
- `markAttendanceRecord` is called as `markAttendanceRecord(coachId, input)`; `submitAttendanceSession(input)`/`reopenAttendanceSession(input)` keep their original single-argument shape (unchanged signatures).
- `src/lib/authorization.ts` (`canAccessClass`) is not imported — this removes its last remaining caller in the app (confirm via grep in review: no other file should import it after this).
- `src/actions/attendance.ts`, `src/data/attendance.ts` untouched.
- No new test framework or script. Browser automation has worked in this environment recently (via the login page's "Quick demo login" buttons) — use it for manual verification if available; otherwise static verification, disclosed plainly.

## File Structure

- Modify: `src/app/(app)/classes/[classId]/attendance/page.tsx`
- Modify: `src/components/attendance/attendance-roster.tsx`

## Task 1: Convert the attendance page and roster

**Files:**
- Modify: `src/app/(app)/classes/[classId]/attendance/page.tsx`
- Modify: `src/components/attendance/attendance-roster.tsx`

**Interfaces:**
- Consumes (pre-existing, from Plan 2a): `useRequireCoach()` from `@/lib/supabase/session`; `getRosterWithSession(classId, sessionDate)`, `markAttendanceRecord(coachId, input)`, `submitAttendanceSession(input)`, `reopenAttendanceSession(input)` from `@/lib/api/attendance`.

- [ ] **Step 1: Convert the attendance page**

Replace the entire contents of `src/app/(app)/classes/[classId]/attendance/page.tsx` with:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getRosterWithSession } from "@/lib/api/attendance";
import { getSingaporeTodayString, formatDateForDisplay } from "@/lib/dates";
import { formatClassLabel } from "@/lib/format";
import { AttendanceRoster } from "@/components/attendance/attendance-roster";

type RosterData = Awaited<ReturnType<typeof getRosterWithSession>>;

export default function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { classId } = use(params);
  const { date } = use(searchParams);
  const sessionDate = date ?? getSingaporeTodayString();
  const coach = useRequireCoach();
  const [data, setData] = useState<RosterData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setData(undefined);
    setError(null);
    getRosterWithSession(classId, sessionDate)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this class's attendance.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, classId, sessionDate]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (data === null) notFound();

  const { class: cls, session, roster } = data;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{formatClassLabel(cls)}</h1>
        <p className="text-sm text-muted-foreground">
          {cls.venue.name} · {formatDateForDisplay(sessionDate)}
        </p>
      </div>
      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students are enrolled in this class yet.</p>
      ) : (
        <AttendanceRoster
          coachId={coach.id}
          classId={classId}
          sessionDate={sessionDate}
          initialRoster={roster.map((r) => ({
            student: { id: r.student.id, name: r.student.name },
            record: r.record ? { status: r.record.status, excused: r.record.excused } : null,
          }))}
          initialSessionId={session?.id ?? null}
          initialSubmittedAt={session?.submittedAt ?? null}
          markedByCoachName={session?.markedByCoach?.name ?? null}
        />
      )}
    </div>
  );
}
```

Note: no `.toISOString()` on `session?.submittedAt` — see this plan's Architecture note #3.

- [ ] **Step 2: Convert AttendanceRoster**

In `src/components/attendance/attendance-roster.tsx`, make exactly these changes:

1. Change the import: `import { markAttendanceRecord, submitAttendanceSession, reopenAttendanceSession } from "@/lib/api/attendance";`
2. Add `coachId` to the props type and destructuring:
```tsx
export function AttendanceRoster({
  coachId,
  classId,
  sessionDate,
  initialRoster,
  initialSessionId,
  initialSubmittedAt,
  markedByCoachName,
}: {
  coachId: string;
  classId: string;
  sessionDate: string;
  initialRoster: RosterEntry[];
  initialSessionId: string | null;
  initialSubmittedAt: string | null;
  markedByCoachName: string | null;
}) {
```
3. In `handleSelect`, thread `coachId` into the call: `markAttendanceRecord(coachId, { classId, sessionDate, studentId, status })`.

Everything else in this file is unchanged — `submitAttendanceSession`/`reopenAttendanceSession` keep their original single-argument shape, and this component already manages its own optimistic local state (`statuses`, `sessionId`, `submittedAt`) with no `router.refresh()` to fix.

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit` — expect clean.
Run: `npx eslint "src/app/(app)/classes/[classId]/attendance/page.tsx" src/components/attendance/attendance-roster.tsx` — expect 0 problems.

- [ ] **Step 4: Confirm the app builds**

Run: `npx next build --turbopack` (skip `prisma migrate deploy` if the database is unreachable — see project memory's P1001 gotcha).
Expect success.

- [ ] **Step 5: Confirm canAccessClass has no remaining callers**

Run: `grep -rn "canAccessClass" src` — expect zero matches outside `src/lib/authorization.ts`'s own definition (a later cleanup plan's job to delete the now-fully-dead file, not this one's).

- [ ] **Step 6: Manual verification**

Run: `npm run dev`.

1. Sign in as a coach assigned to a class with enrolled students, navigate to that class → "Take attendance". Expected: shows today's roster, matching the old page.
2. Mark a student present/late/absent. Expected: updates immediately, no reload.
3. Mark everyone, click "Save Attendance". Expected: session locks, shows "Taken by <name>".
4. Click "tap to edit" to reopen. Expected: unlocks, `submittedAt` clears — this is the critical check for the `.toISOString()` fix; if this crashes or shows a garbled date, the fix is wrong or missing.
5. Sign in as a coach with no relationship to this class, navigate to the same URL directly. Expected: not-found (RLS-backed, genuinely — unlike the `Class`-table gap found in the prior slice, this one should actually work).
6. If browser automation is available and working, use it. If not, disclose exactly which checks weren't performed live.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/classes/[classId]/attendance/page.tsx" src/components/attendance/attendance-roster.tsx
git status
git commit -m "feat: convert attendance page to Supabase session/data layer"
```

---

## Verification (whole plan)

- [ ] `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds.
- [ ] Manual verification confirms the reopen-after-submit flow doesn't crash (the `.toISOString()` fix), and RLS-backed not-found works for an unrelated coach.

**This closes out Plan 2b entirely.** Next up (not part of this plan): Plan 2c (new Notifications page) and Plan 2d (cutover/cleanup — delete old NextAuth/Prisma-runtime code, static export, CI deploy, drop `Coach.passwordHash`) are not written yet.

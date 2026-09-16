# Supabase Student Profile Page Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `(app)/students/[studentId]/page.tsx` (the coach-facing student profile) to Plan 2a's Supabase-based client-side data layer, including converting its shared `StudentProfileContent` component (which the still-unconverted `/student` portal page also renders) and fixing one resulting cross-page type incompatibility.

**Architecture:** The page itself follows the now-proven pattern: `useRequireCoach()` (not `useRequireAdmin()` — this page is open to any coach, matching the original's `requireCoach()` call and the RLS design's "admin + assigned coach" access model) plus `use(params)` for the dynamic route segment (reusing the curriculum-detail-page template). One new wrinkle: `getStudentProfile` can itself legitimately return `null` (student not found, or RLS hides it from this coach) — this needs a genuine 3-state distinction (`undefined` = not yet fetched, `null` = fetched and not visible, object = fetched and visible), not the 2-state `T[] | null` pattern every prior list page used, since collapsing "still loading" and "confirmed not found" into the same `null` value would make a real 404 show "Loading…" forever.

The bigger piece: `StudentProfileContent` (`src/components/students/student-profile-content.tsx`) is itself an `async function` Server Component today — it `await`s `generateQrDataUrl()` internally. A Client Component page cannot import and render a Server Component directly (only the reverse), so this component must convert too. This is safe: `generateQrDataUrl` (`src/lib/qr.ts`) is explicitly documented as isomorphic and already has a working client-side call site elsewhere in this codebase (the registration flow) — the conversion is a straightforward move from a top-level `await` to a `useEffect`/`useState` pair, matching every other async-in-a-component pattern this plan-lineage has already established.

`StudentProfileContent` is also rendered by `(student)/student/page.tsx` (the student's own self-view — explicitly documented as shared in the component's own comment). That page is **not** converted by this plan (it needs its own layout conversion first — `(student)/layout.tsx` — mirroring how `/venues` needed `(app)/layout.tsx` converted before it could work; that's a separate, not-yet-scoped slice). But converting the shared component changes its prop types to the new Supabase-generated shape (e.g. `registeredAt` becomes a `string`, not Prisma's `Date`), which breaks `next build`'s type-check on `/student/page.tsx` unless its own `getStudentProfile` import is also repointed at the new module. This one-line fix is safe and necessary, not scope creep: `(student)/layout.tsx` already unconditionally redirects to `/login` before `/student/page.tsx`'s own body ever executes (same reasoning already used for the curriculum `force-dynamic` fix in the venues-page plan) — the change has zero observable effect on anything reachable today, it only prevents a build failure this plan's own change would otherwise cause.

**A correctness improvement that falls out for free, not something this plan adds:** the original page had no authorization check at all for *which* student a signed-in coach could view — any coach could open any student's profile by URL. The new RLS-backed `getStudentProfile` naturally restricts this to admin + assigned coaches (per the migration spec's already-documented design), simply because it queries through RLS instead of an unrestricted Prisma call. Nothing in this plan adds that check explicitly; it's a consequence of the data source switching that every task in this lineage has made.

**Tech Stack:** Next.js App Router, React 19's `use()` hook (already proven in the curriculum plan), `useEffect`/`useState` — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice. The spec's own RLS table explicitly describes the "admin + assigned coach" Student access model this plan's data-source switch now actually enforces.

## Global Constraints

- No UI redesign — every visual element on the student profile page and its shared content component stays pixel-identical; only the underlying session/data mechanism changes, plus the same loading/error states every prior conversion has added. The QR code section simply doesn't render until it's ready (no explicit loading placeholder for it specifically — a smaller, secondary piece of an already-loading page, not worth its own loading state).
- Gating stays `useRequireCoach()` (any coach), matching the original's `requireCoach()` — do not tighten to admin-only. The admin-only `LoginCodeCard` remains a per-element conditional inside the render (`coach.isAdmin && <LoginCodeCard .../>`), exactly as today, not a page-level gate.
- `src/lib/session.ts`, `src/data/students.ts`, and `src/actions/students.ts` are left completely untouched — dead code once nothing imports them, but deletion is Plan 2d's job.
- `(student)/student/page.tsx` gets exactly one line changed (its `getStudentProfile` import path) — nothing else in that file, or in `(student)/layout.tsx`, is touched. Do not attempt to convert the student portal in this plan.
- Reuse Plan 2a's existing functions verbatim: `useRequireCoach` (`src/lib/supabase/session.tsx`), `getStudentProfile` and `regenerateLoginCode` (`src/lib/api/students.ts`). Do not modify their signatures or behavior.
- No new test framework or script — this is UI/routing behavior. Verification is manual: run the dev server and exercise the page by hand (browser automation is currently broken in this environment due to an unrelated extension conflict — see project memory; static verification via `tsc`/`eslint`/`next build` substitutes where live interaction isn't possible).

---

## File Structure

- Modify: `src/app/(app)/students/[studentId]/page.tsx` — convert to a Client Component using `useRequireCoach()` + `use(params)` + `useEffect`/`useState`
- Modify: `src/components/students/student-profile-content.tsx` — convert from an `async` Server Component to a Client Component
- Modify: `src/components/students/login-code-card.tsx` — swap one import
- Modify: `src/app/(student)/student/page.tsx` — swap one import (the one exception to "don't touch other pages," required by this plan's own change — see Architecture above)

## Task 1: Convert the student profile page and its shared component

**Files:**
- Modify: `src/app/(app)/students/[studentId]/page.tsx`
- Modify: `src/components/students/student-profile-content.tsx`
- Modify: `src/components/students/login-code-card.tsx`
- Modify: `src/app/(student)/student/page.tsx`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a — do not modify): `useRequireCoach(): CurrentCoach | null` from `@/lib/supabase/session`; `getStudentProfile(studentId: string): Promise<{student: Student; checkIns: CheckIn[]} | null>` and `regenerateLoginCode(studentId: string): Promise<ActionResult<{loginCode: string}>>` from `@/lib/api/students`; `generateQrDataUrl(code: string): Promise<string>` from `@/lib/qr` (already isomorphic, unmodified).
- Produces: nothing new — this task only rewires existing UI to existing functions.

- [ ] **Step 1: Convert the shared student profile content component**

Replace the entire contents of `src/components/students/student-profile-content.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { generateQrDataUrl } from "@/lib/qr";
import { getInitials, formatLevel, EMERGENCY_CONTACT_LABELS } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrDisplay } from "@/components/registration/qr-display";
import type { getStudentProfile } from "@/lib/api/students";

type StudentProfileData = NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>;

// Shared between the coach-facing student profile (/students/[id]) and the
// student's own self-view (/student) — same data, same read-only rendering.
export function StudentProfileContent({ student, checkIns }: StudentProfileData) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    generateQrDataUrl(student.loginCode).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [student.loginCode]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{student.name}</h1>
            {student.status !== "ACTIVE" && (
              <Badge variant={student.status === "REMOVED" ? "destructive" : "secondary"}>{student.status}</Badge>
            )}
            {student.isMapStudent && <Badge variant="outline">MAP student</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatLevel(student.level)} · {student.schoolName}
          </p>
        </div>
      </div>

      {qrDataUrl && <QrDisplay name={student.name} loginCode={student.loginCode} qrDataUrl={qrDataUrl} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{student.contactNumber}</p>
          <p>{student.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {student.emergencyContactName} ({EMERGENCY_CONTACT_LABELS[student.emergencyContactRelationship]}) ·{" "}
          {student.emergencyContactPhone}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Check-in history</h2>
        {checkIns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins recorded yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {checkIns.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-3 py-2">
                <span>{formatDateForDisplay(c.checkInDate)}</span>
                <span className="text-muted-foreground">{c.venue.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Convert the student profile page**

Replace the entire contents of `src/app/(app)/students/[studentId]/page.tsx` with:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRequireCoach } from "@/lib/supabase/session";
import { getStudentProfile } from "@/lib/api/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";
import { LoginCodeCard } from "@/components/students/login-code-card";

type StudentProfileData = Awaited<ReturnType<typeof getStudentProfile>>;

export default function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const coach = useRequireCoach();
  // undefined = not yet fetched (loading); null = fetched, RLS/not-found;
  // object = fetched and visible to this coach. Distinct from `undefined`
  // because getStudentProfile's own real return type already includes
  // `null` as "not found" — collapsing that into the loading state would
  // make a genuine 404 show "Loading…" forever instead of notFound().
  const [data, setData] = useState<StudentProfileData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getStudentProfile(studentId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this student.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, studentId]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (data === null) notFound();

  return (
    <>
      {coach.isAdmin && (
        <div className="mb-4">
          <LoginCodeCard studentId={studentId} initialCode={data.student.loginCode} />
        </div>
      )}
      <StudentProfileContent {...data} />
    </>
  );
}
```

- [ ] **Step 3: Convert the login code card's import**

In `src/components/students/login-code-card.tsx`, replace this import:

```tsx
import { regenerateLoginCode } from "@/actions/students";
```

with:

```tsx
import { regenerateLoginCode } from "@/lib/api/students";
```

No other change needed — this component is already a Client Component, and `regenerateLoginCode`'s call shape and `ActionResult` return type are identical between the old action and Plan 2a's version.

- [ ] **Step 4: Fix the resulting type incompatibility in the student portal page**

In `src/app/(student)/student/page.tsx`, replace this import:

```tsx
import { getStudentProfile } from "@/data/students";
```

with:

```tsx
import { getStudentProfile } from "@/lib/api/students";
```

Nothing else in this file changes — it stays exactly as it is otherwise, including its own `requireStudent()` call and `async` structure. This is required because `StudentProfileContent`'s prop types (Step 1) now come from the new module, and this file renders that component with data from whichever `getStudentProfile` it imports — the old Prisma-typed version (`registeredAt: Date`) is no longer assignable to the new Supabase-typed props (`registeredAt: string`), so `next build`'s type-check fails on this file without this change. This does not make the page work (it's still gated by `(student)/layout.tsx`'s own unconverted, always-redirecting session check — this plan does not touch that layout), it only prevents this plan's own change from breaking the build.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0). If it fails on `src/app/(student)/student/page.tsx` specifically, confirm Step 4 was applied — this is the exact, expected failure mode if it's missing.

Run: `npx eslint "src/app/(app)/students/[studentId]/page.tsx" src/components/students/student-profile-content.tsx src/components/students/login-code-card.tsx "src/app/(student)/student/page.tsx"`
Expected: clean, 0 problems.

- [ ] **Step 6: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds. `/students/[studentId]` will show as `ƒ` (dynamic) in the route summary — expected and correct for a dynamic-param route with no `generateStaticParams()`, same as `/curriculum/[subject]/[level]` and `/venues/[venueId]`, not a regression.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, sign in via the "Admin" quick-login button on `/login`.

1. Navigate to `/students`, click into any student. Expected: `/students/<id>` loads, shows "Loading…" briefly, then the full profile — avatar, name, status/MAP badges, a QR code card (appears slightly after the rest of the page, once `generateQrDataUrl` resolves), contact info, emergency contact, check-in history, and (since signed in as admin) the login-code card with a working "Regenerate" button.
2. Click "Regenerate" on the login code card. Expected: the code changes and a success toast appears (this exercises `regenerateLoginCode` through its real, converted call path).
3. Sign out, sign back in as a non-admin coach ("Coach" quick-login), navigate to a student's profile page directly. Expected: profile loads (any coach can view — this page isn't admin-gated), but the login-code card does **not** appear.
4. Navigate to an invalid student id, e.g. `/students/does-not-exist`. Expected: Next's not-found page (exercises the `data === null` → `notFound()` path).
5. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(app)/students/[studentId]/page.tsx" src/components/students/student-profile-content.tsx src/components/students/login-code-card.tsx "src/app/(student)/student/page.tsx"
git status
git commit -m "feat: convert student profile page and shared content to Supabase session/data layer"
```

The `git status` check confirms only these 4 files are staged.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `git diff --stat be86a9b..HEAD -- src/lib/session.ts src/data/students.ts src/actions/students.ts "src/app/(student)/layout.tsx"` (substitute the actual commit this plan branched from if different — `be86a9b` is the previous plan's final commit, `HEAD` as of this plan's writing) — empty. These files must be byte-identical to before this plan.
- [ ] Step 3: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds.

**Next Plan 2b task** (not part of this plan — separately planned): the student portal (`/student` + `(student)/layout.tsx`) is now the natural next slice — it's the one remaining page this plan's own `StudentProfileContent` conversion already prepared for, needing only its own layout conversion (mirroring `(app)/layout.tsx`'s conversion in the venues-page plan) plus wiring `useRequireStudent()`. After that: `/venues/[venueId]`, `/classes/[classId]`, `/coaches/[coachId]` (more `use(params)` detail pages), `/students/new`, `/payroll`, `/classes/new`, `/classes/[classId]/attendance`, `/coaches/new`, `/checkin/register`.

# Supabase Registration Pages Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the three pages that render `RegistrationFlow` — `(app)/students/new/page.tsx`, `register/page.tsx` (the public QR-linked route), and `(app)/checkin/register/page.tsx` — to Plan 2a's Supabase-based client-side data layer.

**Architecture:** `RegistrationFlow` (`src/components/registration/registration-flow.tsx`) itself needs **zero changes** — it's already a fully generic, environment-agnostic Client Component: it takes `onSubmitAction` as a plain function prop (not tied to any specific action implementation) and `footer` as pre-rendered `ReactNode`, and already calls `generateQrDataUrl` client-side internally. This plan only touches the three pages that render it, each swapping which `onSubmitAction` function they pass in.

**A real, verified architectural requirement, not a style choice:** the old `registerStudent`/`registerAndCheckInStudent` (`src/actions/registration.ts`) are real Next.js Server Actions (`"use server"` directive) — Next has special serialization support letting a Server Component pass a Server Action as a prop to a Client Component, which is why `register/page.tsx` currently works today despite being a plain Server Component. Plan 2a's replacements (`src/lib/api/registration.ts`) are ordinary async functions with no such directive — a Server Component **cannot** pass an ordinary function as a prop to a Client Component (no serialization path exists for arbitrary functions, only for real Server Actions). This means `register/page.tsx` must itself gain `"use client"` once its import changes, not just swap the import — confirmed empirically via `next build --turbopack` succeeding (it would fail at this exact boundary otherwise, not silently degrade).

**One deliberate consistency ruling, not a silent behavior change:** `students/new/page.tsx` originally redirects a non-admin to `/students` specifically; the shared `useRequireAdmin()` hook (already used by every other admin-gated page in this plan-lineage, including `venues/page.tsx`) redirects to `/` instead. This plan uses the shared hook rather than building a one-off custom variant for this one page — the two prior pages that used `if (!coach.isAdmin) redirect(...)` in the old codebase already disagreed with each other on the exact target (`/` for venues, `/students` for this page), so this is resolving a pre-existing inconsistency via the shared hook, not introducing a new one. The destination difference (`/` vs `/students`) is a cosmetically minor UX detail for an edge case (a non-admin coach navigating directly to an admin-only URL), not a functional regression.

**Tech Stack:** Next.js App Router, React `useEffect`/`useState` — no new dependencies, no new patterns beyond what prior Plan 2b slices already established (the two-effect redirect pattern from the student-portal plan is reused for `checkin/register/page.tsx`'s "no open shift" case).

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice. Note the spec's explicit non-goal "Rate-limiting the public registration endpoint" — `register/page.tsx` stays intentionally open/unauthenticated, matching existing project posture; this plan does not add any access control to it.

## Global Constraints

- No UI redesign — every visual element on all three pages stays pixel-identical; only the underlying session/data mechanism changes. `register/page.tsx` needs no loading/error state changes at all (it has no page-level data fetch of its own — only `RegistrationFlow`'s own internal form-submission state, already unchanged).
- `register/page.tsx` remains genuinely public and unauthenticated — do not add any session check, gating, or `SessionProvider`-dependent hook to it. It only needs `"use client"` and the import swap.
- `students/new/page.tsx` uses `useRequireAdmin()` (matching every other admin-gated page in this plan-lineage), accepting the redirect-target change from `/students` to `/` described above as a deliberate, documented consistency decision — do not build a custom variant to preserve the old exact target.
- `checkin/register/page.tsx` keeps its "no open shift → redirect to `/`" behavior exactly, using the same two-effect (fetch + redirect-on-null) pattern already established and reviewed in the student-portal plan.
- `RegistrationFlow` (`src/components/registration/registration-flow.tsx`) is not modified — confirm this directly in review, since it would be an easy file to accidentally touch given it's central to all three pages.
- `src/actions/registration.ts`, `src/data/coach-shifts.ts`, and `src/lib/session.ts` are left completely untouched — dead code once nothing imports them here, but deletion is Plan 2d's job.
- Reuse Plan 2a's existing functions verbatim: `useRequireAdmin`, `useRequireCoach` (`src/lib/supabase/session.tsx`); `registerStudent`, `registerAndCheckInStudent` (`src/lib/api/registration.ts`); `getOpenShiftForCoach` (`src/lib/api/coach-shifts.ts`). Do not modify their signatures or behavior.
- No new test framework or script — this is UI/routing behavior. Verification is manual: run the dev server and exercise each page by hand (browser automation is currently broken in this environment due to an unrelated extension conflict — see project memory; static verification via `tsc`/`eslint`/`next build` substitutes where live interaction isn't possible).

---

## File Structure

- Modify: `src/app/(app)/students/new/page.tsx` — convert to a Client Component using `useRequireAdmin()`
- Modify: `src/app/register/page.tsx` — add `"use client"`, swap import (no session check — stays public)
- Modify: `src/app/(app)/checkin/register/page.tsx` — convert to a Client Component using `useRequireCoach()` + the two-effect fetch/redirect pattern

## Task 1: Convert all three registration-flow pages

**Files:**
- Modify: `src/app/(app)/students/new/page.tsx`
- Modify: `src/app/register/page.tsx`
- Modify: `src/app/(app)/checkin/register/page.tsx`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a — do not modify): `useRequireAdmin(): CurrentCoach | null`, `useRequireCoach(): CurrentCoach | null` from `@/lib/supabase/session`; `registerStudent(input: unknown)`, `registerAndCheckInStudent(input: unknown)`, both `Promise<ActionResult<{studentId, loginCode}>>`, from `@/lib/api/registration`; `getOpenShiftForCoach(coachId: string): Promise<(CoachShift & {venue: Venue}) | null>` from `@/lib/api/coach-shifts`; `RegistrationFlow` (unchanged) from `@/components/registration/registration-flow`.
- Produces: nothing new — this task only rewires existing UI to existing functions.

- [ ] **Step 1: Convert the students/new page**

Replace the entire contents of `src/app/(app)/students/new/page.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { useRequireAdmin } from "@/lib/supabase/session";
import { registerStudent } from "@/lib/api/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buttonVariants } from "@/components/ui/button";

export default function NewStudentPage() {
  const coach = useRequireAdmin();
  if (!coach) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Register a student</h1>
        <p className="text-sm text-muted-foreground">
          Pre-register a student without checking them in right now (e.g. after a phone enquiry).
        </p>
      </div>
      <RegistrationFlow
        onSubmitAction={registerStudent}
        footer={
          <Link href="/students" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to students
          </Link>
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Convert the public register page**

Replace the entire contents of `src/app/register/page.tsx` with:

```tsx
"use client";

import { registerStudent } from "@/lib/api/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { AppLogo } from "@/components/app-logo";

export default function PublicRegisterPage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-[color-mix(in_oklch,var(--gradient-primary-start),white_88%)] to-background px-4 py-10">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <AppLogo size={48} />
          <h1 className="text-lg font-semibold">Study Space Registration</h1>
          <p className="text-sm text-muted-foreground">
            One-time sign-up — after this you&apos;ll get a QR code to bring on every future visit.
          </p>
        </div>
        <RegistrationFlow onSubmitAction={registerStudent} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Convert the checkin/register page**

Replace the entire contents of `src/app/(app)/checkin/register/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireCoach } from "@/lib/supabase/session";
import { getOpenShiftForCoach } from "@/lib/api/coach-shifts";
import { registerAndCheckInStudent } from "@/lib/api/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buttonVariants } from "@/components/ui/button";

type OpenShift = Awaited<ReturnType<typeof getOpenShiftForCoach>>;

export default function RegisterVisitorPage() {
  const router = useRouter();
  const coach = useRequireCoach();
  const [openShift, setOpenShift] = useState<OpenShift | undefined>(undefined);
  const ready = !!coach;

  useEffect(() => {
    if (!ready || !coach) return;
    let cancelled = false;
    getOpenShiftForCoach(coach.id).then((data) => {
      if (!cancelled) setOpenShift(data);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, coach]);

  // Matches the original's redirect("/") when there's no open shift — a
  // separate effect, not an inline call during render, same convention as
  // every other post-fetch redirect in this plan-lineage.
  useEffect(() => {
    if (openShift === null) router.replace("/");
  }, [openShift, router]);

  if (!coach) return null;
  if (openShift === undefined || openShift === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Register new visitor</h1>
        <p className="text-sm text-muted-foreground">Checks them in immediately at {openShift.venue.name}.</p>
      </div>
      <RegistrationFlow
        onSubmitAction={registerAndCheckInStudent}
        footer={
          <Link href="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to check-in desk
          </Link>
        }
      />
    </div>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0). If it fails specifically on `src/app/register/page.tsx` about passing a function prop across a Server/Client boundary, confirm `"use client"` was added — this is the exact, expected failure mode if it's missing.

Run: `npx eslint "src/app/(app)/students/new/page.tsx" src/app/register/page.tsx "src/app/(app)/checkin/register/page.tsx"`
Expected: clean, 0 problems.

- [ ] **Step 5: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds. `/students/new`, `/register`, and `/checkin/register` should all show as `○` (static) in the route summary — confirming all three now have zero remaining server-side dependencies.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`.

1. Navigate directly to `http://localhost:3000/register` (no login needed — this route is public). Fill out the form and submit. Expected: on success, shows the QR code display with the new login code — confirms `registerStudent` and the already-unchanged `generateQrDataUrl` client-side call both work through the real Edge Function path.
2. Sign in via the "Admin" quick-login button, navigate to `/students/new`. Fill out the form and submit. Expected: same QR success screen, plus a "Back to students" link.
3. Sign in via the "Coach" quick-login button (non-admin), navigate to `/students/new` directly. Expected: redirected to `/` (the documented, deliberate consistency change from the original's `/students` target).
4. While signed in as a coach with an open shift (e.g. after clocking in — see the coach-shifts module's own verify script for how to reach this state, or check via `prisma.coachShift.findFirst({where:{status:"OPEN"}})`), navigate to `/checkin/register`. Fill out the form. Expected: registers and immediately checks in the visitor, shows the QR success screen with a "Back to check-in desk" link.
5. While signed in as a coach with **no** open shift, navigate to `/checkin/register` directly. Expected: redirected to `/`.
6. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/students/new/page.tsx" src/app/register/page.tsx "src/app/(app)/checkin/register/page.tsx"
git status
git commit -m "feat: convert registration flow pages to Supabase session/data layer"
```

The `git status` check confirms only these 3 files are staged — in particular, confirm `src/components/registration/registration-flow.tsx` is **not** in the diff.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `git diff --stat b56243f..HEAD -- src/actions/registration.ts src/data/coach-shifts.ts src/lib/session.ts src/components/registration/registration-flow.tsx` (substitute the actual commit this plan branched from if different — `b56243f` is the previous plan's final commit, `HEAD` as of this plan's writing) — empty. These files must be byte-identical to before this plan.
- [ ] Step 3: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds with all three pages showing `○`.

**Next Plan 2b task** (not part of this plan — separately planned): `src/app/(app)/page.tsx` (the coach dashboard/clock-in desk — the landing page immediately after login, and the highest-priority remaining page since it's currently broken for every real coach) — plan already written at `docs/superpowers/plans/2026-09-17-supabase-dashboard-clockin-conversion.md`. After that: the remaining detail pages with dynamic route params (`/venues/[venueId]`, `/classes/[classId]`, `/coaches/[coachId]`), `/payroll`, `/classes/new`, `/classes/[classId]/attendance`, `/coaches/new`.

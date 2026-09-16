# Supabase Student Portal Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the student portal — `(student)/layout.tsx` and `(student)/student/page.tsx`, the entire `(student)` route group — to Plan 2a's Supabase-based client-side data layer, completing the work the student-profile-page plan already set up (its shared `StudentProfileContent` component is already converted and ready).

**Architecture:** `(student)/layout.tsx` converts from a server-side `getCurrentStudent()`/`redirect()` check to `useRequireStudent()`, mirroring exactly how `(app)/layout.tsx` converted to `useRequireCoach()` in the venues-page plan — same shape, same reasoning, just the student-side hook. `(student)/student/page.tsx` converts to `useRequireStudent()` plus the same `undefined`/`null`/loaded 3-state data pattern the student-profile-page plan established (since `getStudentProfile` can itself return `null`), reusing the already-converted `StudentProfileContent` unchanged.

**One deliberate behavior difference from the coach-facing student profile page, preserved not defaulted:** the original `(student)/student/page.tsx` redirects to `/login` when `getStudentProfile` returns `null`, rather than showing `notFound()` (which is what the coach-facing `/students/[studentId]` page does for the same condition). This is an intentional, pre-existing distinction — a student whose own account can't be found (e.g. removed after their session was issued) is bounced back to sign in again, not shown a generic 404 for their own profile. The redirect fires from a dedicated `useEffect` (matching the convention `useRequireStudent`/`useRequireCoach` themselves use for their own redirects — a side effect belongs in an effect, not inline during render), using `router.replace()` (not `.push()`) to avoid adding a broken back-button entry, consistent with how the session hooks redirect internally.

**No second-order build effects this time**, unlike the venues-page plan's curriculum discovery: the `(student)` route group has exactly 2 files total (confirmed by listing the directory), and both already have their own direct session check today — nothing in this route group was relying solely on the layout for its dynamic-rendering trigger, so there's no equivalent `force-dynamic` fix needed here.

**Tech Stack:** Next.js App Router, React `useEffect`/`useState` — no new dependencies, no new patterns beyond what the last two plans already established.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — same architecture as every prior Plan 2b slice.

## Global Constraints

- No UI redesign — every visual element on both files stays pixel-identical; only the underlying session/data mechanism changes, plus the same loading/error states every prior conversion has added.
- The `!data` → `redirect("/login")` behavior on `(student)/student/page.tsx` must be preserved exactly as today — do not change it to `notFound()` to "match" the coach-facing page; they are deliberately different.
- `src/lib/session.ts` and `src/data/students.ts` are left completely untouched — dead code once nothing imports them here, but deletion is Plan 2d's job. (`src/lib/api/students.ts`'s `getStudentProfile` is already imported by this page from the prior plan's fix — this plan does not change that import again.)
- Reuse Plan 2a's existing function verbatim: `useRequireStudent` (`src/lib/supabase/session.tsx`). Do not modify its signature or behavior. Reuse `StudentProfileContent` and `getStudentProfile` exactly as the student-profile-page plan already left them — no changes to either file in this plan.
- No new test framework or script — this is UI/routing behavior. Verification is manual: run the dev server and exercise the page by hand (browser automation is currently broken in this environment due to an unrelated extension conflict — see project memory; static verification via `tsc`/`eslint`/`next build` substitutes where live interaction isn't possible).

---

## File Structure

- Modify: `src/app/(student)/layout.tsx` — convert to a Client Component using `useRequireStudent()`
- Modify: `src/app/(student)/student/page.tsx` — convert to a Client Component using `useRequireStudent()` + `useEffect`/`useState`

## Task 1: Convert the student portal layout and page

**Files:**
- Modify: `src/app/(student)/layout.tsx`
- Modify: `src/app/(student)/student/page.tsx`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a and the prior two Plan 2b slices — do not modify): `useRequireStudent(): CurrentStudent | null` from `@/lib/supabase/session`, where `CurrentStudent = {id: string; name: string}`; `getStudentProfile(studentId: string): Promise<{student: Student; checkIns: CheckIn[]} | null>` from `@/lib/api/students`; `StudentProfileContent` from `@/components/students/student-profile-content` (already a Client Component, already accepts `{student, checkIns}` props — unchanged by this plan).
- Produces: nothing new — this task only rewires existing UI to existing functions.

- [ ] **Step 1: Convert the student layout**

Replace the entire contents of `src/app/(student)/layout.tsx` with:

```tsx
"use client";

import { useRequireStudent } from "@/lib/supabase/session";
import { Toaster } from "@/components/ui/sonner";
import { StudentTopBar } from "@/components/student/student-top-bar";

// Deliberately a distinct visual shell from the coach (app) layout — a
// warmer background and a welcoming top bar, since this whole route group
// is a student's own view rather than a coach's working tool. The actual
// data cards (StudentProfileContent) stay identical between the two: the
// underlying attendance/progress presentation was already clean and clear,
// it's the surrounding entry experience that needed to feel different.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = useRequireStudent();
  if (!student) return null;

  return (
    <div className="min-h-svh bg-gradient-to-b from-[color-mix(in_oklch,var(--gradient-primary-start),white_92%)] via-background to-background">
      <StudentTopBar name={student.name} />
      <main className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">{children}</main>
      <Toaster />
    </div>
  );
}
```

- [ ] **Step 2: Convert the student dashboard page**

Replace the entire contents of `src/app/(student)/student/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireStudent } from "@/lib/supabase/session";
import { getStudentProfile } from "@/lib/api/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";

type StudentProfileData = Awaited<ReturnType<typeof getStudentProfile>>;

export default function StudentDashboardPage() {
  const router = useRouter();
  const student = useRequireStudent();
  const [data, setData] = useState<StudentProfileData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!student;

  useEffect(() => {
    if (!ready || !student) return;
    let cancelled = false;
    getStudentProfile(student.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your profile.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, student]);

  // Matches the original's redirect("/login") rather than notFound() — a
  // student whose own profile can't be found (e.g. their account was
  // removed after their session was issued) is bounced back to sign in
  // again, not shown a generic 404. A separate effect, not an inline call
  // during render, since the redirect is a side effect that must happen
  // after commit, same convention useRequireStudent itself uses.
  useEffect(() => {
    if (data === null) router.replace("/login");
  }, [data, router]);

  if (!student) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (data === undefined || data === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return <StudentProfileContent {...data} />;
}
```

Note: while `data === null` (the redirect is pending, before the effect has actually navigated away), the render shows "Loading…" rather than any error or blank state — this avoids a flash of broken content during the brief window before navigation completes.

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint "src/app/(student)/layout.tsx" "src/app/(student)/student/page.tsx"`
Expected: clean, 0 problems.

- [ ] **Step 4: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes).
Expected: succeeds. `/student` should show as `○` (static) in the route summary, matching `/venues`, `/curriculum`, `/students`, and `/login` — confirming it now has zero remaining server-side dependencies.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, sign in via the "Student" quick-login button on `/login`.

1. Confirm you land on `/student` and it does **not** bounce back to `/login` — this is the first time the student portal has actually worked since the login/middleware cutover plan.
2. Confirm the page shows: the top bar with the student's name and a working sign-out button, "Loading…" briefly, then the full profile (avatar, name, badges, QR code appearing slightly after the rest, contact info, emergency contact, check-in history). No login-code card should appear (that's coach/admin-only, on the other student profile page).
3. Click the sign-out button in the student top bar. Expected: navigates to `/login`, and a fresh visit to `/student` afterward redirects to `/login` again (session actually cleared).
4. If browser automation is available and working in this session, use it for the above. If it's still broken (the known extension conflict documented in project memory), note in the report exactly which checks could and couldn't be confirmed live — do not fabricate results for checks that weren't actually performed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(student)/layout.tsx" "src/app/(student)/student/page.tsx"
git status
git commit -m "feat: convert student portal to Supabase session/data layer"
```

The `git status` check confirms only these 2 files are staged.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete.
- [ ] Step 2: `git diff --stat 91ac2a0..HEAD -- src/lib/session.ts src/data/students.ts src/lib/api/students.ts src/components/students/student-profile-content.tsx` (substitute the actual commit this plan branched from if different — `91ac2a0` is the previous plan's final commit, `HEAD` as of this plan's writing) — empty. These files must be byte-identical to before this plan.
- [ ] Step 3: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds with `/student` showing `○`.

**Next Plan 2b task** (not part of this plan — separately planned): the remaining detail pages with dynamic route params (`/venues/[venueId]`, `/classes/[classId]`, `/coaches/[coachId]`), `/students/new`, `/payroll`, `/classes/new`, `/classes/[classId]/attendance`, `/coaches/new`, `/checkin/register`.

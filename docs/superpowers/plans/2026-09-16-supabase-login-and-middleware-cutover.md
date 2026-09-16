# Supabase Login & Middleware Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the login page and both sign-out buttons from NextAuth to the Supabase-Auth-based functions Plan 2a already built (`src/lib/api/auth.ts`, `src/lib/supabase/session.tsx`), and delete `src/middleware.ts` — the mandatory first slice of Plan 2b, since every later page conversion depends on login actually issuing Supabase sessions.

**Architecture:** The login page is already a Client Component driven by `useActionState` — this plan swaps which functions it calls (from `@/actions/coaches`'s NextAuth-backed actions to `@/lib/api/auth`'s Supabase-backed ones) and adds client-side navigation on success, since the new actions return `{success: true}` instead of NextAuth's `signIn()` internally throwing a server-side redirect. Sign-out gets the same treatment in its two call sites. `src/middleware.ts` is deleted outright, matching the project's overarching spec: route gating becomes a client-side redirect-if-no-session check (RLS is the real security boundary; middleware was never more than a UX convenience). All three changes must land together — deleting middleware alone is harmless, but converting login *without* deleting middleware actively breaks a freshly-logged-in user: middleware would still look for a NextAuth session cookie that Supabase-based login never sets, and would bounce them straight back to `/login`.

**Tech Stack:** Next.js App Router, React `useActionState`, `@supabase/supabase-js` (already installed and wired by Plan 2a) — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — specifically the Non-goals entry "Preserving server-side route middleware" (route gating becomes client-side, cosmetic-only; RLS is the real boundary) and the Architecture section's browser/Edge-Function split, which Plan 2a already implements end to end for auth (`coach-login`/`student-login` Edge Functions, `src/lib/api/auth.ts`, `src/lib/supabase/session.tsx`).

## Global Constraints

- No UI redesign — every visual element on the login page and both nav bars stays pixel-identical; only the underlying function calls and navigation change (per the spec's Non-goals: "Every page keeps its current design and layout").
- `src/auth.ts`, `src/auth.config.ts`, `src/lib/session.ts`, and every export in `src/actions/coaches.ts` (including the now-unused `loginAction`/`studentLoginAction`/`quickLoginAction`/`signOutAction`) are left completely untouched. They become dead code once nothing imports the four auth-related exports anymore, but deleting them is Plan 2d's job (see the spec's "What gets removed entirely"), not this plan's — keeps this diff minimal and reviewable.
- After this plan lands, every other existing page (all 15 `(app)/*` pages and the 1 `(student)/*` page) is **expected** to become unusable: their layouts (`(app)/layout.tsx`, `(student)/layout.tsx`) call `getCurrentCoach()`/`getCurrentStudent()`, which read the now-permanently-empty NextAuth session and redirect to `/login` before the page itself ever renders. This is a known, accepted interim state — Plan 2b's subsequent (separately planned) tasks convert those pages. **Do not attempt to fix this in this plan.**
- Reuse Plan 2a's existing functions verbatim — `loginAction`, `studentLoginAction`, `quickLoginAction` (`src/lib/api/auth.ts`) and `signOut` (`src/lib/supabase/session.tsx`). Do not modify their signatures or behavior; they're already implemented and were not touched by this plan's brainstorming.
- No new test framework or script. This plan is pure UI/routing behavior — Plan 1 and Plan 2a's `tsx` verify-script convention covers backend/RLS correctness, which nothing here touches. Verification is manual: run the dev server and exercise every path by hand, exactly as each task's Step specifies.

---

## File Structure

- Modify: `src/app/(auth)/login/page.tsx` — swap 3 action imports, add navigation-on-success
- Modify: `src/components/nav/top-nav.tsx` — swap sign-out to the Supabase version
- Modify: `src/components/student/student-top-bar.tsx` — same, plus add `"use client"` (it's currently a Server Component; calling `signOut()`/`useRouter()` requires the browser)
- Delete: `src/middleware.ts`

## Task 1: Convert login, sign-out, and remove middleware

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/components/nav/top-nav.tsx`
- Modify: `src/components/student/student-top-bar.tsx`
- Delete: `src/middleware.ts`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a — do not modify): `loginAction(prevState, formData)`, `studentLoginAction(prevState, formData)`, `quickLoginAction(role)` from `@/lib/api/auth` (each returns `Promise<{error?: string; success?: true} | undefined>`); `signOut(): Promise<void>` from `@/lib/supabase/session`.
- Produces: nothing new — this task only rewires existing UI to existing functions.

- [ ] **Step 1: Convert the login page**

Replace the entire contents of `src/app/(auth)/login/page.tsx` with:

```tsx
"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, studentLoginAction, quickLoginAction } from "@/lib/api/auth";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const [coachState, coachFormAction, isCoachPending] = useActionState(loginAction, undefined);
  const [studentState, studentFormAction, isStudentPending] = useActionState(studentLoginAction, undefined);
  const [quickCoachState, quickCoachAction, isQuickCoachPending] = useActionState(() => quickLoginAction("coach"), undefined);
  const [quickAdminState, quickAdminAction, isQuickAdminPending] = useActionState(() => quickLoginAction("admin"), undefined);
  const [quickStudentState, quickStudentAction, isQuickStudentPending] = useActionState(() => quickLoginAction("student"), undefined);
  const quickLoginError = quickCoachState?.error ?? quickAdminState?.error ?? quickStudentState?.error;

  // Plan 2a's actions return {success: true} rather than performing a
  // server-side redirect (NextAuth's signIn() used to do this internally,
  // by throwing) — navigation is this page's own responsibility now.
  useEffect(() => {
    if (coachState?.success || quickCoachState?.success || quickAdminState?.success) {
      router.push("/");
    } else if (studentState?.success || quickStudentState?.success) {
      router.push("/student");
    }
  }, [coachState, studentState, quickCoachState, quickAdminState, quickStudentState, router]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-[color-mix(in_oklch,var(--gradient-primary-start),white_92%)] via-muted/30 to-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AppLogo size={56} />
          <div>
            <h1 className="text-lg font-semibold">MAP Coach Portal</h1>
            <p className="text-sm text-muted-foreground">MENDAKI Achievement Programme</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-center text-xs font-medium text-muted-foreground">Quick demo login</p>
          <div className="grid grid-cols-3 gap-2">
            <form action={quickCoachAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full" disabled={isQuickCoachPending}>
                Coach
              </Button>
            </form>
            <form action={quickAdminAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full" disabled={isQuickAdminPending}>
                Admin
              </Button>
            </form>
            <form action={quickStudentAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full" disabled={isQuickStudentPending}>
                Student
              </Button>
            </form>
          </div>
          {quickLoginError ? (
            <p role="alert" className="text-center text-xs text-destructive">
              {quickLoginError}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Signs in instantly with a seeded demo account.</p>
          )}
        </div>

        <Card>
          <Tabs defaultValue="coach">
            <CardHeader>
              <TabsList className="w-full">
                <TabsTrigger value="coach" className="flex-1">
                  Coach
                </TabsTrigger>
                <TabsTrigger value="student" className="flex-1">
                  Student
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="coach" className="space-y-4">
                <CardDescription>Sign in to take attendance and manage your classes.</CardDescription>
                <form action={coachFormAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required autoComplete="current-password" />
                  </div>
                  {coachState?.error && (
                    <p role="alert" className="text-sm text-destructive">
                      {coachState.error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isCoachPending}>
                    {isCoachPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student" className="space-y-4">
                <CardDescription>Enter the code your coach gave you to see your own attendance and progress.</CardDescription>
                <form action={studentFormAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Your code</Label>
                    <Input
                      id="code"
                      name="code"
                      required
                      autoComplete="off"
                      autoCapitalize="characters"
                      placeholder="e.g. GHW7UD"
                      className="text-center text-lg tracking-[0.3em] uppercase"
                    />
                  </div>
                  {studentState?.error && (
                    <p role="alert" className="text-sm text-destructive">
                      {studentState.error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isStudentPending}>
                    {isStudentPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
```

Note on the quick-login bindings: the original file used `quickLoginAction.bind(null, "coach")` because the old `quickLoginAction`'s first parameter *was* `prevState` (matching `useActionState`'s required `(prevState, formData) => ...` shape) with `role` bound ahead of it via a Server Action-specific calling convention. Plan 2a's `quickLoginAction(role: QuickLoginRole)` has a different signature (`role` is the only, first parameter — see `src/lib/api/auth.ts:35`), so `.bind(null, "coach")` no longer produces a valid `useActionState` reducer. The inline `() => quickLoginAction("coach")` above works because TypeScript allows a function with fewer declared parameters to satisfy a type expecting more (the same reason `array.map((x) => x * 2)` doesn't need to declare the index/array parameters) — `useActionState` passes `(prevState, formData)` at call time, but the arrow function simply doesn't declare params to receive them. This is the correct adaptation, not a workaround to revisit later — an earlier draft of this plan declared both params explicitly and dropped them after finding `npx eslint` flagged them as unused (verified directly: this exact code is `eslint`-clean, and `tsc --noEmit`/`npm run build` both pass).

- [ ] **Step 2: Convert the coach nav bar's sign-out**

In `src/components/nav/top-nav.tsx`, replace this import:

```tsx
import { usePathname } from "next/navigation";
```

with:

```tsx
import { usePathname, useRouter } from "next/navigation";
```

and replace this import:

```tsx
import { signOutAction } from "@/actions/coaches";
```

with:

```tsx
import { signOut } from "@/lib/supabase/session";
```

Add a router instance and a handler inside the component body (right after `const pathname = usePathname();`):

```tsx
  const router = useRouter();
  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }
```

Replace the sign-out form:

```tsx
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </form>
```

with a plain button (no form needed — this is a direct client-side call now, not a Server Action submission):

```tsx
          <Button type="button" variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
```

- [ ] **Step 3: Convert the student top bar's sign-out**

`src/components/student/student-top-bar.tsx` has no `"use client"` directive today — add one, since `signOut()`/`useRouter()` both require running in the browser. Replace the entire file with:

```tsx
"use client";

import { LogOut, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase/session";

export function StudentTopBar({ name }: { name: string }) {
  const router = useRouter();
  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="border-b bg-white/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-base font-semibold">{name}</p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
          <LogOut className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Delete middleware**

```bash
git rm src/middleware.ts
```

There is nothing to replace it with in this plan — route gating becomes each page's own client-side check, which is what Plan 2b's later page-conversion tasks add as they convert each page. Until then, the layouts' existing server-side `redirect("/login")` calls (in `(app)/layout.tsx` and `(student)/layout.tsx`, both unmodified by this plan) continue to run — they just now always see a null session, so every page redirects. That's the accepted interim state (see Global Constraints).

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0). If it fails, the most likely cause is a leftover reference to the old `@/actions/coaches` import shape — check the diff against the code above exactly.

Run: `npx eslint "src/app/(auth)/login/page.tsx" src/components/nav/top-nav.tsx src/components/student/student-top-bar.tsx`
Expected: clean, 0 problems. (This plan's code was verified against both checks before being written — a warning here means the diff drifted from what's in this plan.)

- [ ] **Step 6: Manual verification — coach login**

Run: `npm run dev`, open `http://localhost:3000/login`.

1. Click the "Coach" quick-login button. Expected: page navigates to `/`. It's expected to immediately redirect back to `/login` (the interim state — `(app)/layout.tsx` still uses the old, now-always-null NextAuth session) — confirm it does NOT get stuck showing an error, blank page, or crash; a clean bounce back to `/login` is success for this step.
2. Open the browser console and run `await window.supabase?.auth.getSession()` — if `window.supabase` isn't exposed, instead confirm via the Network tab that the `coach-login` Edge Function call returned 200 with a `session` in its response body, and that `localStorage` (Application tab) now has a `sb-<project-ref>-auth-token` entry. This confirms the Supabase session was actually established, independent of what the (not-yet-converted) app pages do with it.
3. Enter `farhan@map.test` / `Coach123!` in the Coach tab's real form and submit. Expected: same as step 1 — brief success, then bounced to `/login` by the old layout check. Confirm no error message appears (an error would mean the credentials or the Edge Function call failed, not the expected interim-state bounce).
4. Submit the Coach tab with a wrong password. Expected: `"Invalid email or password."` renders inline — this path doesn't touch navigation at all, so it must still work exactly as before.

- [ ] **Step 7: Manual verification — student login**

Still on `http://localhost:3000/login`:

1. Click the "Student" quick-login button. Expected: navigates to `/student`, then bounced back to `/login` by `(student)/layout.tsx`'s own check (same accepted interim state).
2. Enter `GHW7UD` (the same seeded code the quick-login button in Step 7.1 uses internally, per `src/lib/api/auth.ts:13`) in the Student tab's form. Expected: same bounce behavior, no error.
3. Submit the Student tab with an invalid code (e.g. `ZZZZZZ`). Expected: `"That code wasn't recognised. Check with your coach and try again."` renders inline.

- [ ] **Step 8: Manual verification — sign-out is unreachable but code is correct**

Both sign-out buttons live inside `(app)/layout.tsx` and `(student)/layout.tsx`, which redirect to `/login` before rendering — so there's no way to actually click either button through the UI until a later Plan 2b task converts at least one protected page. Confirm this step differently: read back `src/components/nav/top-nav.tsx` and `src/components/student/student-top-bar.tsx` and verify the `handleSignOut` function in each calls `await signOut()` (from `@/lib/supabase/session`) followed by `router.push("/login")`, matching Step 2/3 exactly. Note in the task report that sign-out's actual click-through behavior can't be verified until a protected page is converted — this is expected, not a gap to fix here.

- [ ] **Step 9: Confirm the app still builds**

Run: `npm run build`
Expected: succeeds. (This also exercises `prisma migrate deploy` per `package.json`'s `build` script — expected to report the schema already up to date, since this plan makes no database changes.)

- [ ] **Step 10: Commit**

```bash
git add "src/app/(auth)/login/page.tsx" src/components/nav/top-nav.tsx src/components/student/student-top-bar.tsx
git status
git commit -m "feat: cut login and sign-out over to Supabase Auth, remove NextAuth middleware"
```

(`src/middleware.ts`'s removal was already staged by Step 4's `git rm`.)

The `git status` before committing is a check, not a formality — confirm only the 4 expected files (3 modified, 1 deleted) are staged, nothing else.

---

## Verification (whole plan)

- [ ] Step 1: All of Task 1's steps complete, including both manual verification passes.
- [ ] Step 2: `git diff --stat d4b988f..HEAD -- src/auth.ts src/auth.config.ts src/lib/session.ts src/actions/coaches.ts` (substitute the actual commit this plan branched from if different — `d4b988f` is Plan 2a's final commit, the current `HEAD` as of this plan's writing) — empty. These files must be byte-identical to before this plan (Global Constraints).
- [ ] Step 3: `npx tsc --noEmit` and `npm run build` both clean.

**Plan 2b's next task** (not part of this plan — separately planned): convert the first real page (recommend `(app)/venues/page.tsx` and its layout, the simplest of the 15 remaining `(app)/*` pages) to use `SessionProvider`/`useRequireAdmin()` and `src/lib/api/classes.ts`'s `getAllVenuesWithClassCounts()`, which will also be the first page where this plan's sign-out buttons become clickable and verifiable end-to-end.

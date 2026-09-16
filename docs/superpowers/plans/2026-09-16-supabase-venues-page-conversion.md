# Supabase Venues Page Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the first real page — `(app)/venues/page.tsx` — and its shared layout to Plan 2a's Supabase-based client-side data/auth layer, establishing the pattern every later Plan 2b page-conversion task will follow.

**Architecture:** `src/lib/supabase/session.tsx`'s `SessionProvider` gets wired into the app for the first time (at the root layout — purely additive, zero effect on any page that doesn't consume it). `(app)/layout.tsx` converts from a server-side `getCurrentCoach()`/`redirect()` check to the client-side `useRequireCoach()` hook Plan 2a already built. `venues/page.tsx` converts from an `async` Server Component (session check + inline `await` data fetch) to a Client Component using `useRequireAdmin()` plus a plain `useEffect`/`useState` pair for the data fetch — no new abstraction or dependency, since this is the first of 15 remaining pages and it's premature to guess a shared hook's shape from one example. `create-venue-form.tsx` (already a Client Component) just swaps its import from the old `@/actions/venues` to Plan 2a's `@/lib/api/venues` — its call shape is already identical.

**A real consequence of this plan, not a bug to fix here:** `(app)/layout.tsx` currently redirects to `/login` for every request (since the old NextAuth session is permanently null after the previous plan's cutover) — this is what makes every one of the 15 not-yet-converted pages fail *cleanly*. Once this plan converts the layout to recognize a real Supabase session, that shared safety net is gone for the 12 other unconverted pages that have their own direct `requireCoach()`/`requireAdmin()`/`getCurrentCoach()` call (confirmed by checking every page under `(app)/`): they'll still call the old, dead session helper directly in their own Server Component body, which now throws `Error("UNAUTHENTICATED")` instead of being caught by the layout's redirect — Next.js will show its default error boundary instead of a clean bounce to `/login`. This is a real, temporary regression in failure-mode polish for those pages, accepted deliberately (same reasoning as the previous plan: no real users, no deployment yet, zero throwaway code) and resolved page-by-page as each is converted next.

**A second, more concrete consequence found during pre-flight verification, and fixed as part of this plan:** two pages — `curriculum/page.tsx` and `curriculum/[subject]/[level]/page.tsx` — have no auth check of their own at all (curriculum is "open to any coach," by design); their only source of dynamic (per-request) rendering was inherited from `(app)/layout.tsx`'s old server-side cookie read. Converting the layout to a Client Component removes that inherited trigger, so Next.js's build-time static analysis now classifies both curriculum pages as statically prerenderable — and tries to execute their still-unconverted, Prisma-based data fetch *at build time*, which fails without live database access (confirmed directly: `next build` fails on `/curriculum` with a Prisma connection error on this plan's code, but succeeds on the pre-plan code — isolated by `git stash`/`git stash pop` to confirm the regression is real and caused by this plan, not a pre-existing environment issue). This is fixed by adding `export const dynamic = "force-dynamic";` to both files — Next's own documented API for "always render this route per-request, never statically" — which restores their exact pre-existing rendering behavior. This is a build-mode annotation only, not a functional change, and is a direct, necessary consequence of this plan's own layout conversion (not scope creep into unrelated page work) — every other unconverted page has its own auth call and is unaffected.

**Tech Stack:** Next.js App Router, React `useEffect`/`useState`, `@supabase/supabase-js` — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md` — the Architecture section's browser-side data-access model (`src/actions/*.ts`/`src/data/*.ts` functions become plain client-side functions), which Plan 2a already built for this page's exact domain (`src/lib/api/classes.ts`'s `getAllVenuesWithClassCounts`, `src/lib/api/venues.ts`'s `createVenue`).

## Global Constraints

- No UI redesign — every visual element on the venues page and the app layout stays pixel-identical; only the underlying session/data mechanism changes.
- `src/lib/session.ts`, `src/actions/venues.ts`, and every other untouched `src/actions/*`/`src/data/*` file are left completely untouched — they become dead code for the pages that stop importing them, but deletion is Plan 2d's job. The two `export const dynamic = "force-dynamic";` additions to the curriculum pages are the one exception to "don't touch other pages" — they're a build-mode annotation restoring pre-existing behavior, not a functional or business-logic change (see Architecture above).
- Reuse Plan 2a's existing functions verbatim: `useRequireCoach`, `useRequireAdmin`, `SessionProvider` (`src/lib/supabase/session.tsx`); `getAllVenuesWithClassCounts` (`src/lib/api/classes.ts`); `createVenue` (`src/lib/api/venues.ts`). Do not modify their signatures or behavior.
- The other 12 unconverted pages with their own direct session check (every `(app)/*` page except `curriculum/page.tsx` and `curriculum/[subject]/[level]/page.tsx`, confirmed by checking each one) are **expected** to start showing an error boundary instead of a clean redirect once this plan lands (see Architecture above). Do not attempt to fix this here — it is out of scope and resolved by later, separately-planned page-conversion tasks.
- No new test framework or script — this is UI/routing behavior. Verification is manual: run the dev server and exercise the page by hand.

---

## File Structure

- Modify: `src/app/layout.tsx` — wrap `{children}` in `SessionProvider`
- Modify: `src/app/(app)/layout.tsx` — convert to a Client Component using `useRequireCoach()`
- Modify: `src/app/(app)/venues/page.tsx` — convert to a Client Component using `useRequireAdmin()` + `useEffect`/`useState`
- Modify: `src/components/venues/create-venue-form.tsx` — swap one import
- Modify: `src/app/(app)/curriculum/page.tsx` and `src/app/(app)/curriculum/[subject]/[level]/page.tsx` — add `export const dynamic = "force-dynamic";` (build-mode annotation only, restores pre-existing behavior — see Architecture above)

## Task 1: Wire SessionProvider and convert the venues page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/(app)/venues/page.tsx`
- Modify: `src/components/venues/create-venue-form.tsx`
- Modify: `src/app/(app)/curriculum/page.tsx`
- Modify: `src/app/(app)/curriculum/[subject]/[level]/page.tsx`

**Interfaces:**
- Consumes (all pre-existing, from Plan 2a — do not modify): `SessionProvider` (children: ReactNode), `useRequireCoach(): CurrentCoach | null`, `useRequireAdmin(): CurrentCoach | null` — all from `@/lib/supabase/session`, where `CurrentCoach = { id: string; isAdmin: boolean; name: string; email: string }`; `getAllVenuesWithClassCounts(): Promise<Array<Venue & { _count: { classes: number; checkIns: number } }>>` from `@/lib/api/classes`; `createVenue(input: unknown): Promise<ActionResult<{ venueId: string }>>` from `@/lib/api/venues`.
- Produces: nothing new — this task only rewires existing UI to existing functions.

- [ ] **Step 1: Wire SessionProvider into the root layout**

In `src/app/layout.tsx`, add the import:

```tsx
import { SessionProvider } from "@/lib/supabase/session";
```

and wrap the body's `{children}`:

```tsx
      <body className={`${plusJakartaSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
```

- [ ] **Step 2: Convert the app layout**

Replace the entire contents of `src/app/(app)/layout.tsx` with:

```tsx
"use client";

import { Toaster } from "@/components/ui/sonner";
import { useRequireCoach } from "@/lib/supabase/session";
import { TopNav } from "@/components/nav/top-nav";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // useRequireCoach() redirects client-side once it confirms there's no
  // session (see src/lib/supabase/session.tsx) — it returns null both while
  // still resolving AND once redirecting, so rendering nothing until it's
  // truthy is the closest client-side equivalent of the old server-side
  // "redirect before render" behavior.
  const coach = useRequireCoach();
  if (!coach) return null;

  return (
    <div className="flex min-h-svh flex-col">
      <TopNav coach={coach} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-4 md:pb-8">{children}</main>
      <BottomTabBar profileHref={`/coaches/${coach.id}`} isAdmin={coach.isAdmin} />
      <Toaster />
    </div>
  );
}
```

- [ ] **Step 3: Convert the venues page**

Replace the entire contents of `src/app/(app)/venues/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAdmin } from "@/lib/supabase/session";
import { getAllVenuesWithClassCounts } from "@/lib/api/classes";
import { Card, CardContent } from "@/components/ui/card";
import { CreateVenueForm } from "@/components/venues/create-venue-form";

type VenueWithCounts = Awaited<ReturnType<typeof getAllVenuesWithClassCounts>>[number];

export default function VenuesPage() {
  const coach = useRequireAdmin();
  const [venues, setVenues] = useState<VenueWithCounts[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Derived boolean, not the coach object itself: session.tsx's context can
  // hand back a new coach object reference across re-resolutions (e.g. the
  // documented double-resolve-on-mount in Plan 2a's final review, Minor M3)
  // even when the underlying session hasn't actually changed — depending on
  // `ready` instead of `coach` avoids re-fetching venues on every such
  // reference change while still fetching exactly once real access starts.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Venues</h1>
        <p className="text-sm text-muted-foreground">MENDAKI centres where classes are held.</p>
      </div>

      <CreateVenueForm />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : venues === null ? (
        <p className="text-sm text-muted-foreground">Loading venues…</p>
      ) : venues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No venues yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent>
                  <p className="font-medium">{venue.name}</p>
                  {venue.address && <p className="text-sm text-muted-foreground">{venue.address}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {venue._count.classes} classes · {venue._count.checkIns} check-ins
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Convert the create-venue form**

In `src/components/venues/create-venue-form.tsx`, replace this import:

```tsx
import { createVenue } from "@/actions/venues";
```

with:

```tsx
import { createVenue } from "@/lib/api/venues";
```

No other change needed — `createVenue`'s call shape and `ActionResult` return type are identical between the old action and Plan 2a's version (confirmed directly: both are `createVenue(input: unknown): Promise<{success:true,data:{venueId:string}} | {success:false,error:string}>`), and this component was already a Client Component doing its own `router.push` on success.

- [ ] **Step 5: Restore curriculum's dynamic rendering**

In `src/app/(app)/curriculum/page.tsx`, add right after the imports:

```tsx
export const dynamic = "force-dynamic";
```

In `src/app/(app)/curriculum/[subject]/[level]/page.tsx`, add the same line right after the imports, before the page component's own definition.

This is required, not optional — without it, `npx next build` fails while prerendering `/curriculum` (it tries to run `getSubjectLevelCombos()`'s Prisma query at build time once `(app)/layout.tsx` stops being the thing that was forcing this route dynamic — see this plan's Architecture section for the full mechanism). Confirm this is really needed and not a stale assumption: temporarily skip this step, run `npx next build --turbopack`, and confirm it fails specifically on `/curriculum` with a Prisma connection error — then add the two lines and confirm the build passes.

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: clean (no output, exit 0).

Run: `npx eslint src/app/layout.tsx "src/app/(app)/layout.tsx" "src/app/(app)/venues/page.tsx" src/components/venues/create-venue-form.tsx "src/app/(app)/curriculum/page.tsx" "src/app/(app)/curriculum/[subject]/[level]/page.tsx"`
Expected: clean, 0 problems.

- [ ] **Step 7: Manual verification — venues page works end to end**

Run: `npm run dev`, open `http://localhost:3000/login`, sign in via the "Admin" quick-login button (an admin coach — the venues page redirects non-admins to `/`).

1. Confirm you land on `/` and it does NOT bounce back to `/login` this time (this is the first page to actually stay reachable after a real login — everything else still redirects, per this plan's accepted interim state).
2. Navigate to `http://localhost:3000/venues` directly. Expected: the page loads, shows the nav bar (top nav with your name/avatar), and after a brief "Loading venues…" message, shows the real list of seeded venues with their class/check-in counts.
3. Use the "Add venue" form to create a venue with a unique name (e.g. `Verify Venues Page <timestamp>`). Expected: on success, you're navigated to `/venues/<newVenueId>` — confirm no error appears and the URL changes (the detail page itself isn't converted yet, so it's fine if `/venues/[venueId]` shows its own old broken/redirecting behavior — this step is only checking that the create action itself succeeded and returned a real id).
4. Navigate back to `/venues`. Expected: the venue you just created appears in the list.
5. Sign out via the top nav's sign-out button (this is the **first time** this button is actually reachable and clickable, since every previous page redirected before rendering the nav) — confirm it navigates to `/login` and that a fresh visit to `/venues` afterward redirects to `/login` again (session actually cleared).
6. Sign back in as a *non-admin* coach (the "Coach" quick-login button) and navigate to `/venues` directly. Expected: redirected to `/` (the `useRequireAdmin()` non-admin path), not shown the venues page.
7. Navigate to any other, not-yet-converted page (e.g. `/students`) while signed in as admin. Expected (per this plan's accepted interim state): an error/crash screen, not a clean redirect. Confirm it's an error screen and not something more alarming (e.g. a genuinely broken app-wide crash) — this is the documented, accepted regression, not a new bug to chase.

- [ ] **Step 8: Confirm the app builds**

Run: `npx next build --turbopack` (skip `npm run build`'s `prisma migrate deploy` step if the database is unreachable on this network — see project memory's P1001 gotcha; this plan makes no schema changes, so the migration step is not meaningful here).
Expected: succeeds, all routes compile. `/venues` and `/login` should show as `○` (static) in the route summary — confirming they have zero remaining server-side dependencies, matching the end-state architecture. `/curriculum` and `/curriculum/[subject]/[level]` should show as `ƒ` (dynamic), matching their pre-existing behavior.

- [ ] **Step 9: Commit**

```bash
git add src/app/layout.tsx "src/app/(app)/layout.tsx" "src/app/(app)/venues/page.tsx" src/components/venues/create-venue-form.tsx "src/app/(app)/curriculum/page.tsx" "src/app/(app)/curriculum/[subject]/[level]/page.tsx"
git status
git commit -m "feat: convert venues page and app layout to Supabase session/data layer"
```

The `git status` check confirms only these 6 files are staged.

---

## Verification (whole plan)

- [ ] Step 1: Task 1's steps all complete, including manual verification.
- [ ] Step 2: `git diff --stat a3bf253..HEAD -- src/lib/session.ts src/actions/venues.ts` (substitute the actual commit this plan branched from if different — `a3bf253` is the previous plan's final commit, `HEAD` as of this plan's writing) — empty. These files must be byte-identical to before this plan.
- [ ] Step 3: `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds.

**Next Plan 2b task** (not part of this plan — separately planned): convert the next simplest page's actual business logic (curriculum's `force-dynamic` annotation in this plan only preserves its *existing* NextAuth-based behavior — it still needs its own real conversion to `useRequireCoach`/`src/lib/api/curriculum.ts` like every other page). Good candidates, in roughly increasing order of complexity: `/curriculum` (read-only, no forms, and already has a real precedent to follow now), `/students` (admin-gated list, more fields), then the detail pages (`/venues/[venueId]`, `/classes/[classId]`, etc., which introduce a dynamic route param the data-fetching `useEffect` needs to depend on — the first page where the "derive a stable boolean, don't depend on an object reference" lesson from this plan's `venues/page.tsx` will need a param-aware variant, and where the "does converting this page's own layout affect a sibling page's build-time staticness" check from this plan should be repeated).

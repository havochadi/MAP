# Notifications Page Implementation Plan (Plan 2c)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the new `/notifications` page the migration spec calls for (`docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md:200-207`) — a real, visible list of `CheckInNotification` rows (today these are an invisible audit trail; a `console.log` inside the RPCs that create them is the only current "delivery"). No real SMS/email — this page just makes the existing simulated-delivery records visible, per the spec's explicit non-goal on real messaging providers.

**Architecture:** `CheckInNotification` rows and their RLS (`checkin_notification_select`/`checkin_notification_insert`) already exist and are already being written — `scan_check_in` and `register_and_checkin_student` (both Plan 1 RPCs, already live) create a row every time a MAP student checks in, with `message` already fully pre-formatted server-side (e.g. `"Aisha has checked in at Tampines Centre on 2026-09-21."` — confirmed directly in `prisma/migrations/20260914113715_scan_check_in_rpc/migration.sql:59` and `.../20260914114125_register_and_checkin_rpc/migration.sql:76`). This is pure new-page work, no new backend.

**A real design decision, not an oversight — read before implementing:** the spec's own wording asks for "student name, venue, timestamp, delivered" as if they were separate columns. This plan deliberately does **not** join `Student`/`Venue` to render them separately, and instead renders the pre-formatted `message` field (which already contains the student's name and venue, human-readably) plus `sentAt` and `delivered` as the only additional fields. Reason: `CheckInNotification`'s own RLS scopes a coach's visibility to "check-ins they personally processed via their shift" (`checkin_notification_select`, `prisma/migrations/20260914110527_rls_checkin_tables/migration.sql:24-34`) — but `Student`'s own RLS (a *different*, narrower rule: admin, or a coach assigned via `ClassAssignment`→`Enrollment`, or the student's own row) does not necessarily cover the same students. A coach who processed a walk-up check-in for a student they have no class relationship with can see the `CheckInNotification` row but would get a `null` back from a nested `student:Student(*)` embed — silently breaking a "student name" column for exactly the walk-in-visitor case this feature exists to cover. Using the pre-formatted `message` (which was generated server-side, before RLS ever applies) sidesteps this mismatch entirely and matches the model's own doc comment: *"no real SMS/email provider exists, this row IS the delivery."*

**Tech Stack:** Next.js App Router, React `useEffect`/`useState` — no new dependencies, no new patterns. Reuses `parseUtcTimestamp` (`@/lib/dates`) for `sentAt`, per this migration's standing requirement for any raw Supabase `TIMESTAMP(3)` field displayed in local time.

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md`, "Notifications (new feature)" section.

## Global Constraints

- No admin-only gate — per spec, this page is coach-visible too (scoped by RLS to their own relevant notifications), so use `useRequireCoach()`, not `useRequireAdmin()`.
- `GuardianNotification` (the legacy class-attendance flow) is **not** surfaced on this page — only `CheckInNotification`. Per spec, this is deliberate, not an oversight to "complete" later without a separate decision.
- `sentAt` is displayed via `parseUtcTimestamp(n.sentAt)`, never a bare `new Date(n.sentAt)` — this migration's standing requirement after the timezone-corruption bug found in the payroll slice.
- The fetch has a `.catch()`, error rendered before loading, `cancelled` guard.
- New nav links added to both `TopNav` and `BottomTabBar`, visible to every coach (not admin-gated), matching the "Curriculum" link's existing pattern in both files.
- No new test framework — manual verification via dev server (and browser automation if it's working this session).

## File Structure

- Create: `src/lib/api/notifications.ts` — `getCheckInNotifications()`
- Create: `src/app/(app)/notifications/page.tsx`
- Modify: `src/components/nav/top-nav.tsx` — add a "Notifications" link
- Modify: `src/components/nav/bottom-tab-bar.tsx` — add a "Notifications" tab

## Task 1: Add the notifications data function and page

**Files:**
- Create: `src/lib/api/notifications.ts`
- Create: `src/app/(app)/notifications/page.tsx`
- Modify: `src/components/nav/top-nav.tsx`
- Modify: `src/components/nav/bottom-tab-bar.tsx`

- [ ] **Step 1: Create the data function**

Create `src/lib/api/notifications.ts`:

```ts
import { supabase } from "@/lib/supabase/client";

export async function getCheckInNotifications() {
  const { data, error } = await supabase
    .from("CheckInNotification")
    .select("*")
    .order("sentAt", { ascending: false });
  if (error) throw error;
  return data;
}
```

No joins — see this plan's Architecture note on why. RLS (`checkin_notification_select`) already scopes the returned rows correctly per caller.

- [ ] **Step 2: Create the page**

Create `src/app/(app)/notifications/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRequireCoach } from "@/lib/supabase/session";
import { getCheckInNotifications } from "@/lib/api/notifications";
import { parseUtcTimestamp } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Notifications = Awaited<ReturnType<typeof getCheckInNotifications>>;

export default function NotificationsPage() {
  const coach = useRequireCoach();
  const [notifications, setNotifications] = useState<Notifications | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const ready = !!coach;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getCheckInNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load notifications.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!coach) return null;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (notifications === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Guardian check-in notifications.</p>
      </div>
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {parseUtcTimestamp(n.sentAt).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <Badge variant={n.delivered ? "default" : "secondary"}>{n.delivered ? "Delivered" : "Not delivered"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

`n.delivered` is `false` specifically when the student had no `emergencyContactPhone` on file at check-in time (confirmed in the RPC SQL: `delivered` is a literal `true` only inside the `if v_student."isMapStudent"` branch that also requires the phone; check the actual RPC body for the exact condition before assuming — if a non-MAP-student check-in never creates a row at all, `delivered` may always be `true` in current data, which is fine, the UI still needs to handle `false` correctly since the schema allows it).

- [ ] **Step 3: Add nav links**

In `src/components/nav/top-nav.tsx`, add `Bell` to the lucide-react import and add a `Notifications` entry to the `links` array (alongside "Home"/"Curriculum"/"Profile", outside the `coach.isAdmin &&` block):

```tsx
import { Home, Users, BookOpen, UserCircle, Bell, LogOut } from "lucide-react";
```
```tsx
const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: profileHref, label: "Profile", icon: UserCircle },
];
```

In `src/components/nav/bottom-tab-bar.tsx`, add `Bell` to the import and add a tab (outside the `isAdmin` conditional spread, so it's visible to every coach):

```tsx
import { Home, Users, BookOpen, UserCircle, Bell } from "lucide-react";
```
```tsx
const tabs = [
  { href: "/", label: "Home", icon: Home },
  ...(isAdmin ? [{ href: "/students", label: "Students", icon: Users }] : []),
  { href: "/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: profileHref, label: "Profile", icon: UserCircle },
];
```

Note: this makes the bottom tab bar 5 tabs wide for admins (was 4). If this looks visually cramped once actually rendered, that's a real UI judgment call to make during manual verification (Step 5) — not something to guess about now; if it's a problem, the simplest fix is dropping "Curriculum" from the bottom bar for admins only (it's already reachable via the top nav on desktop, and via Home → nothing currently links to it from the dashboard — check before doing this) rather than guessing blind.

- [ ] **Step 4: Type-check, lint, build**

Run: `npx tsc --noEmit` — expect clean.
Run: `npx eslint src/lib/api/notifications.ts "src/app/(app)/notifications/page.tsx" src/components/nav/top-nav.tsx src/components/nav/bottom-tab-bar.tsx` — expect 0 problems.
Run: `npx next build --turbopack` — expect success; `/notifications` should show as `○` (static).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`.

1. Sign in as a coach, navigate to `/notifications` (via the new nav link). Expected: shows notifications, or "No notifications yet." if none exist for this coach/admin.
2. If real data exists, confirm the timestamp looks correct (not obviously off by several hours — the exact regression class the timezone bug produced) and the delivered/not-delivered badge renders.
3. Check both desktop (top nav) and mobile-width (bottom tab bar) — confirm the new tab doesn't look broken/cramped; make the judgment call from Step 3's note if needed.
4. If browser automation is available and working, use it. If not, disclose exactly which checks weren't performed live.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/notifications.ts "src/app/(app)/notifications/page.tsx" src/components/nav/top-nav.tsx src/components/nav/bottom-tab-bar.tsx
git status
git commit -m "feat: add notifications page (Plan 2c)"
```

---

## Verification (whole plan)

- [ ] `npx tsc --noEmit` clean; `npx next build --turbopack` succeeds with `/notifications` as `○`.
- [ ] Manual verification confirms the page renders, nav links work on both desktop and mobile widths.

**Next:** Plan 2d (cutover/cleanup) — not part of this plan.

# Coach Clock-In & Pay Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let coaches clock in/out of coaching sessions at a centre, track their hours toward pay at $80/hr (with a head-coach coverage premium of +$40/hr), and give admins an approval-before-pay workflow plus a payroll summary and CSV export.

**Architecture:** One new Prisma model (`CoachShift`) plus one new boolean on `Coach` (`isHeadCoach`), following this project's existing `src/data` (reads) / `src/actions` (`"use server"` mutations) / `src/validations` (Zod) layering. Pay/hours/coverage-eligibility logic is written as small pure functions so it can be unit-tested; everything else (schema, actions, pages) is verified manually via the dev server, matching this project's existing convention of having no automated test suite prior to this plan.

**Tech Stack:** Next.js 15 (App Router) + TypeScript, Prisma 6 + SQLite, Tailwind v4 + shadcn/ui (Base UI primitives), Auth.js v5, Zod, sonner (toasts). Vitest is added by Task 1 for the pure-function tests only.

**Spec:** `docs/superpowers/specs/2026-08-29-coach-clock-in-pay-tracking-design.md`

## Global Constraints

- Base pay rate is **$80/hour**; a head-coach covering shift pays **+$40/hour** ($120/hour total). Both are constants in `src/lib/pay.ts` — never hardcode `80`/`120`/`40` anywhere else.
- Hours are exact-to-the-minute decimals, never rounded.
- This repo has **no automated test suite today** (verified: no test runner in `package.json`, no `*.test.*`/`*.spec.*` files). Task 1 adds Vitest scoped to `src/lib/pay.ts` and `src/lib/coverage.ts` only — the two places with real branching business logic worth locking down. Every other task's "test cycle" is manual: `npm run dev` + exercising the flow in a browser, plus `npx tsc --noEmit`.
- The whole app assumes Singapore time (fixed UTC+8, no DST) — reuse `getSingaporeTodayString()` from `src/lib/dates.ts` for "today," never raw `new Date()` date-only logic.
- Every Server Action starts with `requireCoach()` or `requireAdmin()` (from `src/lib/session.ts`) and returns `ActionResult<T> = { success: true; data: T } | { success: false; error: string }`, matching `src/actions/attendance.ts` and `src/actions/coaches.ts` exactly.
- Every Server Action validates its input with a Zod schema's `.safeParse()` before touching the database.
- A coverage claim (`coveringForCoachId`) is **always** re-validated server-side inside the action, never trusted from client-side filtering alone.
- Refinement on the spec's "editing an OPEN/PENDING shift is unrestricted" line: this plan restricts `editShift` to `PENDING` only (see Task 5's note). An `OPEN` shift has no `clockOutAt` yet, so there is nothing for a time-correction edit to act on.

---

## File Structure

**New files:**
- `vitest.config.ts` — minimal Vitest config (Task 1)
- `src/lib/pay.ts` + `src/lib/pay.test.ts` — pure pay/hours computation (Task 1, extended Task 8)
- `src/lib/coverage.ts` + `src/lib/coverage.test.ts` — pure coverage-eligibility decision (Task 2)
- `src/validations/coach-shift.ts` — Zod schemas (Task 4, extended Tasks 5-7)
- `src/data/coach-shifts.ts` — read queries (Task 4, extended Tasks 5-8)
- `src/actions/coach-shifts.ts` — `"use server"` mutations (Task 4, extended Tasks 5-7)
- `src/app/(app)/hours/page.tsx` — coach-facing clock-in/history (Task 4, extended Tasks 5-6)
- `src/app/(app)/payroll/page.tsx` — admin-facing queue/summary (Task 7, extended Task 8)
- `src/app/api/payroll/export/route.ts` — CSV download (Task 8)
- `src/components/hours/clock-in-form.tsx` (Task 4, extended Task 6)
- `src/components/hours/shift-history-table.tsx` (Task 5, extended Task 6)
- `src/components/hours/edit-shift-dialog.tsx` (Task 5, extended Task 6)
- `src/components/payroll/pending-shifts-table.tsx` (Task 7)
- `src/components/payroll/pay-summary.tsx` (Task 8)

**Modified files:**
- `prisma/schema.prisma` — `CoachShiftStatus` enum, `CoachShift` model, `Coach`/`Venue` relations (Task 3)
- `prisma/seed.ts` — one seeded coach flagged `isHeadCoach: true` (Task 3)
- `package.json` — add `vitest` devDependency + `test` script (Task 1)
- `src/components/nav/top-nav.tsx` — add "Hours" (all coaches) and "Payroll" (admin) links (Tasks 4, 7)
- `src/components/nav/bottom-tab-bar.tsx` — add "Hours" tab (Task 4)

---

### Task 1: Pay calculation pure functions + Vitest setup

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/pay.ts`
- Test: `src/lib/pay.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `BASE_RATE_PER_HOUR`, `COVERAGE_PREMIUM_PER_HOUR` (numbers), `computeShiftHours(shift: { clockInAt: Date; clockOutAt: Date | null }): number`, `computeShiftRate(shift: { coveringForCoachId: string | null }): number`, `computeShiftPay(shift: { clockInAt: Date; clockOutAt: Date | null; coveringForCoachId: string | null }): number` — all from `src/lib/pay.ts`. Later tasks import these.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Add the test script**

Modify `package.json` — in the `"scripts"` block, add a `test` entry right after `"lint"`:

```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "postinstall": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/pay.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeShiftHours, computeShiftRate, computeShiftPay, BASE_RATE_PER_HOUR, COVERAGE_PREMIUM_PER_HOUR } from "./pay";

describe("computeShiftHours", () => {
  it("returns the exact decimal hours between clock in and clock out", () => {
    const shift = { clockInAt: new Date("2026-08-29T09:00:00Z"), clockOutAt: new Date("2026-08-29T10:45:00Z") };
    expect(computeShiftHours(shift)).toBeCloseTo(1.75, 5);
  });

  it("returns 0 when there is no clock-out yet", () => {
    const shift = { clockInAt: new Date("2026-08-29T09:00:00Z"), clockOutAt: null };
    expect(computeShiftHours(shift)).toBe(0);
  });
});

describe("computeShiftRate", () => {
  it("returns the base rate for a regular shift", () => {
    expect(computeShiftRate({ coveringForCoachId: null })).toBe(BASE_RATE_PER_HOUR);
  });

  it("returns base + premium for a covering shift", () => {
    expect(computeShiftRate({ coveringForCoachId: "coach_123" })).toBe(BASE_RATE_PER_HOUR + COVERAGE_PREMIUM_PER_HOUR);
  });
});

describe("computeShiftPay", () => {
  it("multiplies hours by the applicable rate", () => {
    const shift = {
      clockInAt: new Date("2026-08-29T09:00:00Z"),
      clockOutAt: new Date("2026-08-29T11:00:00Z"),
      coveringForCoachId: "coach_123",
    };
    expect(computeShiftPay(shift)).toBe(2 * (BASE_RATE_PER_HOUR + COVERAGE_PREMIUM_PER_HOUR));
  });
});
```

- [ ] **Step 5: Run the test, verify it fails**

Run: `npx vitest run src/lib/pay.test.ts`
Expected: FAIL — `./pay` cannot be resolved (file doesn't exist yet).

- [ ] **Step 6: Implement `src/lib/pay.ts`**

```ts
// Pure, storage-free pay computation. Hours and pay are computed on demand
// from a shift's timestamps rather than persisted — same approach as
// src/lib/attendance-stats.ts computing attendance percentages as pure
// functions instead of stored columns.

export const BASE_RATE_PER_HOUR = 80;
export const COVERAGE_PREMIUM_PER_HOUR = 40;

type ShiftTimes = { clockInAt: Date; clockOutAt: Date | null };
type ShiftCoverage = { coveringForCoachId: string | null };

// Exact to the minute, no rounding — simplest to implement and fairest to
// the coach. Returns 0 for a shift that hasn't been clocked out yet.
export function computeShiftHours(shift: ShiftTimes): number {
  if (!shift.clockOutAt) return 0;
  return (shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / 3_600_000;
}

export function computeShiftRate(shift: ShiftCoverage): number {
  return shift.coveringForCoachId ? BASE_RATE_PER_HOUR + COVERAGE_PREMIUM_PER_HOUR : BASE_RATE_PER_HOUR;
}

export function computeShiftPay(shift: ShiftTimes & ShiftCoverage): number {
  return computeShiftHours(shift) * computeShiftRate(shift);
}
```

- [ ] **Step 7: Run the test, verify it passes**

Run: `npx vitest run src/lib/pay.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/pay.ts src/lib/pay.test.ts
git commit -m "feat: add pay calculation pure functions"
```

---

### Task 2: Coverage eligibility pure function

**Files:**
- Create: `src/lib/coverage.ts`
- Test: `src/lib/coverage.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `CoverageEligibilityInput` (type), `CoverageEligibilityResult` (type), `validateCoverageEligibility(input: CoverageEligibilityInput): CoverageEligibilityResult` from `src/lib/coverage.ts`. Task 6's `checkCoverageClaim` helper (in `src/actions/coach-shifts.ts`) calls this after fetching the facts from the database.

- [ ] **Step 1: Write the failing test**

Create `src/lib/coverage.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateCoverageEligibility, type CoverageEligibilityInput } from "./coverage";

const baseInput: CoverageEligibilityInput = {
  actingCoachId: "coach_head",
  actingCoachIsHeadCoach: true,
  coveredCoachId: "coach_absent",
  coveredCoachHasClassAtVenue: true,
  coveredCoachHasShiftThatDay: false,
};

describe("validateCoverageEligibility", () => {
  it("allows a valid coverage claim", () => {
    expect(validateCoverageEligibility(baseInput)).toEqual({ valid: true });
  });

  it("rejects a coach who is not a head coach", () => {
    const result = validateCoverageEligibility({ ...baseInput, actingCoachIsHeadCoach: false });
    expect(result).toEqual({ valid: false, error: "Only head coaches can log a covering shift." });
  });

  it("rejects naming yourself as the covered coach", () => {
    const result = validateCoverageEligibility({ ...baseInput, coveredCoachId: baseInput.actingCoachId });
    expect(result.valid).toBe(false);
  });

  it("rejects a covered coach with no class at that venue", () => {
    const result = validateCoverageEligibility({ ...baseInput, coveredCoachHasClassAtVenue: false });
    expect(result).toEqual({ valid: false, error: "That coach has no class assigned at this centre." });
  });

  it("rejects a covered coach who already has a shift that day", () => {
    const result = validateCoverageEligibility({ ...baseInput, coveredCoachHasShiftThatDay: true });
    expect(result).toEqual({
      valid: false,
      error: "That coach already has a shift recorded for this date and centre.",
    });
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run src/lib/coverage.test.ts`
Expected: FAIL — `./coverage` cannot be resolved.

- [ ] **Step 3: Implement `src/lib/coverage.ts`**

```ts
// Pure decision logic for a head-coach coverage claim. Callers (Server
// Actions) fetch the facts below from the database and pass them in — kept
// separate from Prisma so the guard logic is unit-testable without one. See
// docs/superpowers/specs/2026-08-29-coach-clock-in-pay-tracking-design.md.

export type CoverageEligibilityInput = {
  actingCoachId: string;
  actingCoachIsHeadCoach: boolean;
  coveredCoachId: string;
  coveredCoachHasClassAtVenue: boolean;
  coveredCoachHasShiftThatDay: boolean;
};

export type CoverageEligibilityResult = { valid: true } | { valid: false; error: string };

export function validateCoverageEligibility(input: CoverageEligibilityInput): CoverageEligibilityResult {
  if (!input.actingCoachIsHeadCoach) {
    return { valid: false, error: "Only head coaches can log a covering shift." };
  }
  if (input.actingCoachId === input.coveredCoachId) {
    return { valid: false, error: "You can't log yourself as the coach you're covering for." };
  }
  if (!input.coveredCoachHasClassAtVenue) {
    return { valid: false, error: "That coach has no class assigned at this centre." };
  }
  if (input.coveredCoachHasShiftThatDay) {
    return { valid: false, error: "That coach already has a shift recorded for this date and centre." };
  }
  return { valid: true };
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run src/lib/coverage.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/coverage.ts src/lib/coverage.test.ts
git commit -m "feat: add coverage eligibility pure function"
```

---

### Task 3: Database schema — CoachShift, isHeadCoach, seed data

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: nothing
- Produces: Prisma model `CoachShift` (fields: `id, coachId, venueId, shiftDate, clockInAt, clockOutAt, status, coveringForCoachId, approvedByCoachId, approvedAt, reviewNote, createdAt, updatedAt`), enum `CoachShiftStatus` (`OPEN | PENDING | APPROVED | REJECTED`), `Coach.isHeadCoach: boolean`. Seeded dev data: coach `aishah@map.test` has `isHeadCoach: true`. All later tasks depend on this model existing.

- [ ] **Step 1: Update the Prisma schema**

In `prisma/schema.prisma`, add the new enum right after `enum ProgressStatus`:

```prisma
enum ProgressStatus {
  PLANNED
  COMPLETED
}

enum CoachShiftStatus {
  OPEN     // clocked in, not yet clocked out
  PENDING  // clocked out (or edited), awaiting admin review
  APPROVED // admin-approved, counts toward pay
  REJECTED // admin-rejected, does not count toward pay
}

model Venue {
```

Add a back-relation to `model Venue`:

```prisma
model Venue {
  id        String   @id @default(cuid())
  name      String
  address   String?
  createdAt DateTime @default(now())

  classes     Class[]
  students    Student[]
  coachShifts CoachShift[]

  @@index([name])
}
```

Add `isHeadCoach` and three new relations to `model Coach`:

```prisma
model Coach {
  id                  String    @id @default(cuid())
  name                String
  email               String    @unique
  passwordHash        String
  isAdmin             Boolean   @default(false)
  // Can log a covering shift for another coach's absence (src/lib/coverage.ts)
  // at a pay premium — see CoachShift.coveringForCoachId. Admin-controlled,
  // same pattern as isAdmin.
  isHeadCoach         Boolean   @default(false)
  phone               String?
  trainingCompletedAt DateTime?
  // Cheap, no-extra-infra brute-force mitigation for login.
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  createdAt           DateTime  @default(now())

  assignments    ClassAssignment[]
  markedSessions AttendanceSession[]
  shifts         CoachShift[]        @relation("CoachShifts")
  coveredShifts  CoachShift[]        @relation("CoveredShifts")
  approvedShifts CoachShift[]        @relation("ApprovedShifts")

  @@index([email])
}
```

Add the new model at the end of the file, after `model ClassProgress`:

```prisma
model CoachShift {
  id      String @id @default(cuid())
  coachId String
  coach   Coach  @relation("CoachShifts", fields: [coachId], references: [id], onDelete: Restrict)
  venueId String
  venue   Venue  @relation(fields: [venueId], references: [id], onDelete: Restrict)
  // "YYYY-MM-DD", same convention as AttendanceSession.sessionDate — sidesteps
  // timezone bugs since we only ever need "which calendar day."
  shiftDate String

  clockInAt  DateTime
  clockOutAt DateTime? // null while the shift is still OPEN

  status CoachShiftStatus @default(OPEN)

  // Set only when a head coach logs this shift as covering for another
  // coach's absence. Presence of this field (not a separate boolean) is
  // what drives the $120/hr rate — see src/lib/pay.ts.
  coveringForCoachId String?
  coveringForCoach   Coach?  @relation("CoveredShifts", fields: [coveringForCoachId], references: [id], onDelete: SetNull)

  approvedByCoachId String?
  approvedByCoach   Coach?    @relation("ApprovedShifts", fields: [approvedByCoachId], references: [id], onDelete: SetNull)
  approvedAt        DateTime?
  // Free-text reason, set by an admin on reject (or an optional note on approve).
  reviewNote        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([coachId])
  @@index([venueId, shiftDate])
  @@index([status])
}
```

- [ ] **Step 2: Run the migration**

Run: `npx prisma migrate dev --name add_coach_shift_and_head_coach`
Expected: migration applies cleanly, Prisma Client regenerates with no errors.

- [ ] **Step 3: Flag one seeded coach as a head coach**

In `prisma/seed.ts`, update the `coachDefs` array and the `prisma.coach.create` call inside the loop:

```ts
  const coachDefs = [
    { key: "hidayah", name: "Nur Hidayah Rahman", email: "admin@map.test", isAdmin: true, isHeadCoach: false },
    { key: "farhan", name: "Muhammad Farhan Yusof", email: "farhan@map.test", isAdmin: false, isHeadCoach: false },
    { key: "aishah", name: "Siti Aishah Kamal", email: "aishah@map.test", isAdmin: false, isHeadCoach: true },
    { key: "danial", name: "Ahmad Danial Rosli", email: "danial@map.test", isAdmin: false, isHeadCoach: false },
    { key: "ain", name: "Nurul Ain Zulkifli", email: "ain@map.test", isAdmin: false, isHeadCoach: false },
    { key: "haziq", name: "Muhammad Haziq Ismail", email: "haziq@map.test", isAdmin: false, isHeadCoach: false },
    { key: "nabila", name: "Farah Nabila Hassan", email: "nabila@map.test", isAdmin: false, isHeadCoach: false },
  ] as const;

  const coaches: Record<string, Awaited<ReturnType<typeof prisma.coach.create>>> = {};
  for (const [i, def] of coachDefs.entries()) {
    coaches[def.key] = await prisma.coach.create({
      data: {
        name: def.name,
        email: def.email,
        passwordHash,
        isAdmin: def.isAdmin,
        isHeadCoach: def.isHeadCoach,
        phone: `9${100 + i}${(200 + i * 3).toString().padStart(4, "0")}`.replace(/(\d{4})(\d{4})$/, "$1 $2"),
        trainingCompletedAt: new Date(Date.now() - (365 - i * 10) * 24 * 60 * 60 * 1000),
      },
    });
  }
```

- [ ] **Step 4: Re-seed and verify**

Run: `npm run db:seed`
Expected: seed script completes without errors.

Run: `npm run db:studio`, open the `Coach` table, and confirm `aishah@map.test` has `isHeadCoach = true` and every other coach has `isHeadCoach = false`. Confirm the `CoachShift` table exists (empty). Close Prisma Studio.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts prisma/migrations
git commit -m "feat: add CoachShift model and isHeadCoach flag"
```

---

### Task 4: Clock in / clock out

**Files:**
- Create: `src/validations/coach-shift.ts`
- Create: `src/data/coach-shifts.ts`
- Create: `src/actions/coach-shifts.ts`
- Create: `src/app/(app)/hours/page.tsx`
- Create: `src/components/hours/clock-in-form.tsx`
- Modify: `src/components/nav/top-nav.tsx`
- Modify: `src/components/nav/bottom-tab-bar.tsx`

**Interfaces:**
- Consumes: `CoachShift` Prisma model (Task 3), `requireCoach()` from `src/lib/session.ts`, `getSingaporeTodayString()` from `src/lib/dates.ts`.
- Produces: `clockInSchema`, `clockOutSchema` (Zod, in `src/validations/coach-shift.ts`); `getOpenShiftForCoach(coachId: string)`, `getAllVenuesForSelect()` (in `src/data/coach-shifts.ts`); `clockIn(input: unknown): Promise<ActionResult<{ shiftId: string }>>`, `clockOut(input: unknown): Promise<ActionResult>` (in `src/actions/coach-shifts.ts`). Task 5 extends all three files; Task 6 extends `clockIn`/`clockInSchema`/`ClockInForm` further.

- [ ] **Step 1: Create the validation schemas**

Create `src/validations/coach-shift.ts`:

```ts
import { z } from "zod";

export const clockInSchema = z.object({
  venueId: z.string().min(1),
});

export const clockOutSchema = z.object({
  shiftId: z.string().min(1),
});
```

- [ ] **Step 2: Create the data queries**

Create `src/data/coach-shifts.ts`:

```ts
import { prisma } from "@/lib/prisma";

export async function getOpenShiftForCoach(coachId: string) {
  return prisma.coachShift.findFirst({
    where: { coachId, status: "OPEN" },
    include: { venue: true },
  });
}

export async function getAllVenuesForSelect() {
  return prisma.venue.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}
```

- [ ] **Step 3: Create the Server Actions**

Create `src/actions/coach-shifts.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
import { clockInSchema, clockOutSchema } from "@/validations/coach-shift";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function clockIn(input: unknown): Promise<ActionResult<{ shiftId: string }>> {
  const coach = await requireCoach();
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { venueId } = parsed.data;

  const openShift = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (openShift) return { success: false, error: "You're already clocked in — clock out first." };

  const shift = await prisma.coachShift.create({
    data: {
      coachId: coach.id,
      venueId,
      shiftDate: getSingaporeTodayString(),
      clockInAt: new Date(),
      status: "OPEN",
    },
  });

  revalidatePath("/hours");
  return { success: true, data: { shiftId: shift.id } };
}

export async function clockOut(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.coachId !== coach.id) return { success: false, error: "Shift not found." };
  if (shift.status !== "OPEN") return { success: false, error: "This shift isn't open." };

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { clockOutAt: new Date(), status: "PENDING" },
  });

  revalidatePath("/hours");
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}
```

- [ ] **Step 4: Create the Clock In/Out form component**

Create `src/components/hours/clock-in-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { clockIn, clockOut } from "@/actions/coach-shifts";

type Venue = { id: string; name: string };
type OpenShift = { id: string; venueName: string; clockInAt: string } | null;

export function ClockInForm({ openShift, venues }: { openShift: OpenShift; venues: Venue[] }) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [isPending, setIsPending] = useState(false);

  async function handleClockIn() {
    setIsPending(true);
    const result = await clockIn({ venueId });
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Clocked in.");
  }

  async function handleClockOut() {
    if (!openShift) return;
    setIsPending(true);
    const result = await clockOut({ shiftId: openShift.id });
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Clocked out.");
  }

  if (openShift) {
    const since = new Intl.DateTimeFormat("en-SG", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Singapore" }).format(
      new Date(openShift.clockInAt),
    );
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm">
          Currently clocked in at <span className="font-medium">{openShift.venueName}</span> since {since}
        </p>
        <Button size="lg" className="w-full sm:w-auto" onClick={handleClockOut} disabled={isPending}>
          {isPending ? "Clocking out..." : "Clock Out"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="venueId">Centre</Label>
        <NativeSelect id="venueId" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button size="lg" className="w-full sm:w-auto" onClick={handleClockIn} disabled={isPending || !venueId}>
        {isPending ? "Clocking in..." : "Clock In"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create the Hours page**

Create `src/app/(app)/hours/page.tsx`:

```tsx
import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach, getAllVenuesForSelect } from "@/data/coach-shifts";
import { ClockInForm } from "@/components/hours/clock-in-form";

export default async function HoursPage() {
  const coach = await requireCoach();
  const [openShift, venues] = await Promise.all([getOpenShiftForCoach(coach.id), getAllVenuesForSelect()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">My hours</h1>
        <p className="text-sm text-muted-foreground">Clock in when you arrive at a centre, clock out when you leave.</p>
      </div>
      <ClockInForm
        openShift={
          openShift ? { id: openShift.id, venueName: openShift.venue.name, clockInAt: openShift.clockInAt.toISOString() } : null
        }
        venues={venues}
      />
    </div>
  );
}
```

- [ ] **Step 6: Add "Hours" to the top nav**

Modify `src/components/nav/top-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, UserCircle, LogOut, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/format";
import { signOutAction } from "@/actions/coaches";
import { AppLogo } from "@/components/app-logo";

type NavCoach = { id: string; name: string; isAdmin: boolean };

export function TopNav({ coach }: { coach: NavCoach }) {
  const pathname = usePathname();
  const profileHref = `/coaches/${coach.id}`;
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/students", label: "Students", icon: Users },
    { href: "/hours", label: "Hours", icon: Clock },
    { href: "/curriculum", label: "Curriculum", icon: BookOpen },
    { href: profileHref, label: "Profile", icon: UserCircle },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-sm font-semibold">
          <AppLogo size={28} />
          MAP Coach Portal
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                  isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          {coach.isAdmin && (
            <Link
              href="/venues"
              aria-current={pathname.startsWith("/venues") ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                pathname.startsWith("/venues") ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Venues
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
          </Avatar>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
```

(This is a placeholder for the "Venues" admin link — Task 7 replaces this same block again to add "Payroll" alongside it.)

- [ ] **Step 7: Add "Hours" to the bottom tab bar**

Modify `src/components/nav/bottom-tab-bar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, UserCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Deliberately not shadcn's Sidebar primitive — a slide-out drawer needs an
// extra tap to open, which works against "fast, standing in a classroom."
// This bar is always visible, thumb-reachable, no open/close step.
export function BottomTabBar({ profileHref }: { profileHref: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/students", label: "Students", icon: Users },
    { href: "/hours", label: "Hours", icon: Clock },
    { href: "/curriculum", label: "Curriculum", icon: BookOpen },
    { href: profileHref, label: "Profile", icon: UserCircle },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Manually verify in the browser**

Run: `npm run dev`. Log in as `farhan@map.test` / `Coach123!`. Navigate to `/hours` (via the nav or directly). Confirm:
- A "Centre" dropdown and "Clock In" button appear.
- Clicking "Clock In" shows a success toast and switches the view to "Currently clocked in at `<centre>` since `<time>`" with a "Clock Out" button.
- Clicking "Clock Out" shows a success toast and returns to the clock-in form.
- The "Hours" tab/link is visible and highlights when active, both on desktop width and mobile width (resize the window).

- [ ] **Step 10: Commit**

```bash
git add src/validations/coach-shift.ts src/data/coach-shifts.ts src/actions/coach-shifts.ts src/app/\(app\)/hours/page.tsx src/components/hours/clock-in-form.tsx src/components/nav/top-nav.tsx src/components/nav/bottom-tab-bar.tsx
git commit -m "feat: add coach clock-in/clock-out"
```

---

### Task 5: Shift history, edit, and reopen

**Files:**
- Modify: `src/validations/coach-shift.ts`
- Modify: `src/data/coach-shifts.ts`
- Modify: `src/actions/coach-shifts.ts`
- Create: `src/components/hours/shift-history-table.tsx`
- Create: `src/components/hours/edit-shift-dialog.tsx`
- Modify: `src/app/(app)/hours/page.tsx`

**Interfaces:**
- Consumes: `computeShiftHours`, `computeShiftRate` from `src/lib/pay.ts` (Task 1); everything from Task 4.
- Produces: `editShiftSchema`, `reopenShiftSchema` (Zod); `getShiftHistoryForCoach(coachId: string)`; `editShift(input: unknown): Promise<ActionResult>`, `reopenShift(input: unknown): Promise<ActionResult>`; the `ShiftRow` type (exported from `shift-history-table.tsx`). Task 6 extends `editShiftSchema`, `editShift`, `ShiftRow`, and `EditShiftDialog`. Task 7 reuses `EditShiftDialog` and the `ShiftRow` type as-is (constructing a `ShiftRow` from admin-side data) to let an admin edit a pending shift too.

**Note on scope vs. the spec:** the design spec says "editing an OPEN/PENDING shift is unrestricted." This plan narrows that to **PENDING only** — `editShift` below rejects `OPEN` shifts (`"Reopen this shift before editing it."` is only reachable from `APPROVED`/`REJECTED`; an `OPEN` shift instead needs `clockOut` first). Rationale: an `OPEN` shift has `clockOutAt = null`, so a time-correction edit has nothing to act on yet — there is no scenario where editing an in-progress, not-yet-clocked-out shift is meaningful.

- [ ] **Step 1: Add schemas for edit and reopen**

Modify `src/validations/coach-shift.ts` — add two exports after `clockOutSchema`:

```ts
import { z } from "zod";

export const clockInSchema = z.object({
  venueId: z.string().min(1),
});

export const clockOutSchema = z.object({
  shiftId: z.string().min(1),
});

export const editShiftSchema = z.object({
  shiftId: z.string().min(1),
  clockInAt: z.string().datetime(),
  clockOutAt: z.string().datetime(),
});

export const reopenShiftSchema = z.object({
  shiftId: z.string().min(1),
});
```

- [ ] **Step 2: Add the history query**

Modify `src/data/coach-shifts.ts` — add after `getAllVenuesForSelect`:

```ts
export async function getShiftHistoryForCoach(coachId: string) {
  return prisma.coachShift.findMany({
    where: { coachId },
    include: { venue: true, coveringForCoach: { select: { name: true } } },
    orderBy: { clockInAt: "desc" },
  });
}
```

- [ ] **Step 3: Add editShift and reopenShift actions**

Modify `src/actions/coach-shifts.ts` — update the import line and append the two new actions:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
import { clockInSchema, clockOutSchema, editShiftSchema, reopenShiftSchema } from "@/validations/coach-shift";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export async function clockIn(input: unknown): Promise<ActionResult<{ shiftId: string }>> {
  const coach = await requireCoach();
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { venueId } = parsed.data;

  const openShift = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (openShift) return { success: false, error: "You're already clocked in — clock out first." };

  const shift = await prisma.coachShift.create({
    data: {
      coachId: coach.id,
      venueId,
      shiftDate: getSingaporeTodayString(),
      clockInAt: new Date(),
      status: "OPEN",
    },
  });

  revalidatePath("/hours");
  return { success: true, data: { shiftId: shift.id } };
}

export async function clockOut(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.coachId !== coach.id) return { success: false, error: "Shift not found." };
  if (shift.status !== "OPEN") return { success: false, error: "This shift isn't open." };

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { clockOutAt: new Date(), status: "PENDING" },
  });

  revalidatePath("/hours");
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function editShift(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = editShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId, clockInAt, clockOutAt } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.coachId !== coach.id && !coach.isAdmin) return { success: false, error: "You don't have access to this shift." };
  if (shift.status !== "PENDING") return { success: false, error: "Reopen this shift before editing it." };

  const clockInDate = new Date(clockInAt);
  const clockOutDate = new Date(clockOutAt);
  if (clockOutDate <= clockInDate) return { success: false, error: "Clock-out must be after clock-in." };

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { clockInAt: clockInDate, clockOutAt: clockOutDate },
  });

  revalidatePath("/hours");
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function reopenShift(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = reopenShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.coachId !== coach.id && !coach.isAdmin) return { success: false, error: "You don't have access to this shift." };
  if (shift.status === "OPEN" || shift.status === "PENDING") {
    return { success: false, error: "This shift is already open for editing." };
  }

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { status: "PENDING", approvedByCoachId: null, approvedAt: null, reviewNote: null },
  });

  revalidatePath("/hours");
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}
```

- [ ] **Step 4: Create the edit dialog**

Create `src/components/hours/edit-shift-dialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editShift } from "@/actions/coach-shifts";
import type { ShiftRow } from "./shift-history-table";

// <input type="datetime-local"> has no timezone of its own — the browser
// interprets it (and the Date this produces) in the device's local
// timezone, which is correct here since every coach using this app is in
// Singapore. See src/lib/dates.ts for the same Singapore-only assumption
// applied to calendar dates.
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditShiftDialog({ shift, onClose }: { shift: ShiftRow; onClose: () => void }) {
  const [clockInAt, setClockInAt] = useState(toLocalInputValue(shift.clockInAt));
  const [clockOutAt, setClockOutAt] = useState(shift.clockOutAt ? toLocalInputValue(shift.clockOutAt) : "");
  const [isPending, setIsPending] = useState(false);

  async function handleSave() {
    setIsPending(true);
    const result = await editShift({
      shiftId: shift.id,
      clockInAt: new Date(clockInAt).toISOString(),
      clockOutAt: new Date(clockOutAt).toISOString(),
    });
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shift updated.");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit shift — {shift.venueName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="clockInAt">Clock in</Label>
            <Input id="clockInAt" type="datetime-local" value={clockInAt} onChange={(e) => setClockInAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clockOutAt">Clock out</Label>
            <Input id="clockOutAt" type="datetime-local" value={clockOutAt} onChange={(e) => setClockOutAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Create the history table**

Create `src/components/hours/shift-history-table.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeShiftHours, computeShiftRate } from "@/lib/pay";
import { reopenShift } from "@/actions/coach-shifts";
import { EditShiftDialog } from "./edit-shift-dialog";

export type ShiftRow = {
  id: string;
  venueId: string;
  venueName: string;
  shiftDate: string;
  clockInAt: string;
  clockOutAt: string | null;
  status: "OPEN" | "PENDING" | "APPROVED" | "REJECTED";
  coveringForCoachId: string | null;
  coveringForCoachName: string | null;
};

const STATUS_LABEL: Record<ShiftRow["status"], string> = {
  OPEN: "Open",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function ShiftHistoryTable({ shifts }: { shifts: ShiftRow[] }) {
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftRow | null>(null);

  async function handleReopen(shiftId: string) {
    setReopeningId(shiftId);
    const result = await reopenShift({ shiftId });
    setReopeningId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shift reopened — you can edit it now.");
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">No shifts logged yet.</p>;
  }

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {shifts.map((shift) => {
          const hours = computeShiftHours({
            clockInAt: new Date(shift.clockInAt),
            clockOutAt: shift.clockOutAt ? new Date(shift.clockOutAt) : null,
          });
          const rate = computeShiftRate({ coveringForCoachId: shift.coveringForCoachId });
          return (
            <li key={shift.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <div className="flex-1 space-y-0.5">
                <p className="font-medium">
                  {shift.shiftDate} — {shift.venueName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hours.toFixed(2)}h × ${rate}/h
                  {shift.coveringForCoachName ? ` · Covering for ${shift.coveringForCoachName}` : ""}
                </p>
              </div>
              <Badge variant={shift.status === "APPROVED" ? "secondary" : "default"}>{STATUS_LABEL[shift.status]}</Badge>
              {shift.status === "PENDING" && (
                <Button size="sm" variant="outline" onClick={() => setEditingShift(shift)}>
                  Edit
                </Button>
              )}
              {(shift.status === "APPROVED" || shift.status === "REJECTED") && (
                <Button size="sm" variant="outline" disabled={reopeningId === shift.id} onClick={() => handleReopen(shift.id)}>
                  {reopeningId === shift.id ? "Reopening..." : "Reopen"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {editingShift && <EditShiftDialog shift={editingShift} onClose={() => setEditingShift(null)} />}
    </>
  );
}
```

- [ ] **Step 6: Render the history table on the Hours page**

Modify `src/app/(app)/hours/page.tsx`:

```tsx
import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach, getAllVenuesForSelect, getShiftHistoryForCoach } from "@/data/coach-shifts";
import { ClockInForm } from "@/components/hours/clock-in-form";
import { ShiftHistoryTable, type ShiftRow } from "@/components/hours/shift-history-table";

export default async function HoursPage() {
  const coach = await requireCoach();
  const [openShift, venues, history] = await Promise.all([
    getOpenShiftForCoach(coach.id),
    getAllVenuesForSelect(),
    getShiftHistoryForCoach(coach.id),
  ]);

  const shifts: ShiftRow[] = history.map((s) => ({
    id: s.id,
    venueId: s.venueId,
    venueName: s.venue.name,
    shiftDate: s.shiftDate,
    clockInAt: s.clockInAt.toISOString(),
    clockOutAt: s.clockOutAt ? s.clockOutAt.toISOString() : null,
    status: s.status,
    coveringForCoachId: s.coveringForCoachId,
    coveringForCoachName: s.coveringForCoach?.name ?? null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">My hours</h1>
        <p className="text-sm text-muted-foreground">Clock in when you arrive at a centre, clock out when you leave.</p>
      </div>
      <ClockInForm
        openShift={
          openShift ? { id: openShift.id, venueName: openShift.venue.name, clockInAt: openShift.clockInAt.toISOString() } : null
        }
        venues={venues}
      />
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">History</h2>
        <ShiftHistoryTable shifts={shifts} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Manually verify in the browser**

With `npm run dev` still running (or restart it), as `farhan@map.test`:
- Clock in, then clock out. Confirm the shift now appears in "History" with status "Pending" and an "Edit" button, showing the correct hours and "$80/h".
- Click "Edit," change the clock-out time forward by an hour, save. Confirm the toast, the dialog closes, and the hours/rate line updates.
- Run `npm run db:studio`, open `CoachShift`, and manually set that row's `status` to `APPROVED`. Refresh `/hours` — confirm the row now shows "Approved" and a "Reopen" button instead of "Edit."
- Click "Reopen." Confirm the row flips back to "Pending" with an "Edit" button again.

- [ ] **Step 9: Commit**

```bash
git add src/validations/coach-shift.ts src/data/coach-shifts.ts src/actions/coach-shifts.ts src/components/hours/shift-history-table.tsx src/components/hours/edit-shift-dialog.tsx src/app/\(app\)/hours/page.tsx
git commit -m "feat: add shift history, edit, and reopen"
```

---

### Task 6: Head-coach coverage claims

**Files:**
- Modify: `src/validations/coach-shift.ts`
- Modify: `src/data/coach-shifts.ts`
- Modify: `src/actions/coach-shifts.ts`
- Modify: `src/components/hours/clock-in-form.tsx`
- Modify: `src/components/hours/shift-history-table.tsx`
- Modify: `src/components/hours/edit-shift-dialog.tsx`
- Modify: `src/app/(app)/hours/page.tsx`

**Interfaces:**
- Consumes: `validateCoverageEligibility` from `src/lib/coverage.ts` (Task 2); everything from Tasks 4-5.
- Produces: `getEligibleCoveredCoaches(venueId, shiftDate, excludingCoachId)`, `getIsHeadCoach(coachId)` (in `src/data/coach-shifts.ts`); `getEligibleCoveringTargets(input: unknown): Promise<ActionResult<{ id: string; name: string }[]>>` (Server Action, callable directly from Client Components). Task 7/8 do not depend on this task's UI, only on the schema (already in place).

- [ ] **Step 1: Add `coveringForCoachId` to the clock-in and edit schemas**

Modify `src/validations/coach-shift.ts` — full file:

```ts
import { z } from "zod";

export const clockInSchema = z.object({
  venueId: z.string().min(1),
  coveringForCoachId: z.string().min(1).nullish(),
});

export const clockOutSchema = z.object({
  shiftId: z.string().min(1),
});

export const editShiftSchema = z.object({
  shiftId: z.string().min(1),
  clockInAt: z.string().datetime(),
  clockOutAt: z.string().datetime(),
  coveringForCoachId: z.string().min(1).nullish(),
});

export const reopenShiftSchema = z.object({
  shiftId: z.string().min(1),
});
```

- [ ] **Step 2: Add the eligibility query and head-coach lookup**

Modify `src/data/coach-shifts.ts` — add after `getShiftHistoryForCoach`:

```ts
export async function getIsHeadCoach(coachId: string): Promise<boolean> {
  const coach = await prisma.coach.findUnique({ where: { id: coachId }, select: { isHeadCoach: true } });
  return coach?.isHeadCoach ?? false;
}

export async function getEligibleCoveredCoaches(venueId: string, shiftDate: string, excludingCoachId: string) {
  const assigned = await prisma.coach.findMany({
    where: {
      id: { not: excludingCoachId },
      assignments: { some: { class: { venueId } } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const withShiftToday = await prisma.coachShift.findMany({
    where: {
      venueId,
      shiftDate,
      status: { in: ["OPEN", "PENDING", "APPROVED"] },
      coachId: { in: assigned.map((c) => c.id) },
    },
    select: { coachId: true },
  });
  const busyIds = new Set(withShiftToday.map((s) => s.coachId));

  return assigned.filter((c) => !busyIds.has(c.id));
}
```

- [ ] **Step 3: Wire the coverage guard into clockIn and editShift**

Modify `src/actions/coach-shifts.ts` — full file:

```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach, requireAdmin } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
import { validateCoverageEligibility, type CoverageEligibilityResult } from "@/lib/coverage";
import { clockInSchema, clockOutSchema, editShiftSchema, reopenShiftSchema } from "@/validations/coach-shift";
import { getEligibleCoveredCoaches } from "@/data/coach-shifts";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

async function checkCoverageClaim(
  actingCoachId: string,
  coveringForCoachId: string,
  venueId: string,
  shiftDate: string,
): Promise<CoverageEligibilityResult> {
  const [actingCoach, hasClassAtVenue, existingShift] = await Promise.all([
    prisma.coach.findUnique({ where: { id: actingCoachId }, select: { isHeadCoach: true } }),
    prisma.classAssignment.findFirst({ where: { coachId: coveringForCoachId, class: { venueId } } }),
    prisma.coachShift.findFirst({
      where: { coachId: coveringForCoachId, venueId, shiftDate, status: { in: ["OPEN", "PENDING", "APPROVED"] } },
    }),
  ]);

  return validateCoverageEligibility({
    actingCoachId,
    actingCoachIsHeadCoach: actingCoach?.isHeadCoach ?? false,
    coveredCoachId: coveringForCoachId,
    coveredCoachHasClassAtVenue: !!hasClassAtVenue,
    coveredCoachHasShiftThatDay: !!existingShift,
  });
}

export async function clockIn(input: unknown): Promise<ActionResult<{ shiftId: string }>> {
  const coach = await requireCoach();
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { venueId, coveringForCoachId } = parsed.data;

  const openShift = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (openShift) return { success: false, error: "You're already clocked in — clock out first." };

  const shiftDate = getSingaporeTodayString();

  if (coveringForCoachId) {
    const check = await checkCoverageClaim(coach.id, coveringForCoachId, venueId, shiftDate);
    if (!check.valid) return { success: false, error: check.error };
  }

  const shift = await prisma.coachShift.create({
    data: {
      coachId: coach.id,
      venueId,
      shiftDate,
      clockInAt: new Date(),
      status: "OPEN",
      coveringForCoachId: coveringForCoachId ?? null,
    },
  });

  revalidatePath("/hours");
  return { success: true, data: { shiftId: shift.id } };
}

export async function clockOut(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift || shift.coachId !== coach.id) return { success: false, error: "Shift not found." };
  if (shift.status !== "OPEN") return { success: false, error: "This shift isn't open." };

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { clockOutAt: new Date(), status: "PENDING" },
  });

  revalidatePath("/hours");
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function editShift(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = editShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId, clockInAt, clockOutAt, coveringForCoachId } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.coachId !== coach.id && !coach.isAdmin) return { success: false, error: "You don't have access to this shift." };
  if (shift.status !== "PENDING") return { success: false, error: "Reopen this shift before editing it." };

  const clockInDate = new Date(clockInAt);
  const clockOutDate = new Date(clockOutAt);
  if (clockOutDate <= clockInDate) return { success: false, error: "Clock-out must be after clock-in." };

  if (coveringForCoachId) {
    const check = await checkCoverageClaim(shift.coachId, coveringForCoachId, shift.venueId, shift.shiftDate);
    if (!check.valid) return { success: false, error: check.error };
  }

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { clockInAt: clockInDate, clockOutAt: clockOutDate, coveringForCoachId: coveringForCoachId ?? null },
  });

  revalidatePath("/hours");
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function reopenShift(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = reopenShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.coachId !== coach.id && !coach.isAdmin) return { success: false, error: "You don't have access to this shift." };
  if (shift.status === "OPEN" || shift.status === "PENDING") {
    return { success: false, error: "This shift is already open for editing." };
  }

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { status: "PENDING", approvedByCoachId: null, approvedAt: null, reviewNote: null },
  });

  revalidatePath("/hours");
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function getEligibleCoveringTargets(input: unknown): Promise<ActionResult<{ id: string; name: string }[]>> {
  const coach = await requireCoach();
  const parsed = z.object({ venueId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const targets = await getEligibleCoveredCoaches(parsed.data.venueId, getSingaporeTodayString(), coach.id);
  return { success: true, data: targets };
}
```

Note: `requireAdmin` is imported here in preparation for Task 7's `approveShift`/`rejectShift`, which live in this same file. It isn't called by this task's own code yet, but this project's `tsconfig.json` does not set `noUnusedLocals`/`noUnusedParameters`, so an unused import is not a `tsc` error — Step 8's type-check will still pass clean.

- [ ] **Step 4: Add the coverage toggle to the clock-in form**

Modify `src/components/hours/clock-in-form.tsx` — full file:

```tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { clockIn, clockOut, getEligibleCoveringTargets } from "@/actions/coach-shifts";

type Venue = { id: string; name: string };
type OpenShift = { id: string; venueName: string; clockInAt: string } | null;
type CoveringTarget = { id: string; name: string };

export function ClockInForm({
  openShift,
  venues,
  isHeadCoach,
}: {
  openShift: OpenShift;
  venues: Venue[];
  isHeadCoach: boolean;
}) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [isCovering, setIsCovering] = useState(false);
  const [coveringForCoachId, setCoveringForCoachId] = useState("");
  const [targets, setTargets] = useState<CoveringTarget[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isHeadCoach || !venueId) return;
    let cancelled = false;
    getEligibleCoveringTargets({ venueId }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setTargets(result.data);
        setCoveringForCoachId(result.data[0]?.id ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isHeadCoach, venueId]);

  async function handleClockIn() {
    setIsPending(true);
    const result = await clockIn({
      venueId,
      coveringForCoachId: isCovering && coveringForCoachId ? coveringForCoachId : null,
    });
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Clocked in.");
  }

  async function handleClockOut() {
    if (!openShift) return;
    setIsPending(true);
    const result = await clockOut({ shiftId: openShift.id });
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Clocked out.");
  }

  if (openShift) {
    const since = new Intl.DateTimeFormat("en-SG", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Singapore" }).format(
      new Date(openShift.clockInAt),
    );
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm">
          Currently clocked in at <span className="font-medium">{openShift.venueName}</span> since {since}
        </p>
        <Button size="lg" className="w-full sm:w-auto" onClick={handleClockOut} disabled={isPending}>
          {isPending ? "Clocking out..." : "Clock Out"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="venueId">Centre</Label>
        <NativeSelect id="venueId" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {isHeadCoach && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2">
            <input
              id="isCovering"
              type="checkbox"
              className="size-4 rounded border-input"
              checked={isCovering}
              onChange={(e) => setIsCovering(e.target.checked)}
            />
            <Label htmlFor="isCovering" className="font-normal">
              Covering for another coach?
            </Label>
          </div>
          {isCovering && (
            <NativeSelect value={coveringForCoachId} onChange={(e) => setCoveringForCoachId(e.target.value)}>
              {targets.length === 0 && <option value="">No eligible coaches at this centre</option>}
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>
      )}
      <Button size="lg" className="w-full sm:w-auto" onClick={handleClockIn} disabled={isPending || !venueId}>
        {isPending ? "Clocking in..." : "Clock In"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Add `venueId` to `ShiftRow` and thread `isHeadCoach` through**

Modify `src/components/hours/shift-history-table.tsx` — full file:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeShiftHours, computeShiftRate } from "@/lib/pay";
import { reopenShift } from "@/actions/coach-shifts";
import { EditShiftDialog } from "./edit-shift-dialog";

export type ShiftRow = {
  id: string;
  venueId: string;
  venueName: string;
  shiftDate: string;
  clockInAt: string;
  clockOutAt: string | null;
  status: "OPEN" | "PENDING" | "APPROVED" | "REJECTED";
  coveringForCoachId: string | null;
  coveringForCoachName: string | null;
};

const STATUS_LABEL: Record<ShiftRow["status"], string> = {
  OPEN: "Open",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function ShiftHistoryTable({ shifts, isHeadCoach }: { shifts: ShiftRow[]; isHeadCoach: boolean }) {
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftRow | null>(null);

  async function handleReopen(shiftId: string) {
    setReopeningId(shiftId);
    const result = await reopenShift({ shiftId });
    setReopeningId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shift reopened — you can edit it now.");
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">No shifts logged yet.</p>;
  }

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {shifts.map((shift) => {
          const hours = computeShiftHours({
            clockInAt: new Date(shift.clockInAt),
            clockOutAt: shift.clockOutAt ? new Date(shift.clockOutAt) : null,
          });
          const rate = computeShiftRate({ coveringForCoachId: shift.coveringForCoachId });
          return (
            <li key={shift.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <div className="flex-1 space-y-0.5">
                <p className="font-medium">
                  {shift.shiftDate} — {shift.venueName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hours.toFixed(2)}h × ${rate}/h
                  {shift.coveringForCoachName ? ` · Covering for ${shift.coveringForCoachName}` : ""}
                </p>
              </div>
              <Badge variant={shift.status === "APPROVED" ? "secondary" : "default"}>{STATUS_LABEL[shift.status]}</Badge>
              {shift.status === "PENDING" && (
                <Button size="sm" variant="outline" onClick={() => setEditingShift(shift)}>
                  Edit
                </Button>
              )}
              {(shift.status === "APPROVED" || shift.status === "REJECTED") && (
                <Button size="sm" variant="outline" disabled={reopeningId === shift.id} onClick={() => handleReopen(shift.id)}>
                  {reopeningId === shift.id ? "Reopening..." : "Reopen"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {editingShift && <EditShiftDialog shift={editingShift} isHeadCoach={isHeadCoach} onClose={() => setEditingShift(null)} />}
    </>
  );
}
```

- [ ] **Step 6: Add the coverage toggle to the edit dialog**

Modify `src/components/hours/edit-shift-dialog.tsx` — full file:

```tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { editShift, getEligibleCoveringTargets } from "@/actions/coach-shifts";
import type { ShiftRow } from "./shift-history-table";

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditShiftDialog({
  shift,
  isHeadCoach,
  onClose,
}: {
  shift: ShiftRow;
  isHeadCoach: boolean;
  onClose: () => void;
}) {
  const [clockInAt, setClockInAt] = useState(toLocalInputValue(shift.clockInAt));
  const [clockOutAt, setClockOutAt] = useState(shift.clockOutAt ? toLocalInputValue(shift.clockOutAt) : "");
  const [isCovering, setIsCovering] = useState(!!shift.coveringForCoachId);
  const [coveringForCoachId, setCoveringForCoachId] = useState(shift.coveringForCoachId ?? "");
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isHeadCoach) return;
    let cancelled = false;
    getEligibleCoveringTargets({ venueId: shift.venueId }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setTargets((prev) => {
          const existing =
            shift.coveringForCoachId && shift.coveringForCoachName
              ? [{ id: shift.coveringForCoachId, name: shift.coveringForCoachName }]
              : [];
          const merged = [...existing, ...result.data.filter((t) => t.id !== shift.coveringForCoachId)];
          return merged.length > 0 ? merged : prev;
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isHeadCoach, shift.venueId, shift.coveringForCoachId, shift.coveringForCoachName]);

  async function handleSave() {
    setIsPending(true);
    const result = await editShift({
      shiftId: shift.id,
      clockInAt: new Date(clockInAt).toISOString(),
      clockOutAt: new Date(clockOutAt).toISOString(),
      coveringForCoachId: isCovering && coveringForCoachId ? coveringForCoachId : null,
    });
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shift updated.");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit shift — {shift.venueName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="clockInAt">Clock in</Label>
            <Input id="clockInAt" type="datetime-local" value={clockInAt} onChange={(e) => setClockInAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clockOutAt">Clock out</Label>
            <Input id="clockOutAt" type="datetime-local" value={clockOutAt} onChange={(e) => setClockOutAt(e.target.value)} />
          </div>
          {isHeadCoach && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2">
                <input
                  id="editIsCovering"
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={isCovering}
                  onChange={(e) => setIsCovering(e.target.checked)}
                />
                <Label htmlFor="editIsCovering" className="font-normal">
                  Covering for another coach?
                </Label>
              </div>
              {isCovering && (
                <NativeSelect value={coveringForCoachId} onChange={(e) => setCoveringForCoachId(e.target.value)}>
                  {targets.length === 0 && <option value="">No eligible coaches at this centre</option>}
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Pass `isHeadCoach` and `venueId` down from the page**

Modify `src/app/(app)/hours/page.tsx` — full file:

```tsx
import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach, getAllVenuesForSelect, getShiftHistoryForCoach, getIsHeadCoach } from "@/data/coach-shifts";
import { ClockInForm } from "@/components/hours/clock-in-form";
import { ShiftHistoryTable, type ShiftRow } from "@/components/hours/shift-history-table";

export default async function HoursPage() {
  const coach = await requireCoach();
  const [openShift, venues, history, isHeadCoach] = await Promise.all([
    getOpenShiftForCoach(coach.id),
    getAllVenuesForSelect(),
    getShiftHistoryForCoach(coach.id),
    getIsHeadCoach(coach.id),
  ]);

  const shifts: ShiftRow[] = history.map((s) => ({
    id: s.id,
    venueId: s.venueId,
    venueName: s.venue.name,
    shiftDate: s.shiftDate,
    clockInAt: s.clockInAt.toISOString(),
    clockOutAt: s.clockOutAt ? s.clockOutAt.toISOString() : null,
    status: s.status,
    coveringForCoachId: s.coveringForCoachId,
    coveringForCoachName: s.coveringForCoach?.name ?? null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">My hours</h1>
        <p className="text-sm text-muted-foreground">Clock in when you arrive at a centre, clock out when you leave.</p>
      </div>
      <ClockInForm
        openShift={
          openShift ? { id: openShift.id, venueName: openShift.venue.name, clockInAt: openShift.clockInAt.toISOString() } : null
        }
        venues={venues}
        isHeadCoach={isHeadCoach}
      />
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">History</h2>
        <ShiftHistoryTable shifts={shifts} isHeadCoach={isHeadCoach} />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (aside from the possible unused-import note from Step 3, if your `tsconfig.json` doesn't already tolerate it — resolve per that step's note if it does error).

- [ ] **Step 9: Manually verify in the browser**

Log in as `aishah@map.test` / `Coach123!` (the seeded head coach). On `/hours`:
- Confirm the "Covering for another coach?" checkbox appears. Check it — confirm a dropdown of eligible coaches populates (coaches with a class at the selected centre, per the seed data).
- Clock in with a coverage target selected. Confirm success, then check History shows "Covering for `<name>`" and a rate of $120/h once clocked out.
- Try to break each guard: (a) log in as a non-head-coach (`farhan@map.test`) and confirm no coverage toggle appears at all; (b) as `aishah`, pick a venue with no eligible coaches and confirm the dropdown shows "No eligible coaches at this centre"; (c) have another coach (e.g. `danial@map.test`, in a second browser/incognito session) clock in at the same centre first, then confirm `danial` no longer appears in `aishah`'s eligible-coaches dropdown for that centre.

- [ ] **Step 10: Commit**

```bash
git add src/validations/coach-shift.ts src/data/coach-shifts.ts src/actions/coach-shifts.ts src/components/hours/clock-in-form.tsx src/components/hours/shift-history-table.tsx src/components/hours/edit-shift-dialog.tsx src/app/\(app\)/hours/page.tsx
git commit -m "feat: add head-coach coverage claims"
```

---

### Task 7: Admin approval queue

**Files:**
- Modify: `src/validations/coach-shift.ts`
- Modify: `src/data/coach-shifts.ts`
- Modify: `src/actions/coach-shifts.ts`
- Create: `src/app/(app)/payroll/page.tsx`
- Create: `src/components/payroll/pending-shifts-table.tsx`
- Modify: `src/components/nav/top-nav.tsx`

**Interfaces:**
- Consumes: `requireAdmin` from `src/lib/session.ts`; everything from Tasks 1-6, including `EditShiftDialog` and the `ShiftRow` type from `src/components/hours/` (reused here so an admin can fix a mistake before approving, per the spec).
- Produces: `rejectShiftSchema`; `getPendingShifts()`; `approveShift(input: unknown): Promise<ActionResult>`, `rejectShift(input: unknown): Promise<ActionResult>`; `PendingShiftRow` type (exported from `pending-shifts-table.tsx`). Task 8 extends `payroll/page.tsx` and `src/data/coach-shifts.ts` further — including this task's `PendingShiftRow` shape, which Task 8's full-file rewrite of `payroll/page.tsx` must keep populating identically (`venueId`, `coachIsHeadCoach` included).

- [ ] **Step 1: Add the reject schema**

Modify `src/validations/coach-shift.ts` — add after `reopenShiftSchema`:

```ts
export const rejectShiftSchema = z.object({
  shiftId: z.string().min(1),
  reviewNote: z.string().min(1).max(500),
});
```

- [ ] **Step 2: Add the pending-shifts query**

Modify `src/data/coach-shifts.ts` — add after `getEligibleCoveredCoaches`:

```ts
export async function getPendingShifts() {
  return prisma.coachShift.findMany({
    where: { status: "PENDING" },
    include: {
      coach: { select: { name: true, isHeadCoach: true } },
      venue: true,
      coveringForCoach: { select: { name: true } },
    },
    orderBy: { clockInAt: "asc" },
  });
}
```

- [ ] **Step 3: Add approveShift and rejectShift actions**

Modify `src/actions/coach-shifts.ts` — add `rejectShiftSchema` to the existing import from `@/validations/coach-shift`, and append the two new actions at the end of the file:

```ts
import { clockInSchema, clockOutSchema, editShiftSchema, reopenShiftSchema, rejectShiftSchema } from "@/validations/coach-shift";
```

```ts
export async function approveShift(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z.object({ shiftId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.status !== "PENDING") return { success: false, error: "Only pending shifts can be approved." };

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { status: "APPROVED", approvedByCoachId: admin.id, approvedAt: new Date() },
  });

  revalidatePath("/payroll");
  revalidatePath("/hours");
  return { success: true, data: undefined };
}

export async function rejectShift(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = rejectShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { shiftId, reviewNote } = parsed.data;

  const shift = await prisma.coachShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.status !== "PENDING") return { success: false, error: "Only pending shifts can be rejected." };

  await prisma.coachShift.update({
    where: { id: shiftId },
    data: { status: "REJECTED", approvedByCoachId: admin.id, approvedAt: new Date(), reviewNote },
  });

  revalidatePath("/payroll");
  revalidatePath("/hours");
  return { success: true, data: undefined };
}
```

(`requireAdmin` is already imported as of Task 6, Step 3.)

- [ ] **Step 4: Create the pending shifts table**

Create `src/components/payroll/pending-shifts-table.tsx`. This reuses `EditShiftDialog` from Task 5/6 (via a small `toShiftRow` adapter) so an admin can fix a mistake — e.g. a wrong clock-out — before approving, per the spec's "Approve, Edit, or Reject" admin actions:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { computeShiftHours, computeShiftRate, computeShiftPay } from "@/lib/pay";
import { approveShift, rejectShift } from "@/actions/coach-shifts";
import { EditShiftDialog } from "@/components/hours/edit-shift-dialog";
import type { ShiftRow } from "@/components/hours/shift-history-table";

export type PendingShiftRow = {
  id: string;
  venueId: string;
  coachName: string;
  coachIsHeadCoach: boolean;
  venueName: string;
  shiftDate: string;
  clockInAt: string;
  clockOutAt: string;
  coveringForCoachId: string | null;
  coveringForCoachName: string | null;
};

// PendingShiftRow carries a real value for every ShiftRow field (status is
// always "PENDING" for a row in this table by definition) — no fabricated
// data, just a reshape so the admin queue can reuse the coach-side dialog.
function toShiftRow(shift: PendingShiftRow): ShiftRow {
  return {
    id: shift.id,
    venueId: shift.venueId,
    venueName: shift.venueName,
    shiftDate: shift.shiftDate,
    clockInAt: shift.clockInAt,
    clockOutAt: shift.clockOutAt,
    status: "PENDING",
    coveringForCoachId: shift.coveringForCoachId,
    coveringForCoachName: shift.coveringForCoachName,
  };
}

export function PendingShiftsTable({ shifts }: { shifts: PendingShiftRow[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [editingRow, setEditingRow] = useState<PendingShiftRow | null>(null);

  async function handleApprove(shiftId: string) {
    setProcessingId(shiftId);
    const result = await approveShift({ shiftId });
    setProcessingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shift approved.");
  }

  async function handleReject(shiftId: string) {
    if (!reviewNote.trim()) {
      toast.error("Add a reason before rejecting.");
      return;
    }
    setProcessingId(shiftId);
    const result = await rejectShift({ shiftId, reviewNote });
    setProcessingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shift rejected.");
    setRejectingId(null);
    setReviewNote("");
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing waiting for approval.</p>;
  }

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {shifts.map((shift) => {
          const shiftTimes = { clockInAt: new Date(shift.clockInAt), clockOutAt: new Date(shift.clockOutAt) };
          const hours = computeShiftHours(shiftTimes);
          const rate = computeShiftRate({ coveringForCoachId: shift.coveringForCoachId });
          const pay = computeShiftPay({ ...shiftTimes, coveringForCoachId: shift.coveringForCoachId });
          const isRejecting = rejectingId === shift.id;
          return (
            <li key={shift.id} className="space-y-2 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 space-y-0.5">
                  <p className="font-medium">
                    {shift.coachName} — {shift.venueName} — {shift.shiftDate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hours.toFixed(2)}h × ${rate}/h = ${pay.toFixed(2)}
                  </p>
                </div>
                {shift.coveringForCoachName && <Badge>Covering for {shift.coveringForCoachName}</Badge>}
                <Button size="sm" disabled={processingId === shift.id} onClick={() => handleApprove(shift.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingRow(shift)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectingId(isRejecting ? null : shift.id)}>
                  Reject
                </Button>
              </div>
              {isRejecting && (
                <div className="flex gap-2">
                  <Input placeholder="Reason for rejecting" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
                  <Button size="sm" variant="destructive" disabled={processingId === shift.id} onClick={() => handleReject(shift.id)}>
                    Confirm reject
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {editingRow && (
        <EditShiftDialog
          shift={toShiftRow(editingRow)}
          isHeadCoach={editingRow.coachIsHeadCoach}
          onClose={() => setEditingRow(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: Create the Payroll page**

Create `src/app/(app)/payroll/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/session";
import { getPendingShifts } from "@/data/coach-shifts";
import { PendingShiftsTable, type PendingShiftRow } from "@/components/payroll/pending-shifts-table";

export default async function PayrollPage() {
  await requireAdmin();
  const pending = await getPendingShifts();

  const pendingRows: PendingShiftRow[] = pending.map((s) => ({
    id: s.id,
    venueId: s.venueId,
    coachName: s.coach.name,
    coachIsHeadCoach: s.coach.isHeadCoach,
    venueName: s.venue.name,
    shiftDate: s.shiftDate,
    clockInAt: s.clockInAt.toISOString(),
    // PENDING is only reached via clockOut/reopen, both of which require clockOutAt.
    clockOutAt: s.clockOutAt!.toISOString(),
    coveringForCoachId: s.coveringForCoachId,
    coveringForCoachName: s.coveringForCoach?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Review and approve coach hours before they count toward pay.</p>
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Pending approval</h2>
        <PendingShiftsTable shifts={pendingRows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Add "Payroll" next to "Venues" in the top nav**

Modify `src/components/nav/top-nav.tsx` — full file:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, UserCircle, LogOut, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/format";
import { signOutAction } from "@/actions/coaches";
import { AppLogo } from "@/components/app-logo";

type NavCoach = { id: string; name: string; isAdmin: boolean };

export function TopNav({ coach }: { coach: NavCoach }) {
  const pathname = usePathname();
  const profileHref = `/coaches/${coach.id}`;
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/students", label: "Students", icon: Users },
    { href: "/hours", label: "Hours", icon: Clock },
    { href: "/curriculum", label: "Curriculum", icon: BookOpen },
    { href: profileHref, label: "Profile", icon: UserCircle },
  ];
  const adminLinks = [
    { href: "/venues", label: "Venues" },
    { href: "/payroll", label: "Payroll" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-sm font-semibold">
          <AppLogo size={28} />
          MAP Coach Portal
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                  isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          {coach.isAdmin &&
            adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname.startsWith(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  pathname.startsWith(link.href) ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
          </Avatar>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Manually verify in the browser**

As a regular coach, clock in and out twice (creating two PENDING shifts). Log in as `admin@map.test` / `Coach123!`. Navigate to `/payroll` (visible in the top nav next to "Venues" on desktop width). Confirm:
- Both pending shifts are listed with correct hours/rate/pay.
- Clicking "Edit" on one opens the same dialog used on `/hours`, prefilled with that shift's times; change the clock-out time and save — confirm the toast and the updated hours/pay in the list.
- Clicking "Approve" on the other removes it from the list with a success toast.
- Create a third pending shift, click "Reject": submitting without a reason shows an error toast; typing a reason and confirming removes it from the list.
- Log in as a non-admin coach and confirm `/payroll` does not render the queue (per this app's existing `requireAdmin()` behavior for admin-only pages).

- [ ] **Step 9: Commit**

```bash
git add src/validations/coach-shift.ts src/data/coach-shifts.ts src/actions/coach-shifts.ts src/app/\(app\)/payroll/page.tsx src/components/payroll/pending-shifts-table.tsx src/components/nav/top-nav.tsx
git commit -m "feat: add admin approval queue for coach shifts"
```

---

### Task 8: Pay summary and CSV export

**Files:**
- Modify: `src/lib/pay.ts`
- Test: `src/lib/pay.test.ts`
- Modify: `src/data/coach-shifts.ts`
- Create: `src/components/payroll/pay-summary.tsx`
- Create: `src/app/api/payroll/export/route.ts`
- Modify: `src/app/(app)/payroll/page.tsx`

**Interfaces:**
- Consumes: `computeShiftHours`, `computeShiftRate`, `computeShiftPay` (Task 1); `requireAdmin` (existing); `getSingaporeTodayString` (existing).
- Produces: `ShiftForPay` (type), `CoachPaySummary` (type), `summarizePayByCoach(shifts: ShiftForPay[]): CoachPaySummary[]` (in `src/lib/pay.ts`); `getApprovedShiftsForPeriod(from: string, to: string)` (in `src/data/coach-shifts.ts`). Nothing later depends on this — it's the final task.

**Note on naming vs. the spec:** the spec's Files section names a single `getPaySummary(dateRange)`. This plan splits that into `getApprovedShiftsForPeriod` (raw approved shifts for a date range) plus the pure `summarizePayByCoach` (the actual per-coach aggregation). Rationale: both the on-screen table (this task's page) and the CSV route need the identical aggregation, and keeping it as a pure function — instead of duplicating the grouping logic in two places — means it can be unit-tested (Steps 1-4 below) and guarantees the screen and the export can never disagree.

- [ ] **Step 1: Write the failing test for the aggregation function**

Modify `src/lib/pay.test.ts` — add these imports and describe block:

```ts
import { describe, it, expect } from "vitest";
import {
  computeShiftHours,
  computeShiftRate,
  computeShiftPay,
  summarizePayByCoach,
  BASE_RATE_PER_HOUR,
  COVERAGE_PREMIUM_PER_HOUR,
  type ShiftForPay,
} from "./pay";

describe("computeShiftHours", () => {
  it("returns the exact decimal hours between clock in and clock out", () => {
    const shift = { clockInAt: new Date("2026-08-29T09:00:00Z"), clockOutAt: new Date("2026-08-29T10:45:00Z") };
    expect(computeShiftHours(shift)).toBeCloseTo(1.75, 5);
  });

  it("returns 0 when there is no clock-out yet", () => {
    const shift = { clockInAt: new Date("2026-08-29T09:00:00Z"), clockOutAt: null };
    expect(computeShiftHours(shift)).toBe(0);
  });
});

describe("computeShiftRate", () => {
  it("returns the base rate for a regular shift", () => {
    expect(computeShiftRate({ coveringForCoachId: null })).toBe(BASE_RATE_PER_HOUR);
  });

  it("returns base + premium for a covering shift", () => {
    expect(computeShiftRate({ coveringForCoachId: "coach_123" })).toBe(BASE_RATE_PER_HOUR + COVERAGE_PREMIUM_PER_HOUR);
  });
});

describe("computeShiftPay", () => {
  it("multiplies hours by the applicable rate", () => {
    const shift = {
      clockInAt: new Date("2026-08-29T09:00:00Z"),
      clockOutAt: new Date("2026-08-29T11:00:00Z"),
      coveringForCoachId: "coach_123",
    };
    expect(computeShiftPay(shift)).toBe(2 * (BASE_RATE_PER_HOUR + COVERAGE_PREMIUM_PER_HOUR));
  });
});

describe("summarizePayByCoach", () => {
  it("splits regular and covering hours per coach and totals pay", () => {
    const shifts: ShiftForPay[] = [
      {
        coachId: "c1",
        coachName: "Farhan",
        clockInAt: new Date("2026-08-01T09:00:00Z"),
        clockOutAt: new Date("2026-08-01T11:00:00Z"),
        coveringForCoachId: null,
      },
      {
        coachId: "c1",
        coachName: "Farhan",
        clockInAt: new Date("2026-08-02T09:00:00Z"),
        clockOutAt: new Date("2026-08-02T10:00:00Z"),
        coveringForCoachId: "c2",
      },
    ];
    const result = summarizePayByCoach(shifts);
    expect(result).toEqual([{ coachId: "c1", coachName: "Farhan", regularHours: 2, coveringHours: 1, totalPay: 2 * 80 + 1 * 120 }]);
  });

  it("returns an empty array for no shifts", () => {
    expect(summarizePayByCoach([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test, verify the new cases fail**

Run: `npx vitest run src/lib/pay.test.ts`
Expected: the `computeShift*` tests still PASS; the two new `summarizePayByCoach` tests FAIL (not exported yet).

- [ ] **Step 3: Implement `summarizePayByCoach`**

Modify `src/lib/pay.ts` — add at the end of the file:

```ts
export type ShiftForPay = {
  coachId: string;
  coachName: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  coveringForCoachId: string | null;
};

export type CoachPaySummary = {
  coachId: string;
  coachName: string;
  regularHours: number;
  coveringHours: number;
  totalPay: number;
};

export function summarizePayByCoach(shifts: ShiftForPay[]): CoachPaySummary[] {
  const byCoach = new Map<string, CoachPaySummary>();
  for (const shift of shifts) {
    const hours = computeShiftHours(shift);
    const pay = computeShiftPay(shift);
    const existing = byCoach.get(shift.coachId) ?? {
      coachId: shift.coachId,
      coachName: shift.coachName,
      regularHours: 0,
      coveringHours: 0,
      totalPay: 0,
    };
    if (shift.coveringForCoachId) {
      existing.coveringHours += hours;
    } else {
      existing.regularHours += hours;
    }
    existing.totalPay += pay;
    byCoach.set(shift.coachId, existing);
  }
  return Array.from(byCoach.values()).sort((a, b) => a.coachName.localeCompare(b.coachName));
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run src/lib/pay.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Add the period query**

Modify `src/data/coach-shifts.ts` — add after `getPendingShifts`:

```ts
export async function getApprovedShiftsForPeriod(from: string, to: string) {
  return prisma.coachShift.findMany({
    where: { status: "APPROVED", shiftDate: { gte: from, lte: to } },
    include: { coach: { select: { id: true, name: true } }, venue: true, coveringForCoach: { select: { name: true } } },
    orderBy: [{ coach: { name: "asc" } }, { shiftDate: "asc" }],
  });
}
```

- [ ] **Step 6: Create the pay summary component**

Create `src/components/payroll/pay-summary.tsx`:

```tsx
import type { CoachPaySummary } from "@/lib/pay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaySummary({ from, to, summary }: { from: string; to: string; summary: CoachPaySummary[] }) {
  const grandTotal = summary.reduce((sum, row) => sum + row.totalPay, 0);

  return (
    <div className="space-y-3">
      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
        <a href={`/api/payroll/export?from=${from}&to=${to}`} className="ml-auto text-sm font-medium underline underline-offset-2">
          Download CSV
        </a>
      </form>
      {summary.length === 0 ? (
        <p className="text-sm text-muted-foreground">No approved hours in this period.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 font-medium">Coach</th>
              <th className="py-2 font-medium">Regular hrs</th>
              <th className="py-2 font-medium">Covering hrs</th>
              <th className="py-2 font-medium">Pay</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.coachId} className="border-b">
                <td className="py-2">{row.coachName}</td>
                <td className="py-2">{row.regularHours.toFixed(2)}</td>
                <td className="py-2">{row.coveringHours.toFixed(2)}</td>
                <td className="py-2">${row.totalPay.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-2 font-medium" colSpan={3}>
                Total
              </td>
              <td className="pt-2 font-medium">${grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create the CSV export route**

Create `src/app/api/payroll/export/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getApprovedShiftsForPeriod } from "@/data/coach-shifts";
import { computeShiftHours, computeShiftRate, computeShiftPay } from "@/lib/pay";

// Same "YYYY-MM-DD" pattern as src/validations/attendance.ts's dateString.
// from/to come straight off the URL — validate the shape before they reach
// the database query or (further down) an HTTP response header.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to || !DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return NextResponse.json({ error: "from and to must be YYYY-MM-DD" }, { status: 400 });
  }

  const shifts = await getApprovedShiftsForPeriod(from, to);

  const header = ["Coach", "Date", "Venue", "Clock in", "Clock out", "Hours", "Rate", "Pay", "Covering for"];
  const rows = shifts.map((s) => {
    const shift = { clockInAt: s.clockInAt, clockOutAt: s.clockOutAt, coveringForCoachId: s.coveringForCoachId };
    const hours = computeShiftHours(shift);
    const rate = computeShiftRate(shift);
    const pay = computeShiftPay(shift);
    return [
      s.coach.name,
      s.shiftDate,
      s.venue.name,
      s.clockInAt.toISOString(),
      s.clockOutAt ? s.clockOutAt.toISOString() : "",
      hours.toFixed(2),
      rate.toFixed(2),
      pay.toFixed(2),
      s.coveringForCoach?.name ?? "",
    ].map((v) => csvEscape(String(v)));
  });

  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payroll-${from}-to-${to}.csv"`,
    },
  });
}
```

- [ ] **Step 8: Wire the summary into the Payroll page**

Modify `src/app/(app)/payroll/page.tsx` — full file:

```tsx
import { requireAdmin } from "@/lib/session";
import { getPendingShifts, getApprovedShiftsForPeriod } from "@/data/coach-shifts";
import { summarizePayByCoach, type ShiftForPay } from "@/lib/pay";
import { getSingaporeTodayString } from "@/lib/dates";
import { PendingShiftsTable, type PendingShiftRow } from "@/components/payroll/pending-shifts-table";
import { PaySummary } from "@/components/payroll/pay-summary";

function firstOfMonth(today: string): string {
  return `${today.slice(0, 7)}-01`;
}

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const today = getSingaporeTodayString();
  const from = params.from ?? firstOfMonth(today);
  const to = params.to ?? today;

  const [pending, approvedShifts] = await Promise.all([getPendingShifts(), getApprovedShiftsForPeriod(from, to)]);

  const pendingRows: PendingShiftRow[] = pending.map((s) => ({
    id: s.id,
    venueId: s.venueId,
    coachName: s.coach.name,
    coachIsHeadCoach: s.coach.isHeadCoach,
    venueName: s.venue.name,
    shiftDate: s.shiftDate,
    clockInAt: s.clockInAt.toISOString(),
    // PENDING is only reached via clockOut/reopen, both of which require clockOutAt.
    clockOutAt: s.clockOutAt!.toISOString(),
    coveringForCoachId: s.coveringForCoachId,
    coveringForCoachName: s.coveringForCoach?.name ?? null,
  }));

  const shiftsForPay: ShiftForPay[] = approvedShifts.map((s) => ({
    coachId: s.coach.id,
    coachName: s.coach.name,
    clockInAt: s.clockInAt,
    clockOutAt: s.clockOutAt,
    coveringForCoachId: s.coveringForCoachId,
  }));
  const summary = summarizePayByCoach(shiftsForPay);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Review and approve coach hours before they count toward pay.</p>
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Pending approval</h2>
        <PendingShiftsTable shifts={pendingRows} />
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Pay summary</h2>
        <PaySummary from={from} to={to} summary={summary} />
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Manually verify in the browser**

As admin on `/payroll`:
- Approve a regular shift and a covering shift (clock a head coach in/out with coverage first if none are pending).
- Confirm the "Pay summary" table shows the coach split into regular/covering hours with the correct total (regular × $80 + covering × $120).
- Change the "From"/"To" dates to exclude today and click "Apply" — confirm the table updates (e.g. shows "No approved hours in this period" if nothing falls in range).
- Reset the range back to include today, click "Download CSV," open the downloaded file, and confirm the header row and values match what's on screen (including the "Covering for" column being blank for regular shifts).

- [ ] **Step 11: Commit**

```bash
git add src/lib/pay.ts src/lib/pay.test.ts src/data/coach-shifts.ts src/components/payroll/pay-summary.tsx src/app/api/payroll/export/route.ts src/app/\(app\)/payroll/page.tsx
git commit -m "feat: add pay summary and CSV export"
```

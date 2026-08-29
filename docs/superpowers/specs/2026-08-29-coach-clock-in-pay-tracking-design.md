# Coach clock-in & pay tracking — design

## Context

The project is shifting focus toward collating student and coach attendance
more efficiently. That larger goal decomposes into four independent
sub-projects:

1. **Coach clock-in & pay tracking** (this spec)
2. Student intake (expanded registration form)
3. QR check-in (coach scans a student's code, auto-marks them present)
4. Digital wallet pass (Apple Wallet / Google Wallet) for students

Decisions already made that constrain all four, recorded here for context:

- Students will **not** check in via phone-to-phone NFC — Apple restricts
  NFC card-emulation to its own Wallet/Pay, and Web NFC (tag-reading only)
  exists only in Chrome on Android, not Safari/iOS. Sub-project 3 will use a
  QR code scanned by the coach's phone camera instead.
- Coach and student data stay in **one database**, logically separated by
  model — not two physical databases — so an attendance record can still
  directly reference both a coach and a student.
- The QR check-in (sub-project 3) will **feed into** the existing
  `AttendanceSession`/`AttendanceRecord` roster rather than replacing manual
  marking, preserving the existing 80%-disbursement and 6-absence-removal
  policy flags.

This document covers **only** sub-project 1. The other three will each get
their own spec when brainstormed.

## Goals

- A coach can clock in and out of a coaching session at a centre (venue),
  with the time in/out captured automatically rather than typed.
- A coach's worked hours are tracked and turned into pay at a flat
  **$80/hour**.
- A **head coach** covering for an absent coach can log that coverage and
  earn a **$40/hour premium** ($120/hour total) for the hours covered, with
  guards that prevent a false or duplicate coverage claim, and with every
  coverage claim visibly surfaced to an admin before it counts as pay.
- Nothing counts toward pay until an admin approves it.
- An admin can see a pay summary for a date range and export it as CSV.

## Non-goals (this pass)

- Student-facing attendance (intake form, QR check-in, wallet pass) — separate specs.
- Per-coach or per-venue pay rates — the $80 base and $40 premium are flat constants in code.
- Notifying the covered coach that they were named in a coverage claim.
- Overtime rules, shift-length caps, or scheduling/rostering of who *should* be where.
- Automated fraud detection beyond the guards below — legitimacy beyond those guards is an admin judgment call at approval time.

## Data model

Additions to `prisma/schema.prisma`:

```prisma
enum CoachShiftStatus {
  OPEN     // clocked in, not yet clocked out
  PENDING  // clocked out (or edited), awaiting admin review
  APPROVED // admin-approved, counts toward pay
  REJECTED // admin-rejected, does not count toward pay
}

model CoachShift {
  id        String   @id @default(cuid())
  coachId   String
  coach     Coach    @relation("CoachShifts", fields: [coachId], references: [id], onDelete: Restrict)
  venueId   String
  venue     Venue    @relation(fields: [venueId], references: [id], onDelete: Restrict)
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

`Coach` gains:

```prisma
isHeadCoach Boolean @default(false) // admin-controlled, same pattern as isAdmin

shifts         CoachShift[] @relation("CoachShifts")
coveredShifts  CoachShift[] @relation("CoveredShifts")
approvedShifts CoachShift[] @relation("ApprovedShifts")
```

`Venue` gains a back-relation: `coachShifts CoachShift[]`.

**Why `Restrict` on `coachId`/`venueId`**: these are payroll records; a coach
or venue with shift history shouldn't be silently deletable (same reasoning
as `Student.venueId` already using `Restrict`). `SetNull` on
`coveringForCoachId`/`approvedByCoachId` matches the existing
`AttendanceSession.markedByCoachId` pattern — these are secondary references,
not the record's owner.

Hours and pay are **computed, not stored** — same philosophy as
`src/lib/attendance-stats.ts` computing attendance percentages as pure
functions rather than persisting them:

```ts
// src/lib/pay.ts
export const BASE_RATE_PER_HOUR = 80;
export const COVERAGE_PREMIUM_PER_HOUR = 40;

export function computeShiftHours(shift: { clockInAt: Date; clockOutAt: Date | null }): number {
  if (!shift.clockOutAt) return 0;
  return (shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / 3_600_000;
}

export function computeShiftRate(shift: { coveringForCoachId: string | null }): number {
  return shift.coveringForCoachId ? BASE_RATE_PER_HOUR + COVERAGE_PREMIUM_PER_HOUR : BASE_RATE_PER_HOUR;
}

export function computeShiftPay(shift: Parameters<typeof computeShiftHours>[0] & Parameters<typeof computeShiftRate>[0]): number {
  return computeShiftHours(shift) * computeShiftRate(shift);
}
```

No rounding: hours are exact to the minute (a decimal, e.g. 1.75h), which is
both the simplest implementation and the fairest to the coach.

## Coverage anti-abuse guards

A coverage claim (`coveringForCoachId` set on clock-in or edit) is validated
server-side — not just hidden in the UI when conditions aren't met — by a
shared check (`src/lib/coverage.ts`):

1. The shift's owner must have `isHeadCoach === true`.
2. The covering coach cannot name themselves.
3. The named coach must have at least one `ClassAssignment` at that venue
   (via `ClassAssignment` → `Class.venueId`) — you can't claim to cover
   someone with no real connection to that centre.
4. The named coach must **not** already have a shift of their own (status
   `OPEN`, `PENDING`, or `APPROVED`) for that same `venueId` + `shiftDate` —
   you can't claim to cover someone who also clocked in themselves. This is
   rejected at submission time, not left for an admin to catch later.

Beyond these four checks, legitimacy is the admin's call at approval time:
the approval screen always shows "Covering for: `<name>`" on a coverage
shift, so an admin can't approve one without seeing what they're approving.

## Coach-facing flow (`/hours`, all coaches)

- No open shift → a **Clock In** control: pick a centre (venue dropdown),
  submit. If the signed-in coach `isHeadCoach`, an optional "Covering for
  another coach?" toggle appears, populated only with coaches passing
  guards 2-4 above (not themselves, assigned at that venue, no shift of
  their own yet today) — so the dropdown can't offer a choice that would
  fail on submit.
- Open shift → "Currently at `<centre>` since `<time>`" with a **Clock Out**
  button.
- A history table below: date, centre, hours, rate applied ($80/$120),
  status. Rows with status `OPEN` or `PENDING` are editable (clock
  in/out time, and the covering-for field) via a dialog, reusing the
  existing `Dialog` component. An `APPROVED` or `REJECTED` row shows a
  **Reopen** action (sets it back to `PENDING`) before it can be edited
  again — mirroring the existing attendance session's
  lock-until-reopened pattern.
- A running total for the current period: pending hours/pay and approved
  hours/pay, shown separately so a coach can see what's confirmed.

## Admin-facing flow (`/payroll`, admin only)

- **Pending queue**: every `PENDING` shift across all coaches. Coverage
  shifts are visually flagged. Per row: **Approve**, **Edit** (fix a
  mistake, e.g. a wrong clock-out, before approving), or **Reject** (requires
  a `reviewNote` so the coach can see why).
- **Pay summary**: a date-range picker (default: current calendar month), a
  per-coach table splitting regular hours (×$80) from covering hours
  (×$120) into a total, and a **Download CSV** button for that range. CSV
  columns: coach name, date, venue, clock-in, clock-out, hours, rate,
  pay, and (when applicable) covering-for name.

## Files

Following this project's existing layering (`src/data` reads,
`src/actions` `"use server"` mutations, `src/validations` Zod schemas):

- `prisma/schema.prisma` — additions above; `npx prisma migrate dev` to apply.
- `src/lib/pay.ts` — pure rate/hours/pay functions (above).
- `src/lib/coverage.ts` — the four-guard coverage validation function.
- `src/validations/coach-shift.ts` — Zod schemas: `clockInSchema`
  (`venueId`, optional `coveringForCoachId`), `clockOutSchema` (`shiftId`),
  `editShiftSchema` (`shiftId`, `clockInAt`, `clockOutAt`, optional
  `coveringForCoachId`), `rejectShiftSchema` (`shiftId`, `reviewNote`).
- `src/data/coach-shifts.ts` — `getOpenShiftForCoach`,
  `getShiftHistoryForCoach`,
  `getEligibleCoveredCoaches(venueId, shiftDate, excludingCoachId)` (applies
  guards 2-4), `getPendingShifts` (admin), `getPaySummary(dateRange)` (admin).
- `src/actions/coach-shifts.ts` — `clockIn`, `clockOut`, `editShift`,
  `reopenShift`, `approveShift`, `rejectShift`. Each starts with
  `requireCoach()`/`requireAdmin()` per existing convention; `clockIn` and
  `editShift` call the guard in `src/lib/coverage.ts` whenever
  `coveringForCoachId` is present.
- `src/app/(app)/hours/page.tsx` — coach-facing flow.
- `src/app/(app)/payroll/page.tsx` — admin-facing flow.
- `src/app/api/payroll/export/route.ts` — `GET`, admin-only, `?from=&to=`
  query params, streams `text/csv`. A route handler rather than a server
  action because triggering a file download needs a real HTTP response.
- `src/components/hours/` — `clock-in-form.tsx`, `shift-history-table.tsx`,
  `edit-shift-dialog.tsx`.
- `src/components/payroll/` — `pending-shifts-table.tsx`, `pay-summary.tsx`.
- `src/components/nav/top-nav.tsx` / `bottom-tab-bar.tsx` — add "Hours" (all
  coaches) and "Payroll" (admin only) entries.

## Edge cases

- A coach cannot clock in while they already have an `OPEN` shift (checked
  in `clockIn` before creating a new row).
- Clocking out sets `clockOutAt` and flips status to `PENDING` in one write.
- Editing an `OPEN`/`PENDING` shift is unrestricted (owner or admin);
  editing an `APPROVED`/`REJECTED` shift requires `reopenShift` first.
- `shiftDate` is set once at clock-in (always "today," since clock-in is a
  live punch) and is **not** independently editable — `editShift` only
  corrects `clockInAt`/`clockOutAt` (and `coveringForCoachId`) within that
  same calendar day. A shift logged on the wrong day has no in-place fix;
  it should be rejected and re-logged.
- `reopenShift` clears `approvedAt`/`approvedByCoachId` and sets status back
  to `PENDING` — no approval history is retained beyond the current state,
  matching how `reopenAttendanceSession` simply nulls `submittedAt` today.
- Rejecting a shift requires a `reviewNote`; approving does not.
- Deleting a coach or venue with existing `CoachShift` rows is blocked at
  the database level (`Restrict`).

## Testing approach

This project has no automated test suite today (verified: no test runner in
`package.json`, no `*.test.*`/`*.spec.*` files). Consistent with that,
verification for this feature is manual: run `npm run dev`, exercise
clock-in/out, editing, reopening, coverage claims (including each of the
four guard failures), approval/rejection, and the CSV export, plus
`npx tsc --noEmit` for type-checking. The rate/hours/coverage-guard logic is
still written as small pure functions (`src/lib/pay.ts`,
`src/lib/coverage.ts`) so it stays easy to unit-test later if a test
framework is introduced.

# QR Check-In & Coach Shift Payroll — Design Spec

**Status:** Supersedes `2026-09-03-open-study-space-checkin-design.md` — adopts its core pivot
(drop-in visits at a `Venue`, no fixed class schedule, MAP policy flags dropped) but replaces its
code-entry check-in with **QR camera scanning**, which that spec explicitly deferred as a separate,
unbuilt piece ("a separate spec elsewhere in this repo explored a QR-scanning version... this spec
does not build on it" — this is that spec). Also absorbs the payroll mechanics from
`2026-08-29-coach-clock-in-pay-tracking-design.md` (its `CoachShift` model, approval queue, flat
hourly rate) **excluding** that draft's head-coach coverage-premium feature, which is unrelated to
what prompted this pass and adds real complexity (eligibility guards, fraud checks) nobody asked
for here. If coverage pay is still wanted later, it layers on top of `CoachShift` cleanly — nothing
here forecloses it.

This is a full pivot of the coach-facing app, same as the spec it supersedes.

## Goal

Each MENDAKI centre (`Venue`) is an open study space. A student scans a personal QR code (or a
coach scans it for them) to check in — no scheduled class, no roster, no fixed session time.
Separately, a coach's day starts by clocking in at a venue; that live shift is what "location" and
"session" mean for every scan made while it's open, and it's also how coaching hours turn into pay.

- **Registered before:** the coach scans their QR (or types their code if the scan fails);
  check-in is recorded against the coach's current open shift's venue. Guardian is notified if
  the student is a MAP student.
- **Never registered:** the student scans a generic onboarding QR (posted at any centre — not
  venue-specific, since the venue that matters is chosen dynamically by whichever coach checks
  them in, not by where they signed up) which opens a public registration page. On submit, they
  get a permanent QR tied to their account, reusable on every future visit.
- **No smartphone in hand right now:** a coach can run the same registration form from the
  check-in desk and immediately log the visitor's first check-in.

## Non-goals (this phase)

- **Head-coach coverage claims / $120/hr premium** — out of scope, see Status above.
- **Apple/Google Wallet passes** — an on-screen, screenshot-able QR covers "bring it next time"
  without new infra. Can be layered on later (it would just wrap the same QR payload).
- **MAP policy flags** (80% disbursement, 6-consecutive-absence removal) — dropped. Check-in is
  presence logging: who, where, when. Nothing computes a disbursement or removal flag.
- **Admin-configurable pay rate** — a single hardcoded `$80`/hour constant, same for every coach.
- **Deleting `Class`/`Enrollment`/`ClassAssignment`/`AttendanceSession`/`AttendanceRecord`/
  `ClassProgress`** — all stay in the schema and codebase, untouched, simply disconnected from
  nav. Same non-destructive pattern this repo already uses (see the spec this supersedes).
  `/curriculum` is unaffected either way — it's already keyed by subject+level, not a class.
- **Retrofitting the visual redesign across existing screens** — this phase applies the new
  visual system (below) only to the screens it introduces. A follow-up phase restyles the rest of
  the app to match, so nothing here gets built twice.
- **Rate-limiting or abuse protection on the public registration endpoint** — it's intentionally
  open to anyone with the onboarding QR/link, same trust level as a public contact form. Flagging
  this as a deliberate choice, not an oversight, consistent with this project's general "no extra
  infra for problems that haven't occurred" posture (see: no real SMS/email provider either).

## Data model

```prisma
enum Level {
  P1
  P2
  P3
  P4
  P5
  P6
  SEC1
  SEC2
  SEC3
  SEC4
  SEC5
  JC1  // new
  JC2  // new
}

enum EmergencyContactRelationship {
  MOTHER
  FATHER
  GUARDIAN
  OTHER // the source form only lists the first three; added as a catch-all so no real visitor is unrepresentable
}

enum ReferralSource {
  MAP_CLASS
  SOCIAL_MEDIA
  FRIENDS_FAMILY
  OTHER
}

enum CoachShiftStatus {
  OPEN     // clocked in, not yet clocked out
  PENDING  // clocked out (or edited), awaiting admin review
  APPROVED // admin-approved, counts toward pay
  REJECTED // admin-rejected, does not count toward pay
}

model Student {
  id       String @id @default(cuid())
  name     String
  level    Level
  // Home venue is gone — nothing about where a student "belongs" survives the
  // dynamic model. Which venue a visit happened at now lives entirely on
  // CheckIn, decided by whichever coach's open shift they were scanned into.

  contactNumber String
  schoolName    String
  email         String
  isMapStudent  Boolean @default(true) // default true: every existing seeded student stays a MAP student with no backfill decision needed

  // Renamed from guardianName/guardianPhone to match what the source
  // registration form actually calls this (Student Emergency Contact Name /
  // relationship / number) — same person, more accurate field names.
  emergencyContactName         String
  emergencyContactRelationship EmergencyContactRelationship
  emergencyContactPhone        String

  // Optional: "How do you know about Study Space?" — analytics only, nothing reads it.
  // Simplification vs. the source form: no free-text elaboration when "Other" is
  // picked, just the category.
  referralSource ReferralSource?

  status       StudentStatus @default(ACTIVE) // now a purely manual admin toggle — nothing auto-sets REMOVED anymore
  registeredAt DateTime      @default(now())

  // Entire credential for both the student portal login AND the QR payload
  // (the QR literally encodes this string — a scan is just "type this in
  // faster"). Unchanged from today; see the existing schema comment on this
  // field for why it's plain text with no lockout counter.
  loginCode String @unique

  enrollments           Enrollment[]         // unused going forward, see non-goals
  attendanceRecords     AttendanceRecord[]   // unused going forward, see non-goals
  guardianNotifications GuardianNotification[]
  checkIns              CheckIn[]

  @@index([level])
}

model CheckIn {
  id        String  @id @default(cuid())
  studentId String
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Snapshot of the scanning coach's shift venue at check-in time — deliberately
  // stored here too (not just derived via coachShift.venueId) so a later edit
  // to a shift's venue can never retroactively rewrite where a visit happened,
  // same snapshot reasoning already used for GuardianNotification.recipientPhone.
  venueId String
  venue   Venue  @relation(fields: [venueId], references: [id], onDelete: Restrict)

  // "YYYY-MM-DD" — same convention as every other date-only field in this
  // schema, sidesteps timezone bugs.
  checkInDate String
  checkedInAt DateTime @default(now())

  // Which coach, and which of their shifts, performed the scan. Coach identity
  // is reached via this relation rather than a separate coachId field —
  // no scan happens without an open shift, so there's nothing to duplicate.
  coachShiftId String
  coachShift   CoachShift @relation(fields: [coachShiftId], references: [id], onDelete: Restrict)

  guardianNotification GuardianNotification?

  // Re-scanning the same person at the same venue the same day is a harmless
  // no-op, not a duplicate or an error.
  @@unique([studentId, venueId, checkInDate])
  @@index([venueId, checkInDate])
  @@index([coachShiftId])
}

model CoachShift {
  id      String @id @default(cuid())
  coachId String
  coach   Coach  @relation("CoachShifts", fields: [coachId], references: [id], onDelete: Restrict)
  venueId String
  venue   Venue  @relation(fields: [venueId], references: [id], onDelete: Restrict)
  // "YYYY-MM-DD", set once at clock-in and not independently editable —
  // editing only ever corrects clockInAt/clockOutAt within that same day.
  shiftDate String

  clockInAt  DateTime
  clockOutAt DateTime? // null while OPEN

  status CoachShiftStatus @default(OPEN)

  approvedByCoachId String?
  approvedByCoach   Coach?    @relation("ApprovedShifts", fields: [approvedByCoachId], references: [id], onDelete: SetNull)
  approvedAt        DateTime?
  // Free-text reason. Required by the action layer on reject; optional note on approve.
  reviewNote        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  checkIns CheckIn[]

  @@index([coachId])
  @@index([venueId, shiftDate])
  @@index([status])
}
```

`Coach` gains `shifts CoachShift[] @relation("CoachShifts")` and
`approvedShifts CoachShift[] @relation("ApprovedShifts")`. `Venue` **loses** its existing
`students Student[]` back-relation (nothing points a `Student` at a `Venue` anymore — see above)
and gains `checkIns CheckIn[]` and `coachShifts CoachShift[]` instead. `Venue.classes` is untouched.
`Restrict` on `CheckIn.venueId`/`CoachShift.venueId`/`.coachId` matches
this schema's existing convention for records that shouldn't be silently orphaned by a delete
(payroll and presence history).

`GuardianNotification` re-points from class attendance to check-ins:

```prisma
model GuardianNotification {
  id             String   @id @default(cuid())
  studentId      String
  student        Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  checkInId      String   @unique
  checkIn        CheckIn  @relation(fields: [checkInId], references: [id], onDelete: Cascade)
  recipientPhone String?  // snapshot of emergencyContactPhone at send time
  delivered      Boolean
  message        String
  sentAt         DateTime @default(now())
}
```

One notification per check-in (the `@@unique([studentId, classId, sessionDate])` dedup this
replaces is superseded by `CheckIn`'s own one-row-per-day-per-venue uniqueness). Only fires when
`isMapStudent`. Message copy: *"`<name>` has checked in at `<venue>` on `<date>`."* Same simulated
send mechanism as today (`src/lib/notifications.ts`, `POST /api/notify-guardian`) — no real
SMS/email provider, logged + recorded as a row, same reasoning as before (no messaging infra
exists, none is being added).

Pay is computed, never stored, same philosophy as `src/lib/attendance-stats.ts`:

```ts
// src/lib/pay.ts
export const HOURLY_RATE = 80;

export function computeShiftHours(shift: { clockInAt: Date; clockOutAt: Date | null }): number {
  if (!shift.clockOutAt) return 0;
  return (shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / 3_600_000;
}

export function computeShiftPay(shift: Parameters<typeof computeShiftHours>[0]): number {
  return computeShiftHours(shift) * HOURLY_RATE;
}
```

No rounding — hours are exact to the minute.

**Migration note:** the new `Student` fields above are non-nullable, so existing seeded students
don't satisfy the new schema as-is. `prisma/seed.ts` needs a real rewrite anyway (new fields, sample
`CoachShift`/`CheckIn` history to demo the payroll queue and check-in counts), so this is handled by
reseeding rather than a backfill migration — consistent with this README's existing
`npx prisma migrate reset --force` recovery path.

## Registration flow

One shared form (`src/components/registration/registration-form.tsx`), three entry points:

- **`/register`** — public, no auth. Reached via a generic onboarding QR/link posted at any
  centre (not venue-specific — see Goal). Fields: Student Name, Contact Number, School Name,
  Email, School Level (dropdown, the extended `Level` enum), "Are you a MAP student?" (Yes/No),
  Emergency Contact Name, Relationship (dropdown), Emergency Contact Number — all required; "How
  did you hear about Study Space?" — optional. This mirrors the linked Microsoft Form's field set
  minus location and time-of-arrival, which are intentionally never asked of the student. (I
  could only confirm required-vs-optional for that form's first three fields from a static read —
  flag any of the above that should flip.) On submit: creates the `Student`, generates a code the
  same way the app already does today (`generateUniqueLoginCode()`, unchanged), and shows a
  success screen with the QR (generated from that code) plus the plain code as text underneath.
  No check-in is created here — the student hasn't been scanned by anyone yet.
- **Coach-assisted registration** — same form, reachable only from the check-in desk (so only
  while the coach has an open shift, since a venue is needed for the visitor's first check-in).
  On submit: creates the `Student` exactly as above, **and** immediately records their first
  `CheckIn` against the coach's open shift.
- **`/students/new`** (admin-only, unchanged gate) — same form again, for pre-registering a
  student with no physical-visit context (e.g., a phone enquiry). No check-in side effect. Repoints
  the existing page at the shared form instead of the old class-enrollment-oriented one.

The QR payload is just the raw `loginCode` string (e.g. `GHW7UD`) — nothing more. A scan is
functionally identical to typing the code; if someone opens it with a generic camera app by
accident, it's inert text, not a broken link.

`/student` (existing student portal, login unchanged) gains a **"My QR Code"** view — regenerated
from the student's own `loginCode` on demand, so a lost screenshot is never actually a problem.
Its attendance section switches from class history to check-in history (date + venue). Applies to
both MAP and non-MAP students, same as the spec this supersedes.

## Coach flow

`src/app/(app)/page.tsx` (Home) becomes shift-gated:

- **No open shift** → a **Clock In** screen: pick a venue, tap in. Creates an `OPEN` `CoachShift`
  with `clockInAt = now`.
- **Open shift** → the **check-in desk**:
  - Header: "Clocked in at `<venue>` since `<time>`" + a **Clock Out** button (sets `clockOutAt`,
    flips status to `PENDING`).
  - Primary action: a full-screen **Scan QR** camera view (`src/components/checkin/scanner.tsx`).
    A recognized code shows the matched student's name to confirm (fine under this repo's existing
    no-browsable-roster rule — it's confirming one specific person who just proved they hold that
    code, not browsing a list), then creates the `CheckIn` (venue + date come from the open shift).
    Already checked in today at this venue → friendly notice, not an error. Fires the guardian
    notification if `isMapStudent`. An unrecognized code → "not registered" + straight into the
    registration form.
  - A manual code-entry field sits alongside the scanner (same input pattern the student portal
    login already uses) for when the camera can't get a clean read.
  - A running count — "14 checked in this shift" — count only, no names, preserving the existing
    rule that non-admin coaches don't get a browsable student list.
  - A visible **Register new visitor** entry point at all times.

Scanning uses `qr-scanner` (camera decode) since the native `BarcodeDetector` API doesn't exist on
iOS Safari and coaches will be on a mix of iOS/Android phones. QR generation uses `qrcode`.

## Payroll (admin flow)

New `/payroll` (admin-only):

- **Pending queue** — every `PENDING` `CoachShift`. Per row: **Approve**, **Edit** (fix a mistaken
  clock-in/out before approving), or **Reject** (requires a `reviewNote`).
- **Pay summary** — date-range picker (default: current month), a per-coach hours × $80 table,
  total, and a **Download CSV** button (columns: coach, date, venue, clock-in, clock-out, hours,
  pay). Cheap to include since hours/pay are already computed values, not new work.

A coach's own shift history lives on their **Profile** page (not a new nav icon — see below):
date, venue, hours, rate, status. Rows `OPEN`/`PENDING` are editable; an `APPROVED`/`REJECTED` row
needs a **Reopen** first (sets it back to `PENDING`), mirroring the existing attendance-session
lock/reopen pattern.

Edge cases (matching the pay-tracking draft this absorbs): a coach can't clock in while already
holding an `OPEN` shift; clocking out sets `clockOutAt` and flips to `PENDING` in one write;
`shiftDate` isn't independently editable, only `clockInAt`/`clockOutAt` within that same day; a
wrong-day shift has no in-place fix — reject and re-log it; `reopenShift` clears
`approvedAt`/`approvedByCoachId` with no retained approval history, same as
`reopenAttendanceSession` today.

## Other page changes

- `/students/[id]` — shows the new profile fields, the student's QR code, and check-in history
  instead of class enrollments/attendance. The enrollment-management widget disappears from this
  page (nothing to enroll into); the component itself stays in the codebase, unused. Per the spec
  this supersedes: any signed-in coach can open a specific student's profile once they've resolved
  who it is (via a scan or a fresh registration) — `canAccessStudent`'s non-admin branch is
  updated accordingly. `/students` (the browsable list) stays admin-only, unchanged.
- `/venues/[venueId]` — drops the "classes at this venue" list for something that means something
  now: today's check-in count and recent shifts there.
- `/coaches/[coachId]` — swaps "classes taught" for a shift/hours/pay summary.

## Visual direction (new screens only, this phase)

Direction settled via the visual-companion mockup review: **Vibrant & Energetic**, with a
**purple → pink gradient** (`#7C3AED → #EC4899`) as the primary accent. Applied as CSS custom
properties in `globals.css` (e.g. `--gradient-primary`), used for key moments on the screens this
spec introduces — the scan button, the registration success/QR screen, the clock-in confirmation —
against a clean white/light-neutral base so gradient stays an accent, not the whole surface.
Generous corner radius (16px+), large mobile tap targets (44px minimum), bold rounded-feeling
headings. Every new screen is designed mobile-first — the primary device is a coach's or student's
phone, not a desktop browser.

This system is **not** retrofitted onto existing screens (dashboard, curriculum, older profile
pages) in this pass — that's the deferred follow-up phase, so nothing gets built twice.

## Access control changes

- `middleware.ts`'s route matcher currently gates every route except `/login` behind auth. It
  needs `/register` added to that exclusion list — it's the one route in this app meant to be
  reached while signed out.
- Student self-registration (`registerStudent` action) has **no auth check at all** — see
  Non-goals above on why that's deliberate.
- Coach-assisted registration and all `CoachShift`/`CheckIn` actions start with `requireCoach()`;
  payroll approval actions start with `requireAdmin()` — same convention as every existing action
  in `src/actions/`.

## Nav

Bottom tab bar / top nav keep their current item count — Home, Curriculum, Profile, plus Students
for admins. "My Hours" and the admin-only "Payroll" link live inside the Profile page rather than
as new tab-bar icons, so the mobile nav doesn't get more crowded than it is today.

## Files

Following this project's existing layering (`src/data` reads, `src/actions` `"use server"`
mutations, `src/validations` Zod schemas):

- `prisma/schema.prisma` — deltas above; `prisma/seed.ts` — rewritten for the new model.
- `src/lib/qr.ts` — QR generation wrapper (`qrcode`). `src/lib/pay.ts` — pure pay functions.
- `src/validations/registration.ts`, `src/validations/coach-shift.ts`, `src/validations/checkin.ts`.
- `src/data/checkins.ts`, `src/data/coach-shifts.ts` — reads (open shift, history, pending queue,
  pay summary, check-in counts/history).
- `src/actions/registration.ts` (`registerStudent`, `registerAndCheckInStudent`),
  `src/actions/checkins.ts` (`scanCheckIn`), `src/actions/coach-shifts.ts` (`clockIn`, `clockOut`,
  `editShift`, `reopenShift`, `approveShift`, `rejectShift`).
- `src/app/register/page.tsx` — new public route. `src/app/(app)/page.tsx` — replaced Home.
  `src/app/(app)/payroll/page.tsx` — new, admin-only.
  `src/app/api/payroll/export/route.ts` — CSV export (route handler, not an action, since a file
  download needs a real HTTP response).
- `src/components/registration/registration-form.tsx`, `qr-display.tsx`.
- `src/components/checkin/scanner.tsx`, `clock-in-gate.tsx`, `check-in-desk.tsx`.
- `src/components/payroll/pending-shifts-table.tsx`, `pay-summary.tsx`.
- `src/app/(app)/students/[studentId]/page.tsx`, `venues/[venueId]/page.tsx`,
  `coaches/[coachId]/page.tsx`, `(student)/student/page.tsx` — updated as described above.
- `middleware.ts` — matcher update. `package.json` — add `qrcode`, `qr-scanner`.

## Testing approach

No automated test suite exists in this project (consistent with prior specs); verification stays
manual via the dev server, plus `npx tsc --noEmit`. Concretely: register via `/register` at a
mobile viewport; clock in as a coach, scan the resulting QR (camera scanning needs a real device or
a webcam — hitting the dev server from a phone over LAN is the realistic path; the manual
code-entry fallback is testable directly in a desktop browser) and confirm the check-in and
guardian notification; clock out and walk a shift through the admin approval queue, including a
reject-with-reason; download the payroll CSV; confirm `/register` is reachable while signed out and
every other route still redirects to `/login`. The pay/hours math stays in small pure functions
(`src/lib/pay.ts`) so it's easy to unit-test later if a test framework is introduced.

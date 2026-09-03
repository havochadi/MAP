# Open Study Space Check-In — Design Spec

**Status:** Replaces the scheduled-class model. This is a full pivot of the
coach-facing app, agreed on after clarifying two forking questions: (1) this
check-in model *replaces* classes/enrollments/class-based attendance rather
than sitting alongside them, and (2) the existing 80%-attendance /
6-consecutive-absence MAP policy flags are dropped, not redefined, since
they had no meaning without a fixed class schedule to measure against.

## Goal

Each MENDAKI centre (`Venue`) is an open study space. Students come in
whenever they want — no scheduled class, no roster. On arrival:

- **Registered before, MAP student:** checked in using their existing
  reusable code; their guardian is notified.
- **Registered before, not a MAP student:** checked in using their existing
  reusable code; no notification (no guardian tie-in for this group).
- **Never registered:** prompted to register on the spot, which creates
  their reusable code and immediately logs their first check-in.

## Non-goals (this phase)

- **No camera/QR/barcode scanning.** Check-in is code entry (the same short
  code the student portal already uses to log in), not a scanned code. A
  visitor states or types their code; no camera permissions, no scanning
  library. (A separate, unbuilt spec elsewhere in this repo explored a
  QR-scanning version of student check-in for the class-based model — this
  spec is independent of that one and does not build on it.)
- **No attendance percentage or streak policy.** Dropped per the second
  clarifying answer. The site becomes presence logging: who checked in,
  where, and when. Nothing here computes a disbursement or removal flag.
- **No name-list browsing for non-admin coaches.** This repo already has an
  explicit prior decision that non-admin coaches must not see a browsable
  list of student names (`/students` is admin-only). Check-in must not
  reintroduce that surface by another door. Concretely: check-in is
  code-driven, not a searchable roster, and the "who's checked in today"
  view shows a **count**, not names, for non-admin coaches (see "Today's
  check-ins" below). Flagging this explicitly since it's a real tension
  between an earlier decision and this feature's natural shape — the
  resolution above is what gets built unless told otherwise.
- **Classes are not deleted.** `Class`, `Enrollment`, `ClassAssignment`,
  `AttendanceSession`, `AttendanceRecord`, `ClassProgress` all stay in the
  schema, untouched, simply disconnected from the coach's day-to-day nav —
  same non-destructive pattern already used for the curriculum-progress
  removal earlier in this project. Reversible, no seeded history lost.
- **Curriculum reference guide is untouched.** `/curriculum` is already
  independent of `Class` (keyed by subject+level, not a specific class), so
  it needs no changes and keeps working as a coach reference either way.

## Data model

```prisma
model Student {
  // ...existing fields unchanged...

  // New. Defaults true so every existing seeded student stays a MAP
  // student with no migration/backfill needed. Set false at registration
  // for a walk-in who isn't part of the programme.
  isMapStudent Boolean @default(true)

  checkIns CheckIn[]
}

model CheckIn {
  id        String @id @default(cuid())
  studentId String
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  venueId   String
  venue     Venue @relation(fields: [venueId], references: [id], onDelete: Restrict)
  // "YYYY-MM-DD" — same convention as every other date-only field in this
  // schema (AttendanceSession.sessionDate etc.), sidesteps timezone bugs.
  checkInDate String

  checkedInAt         DateTime @default(now())
  checkedInByCoachId  String
  checkedInByCoach    Coach    @relation(fields: [checkedInByCoachId], references: [id], onDelete: Restrict)

  // One check-in per student per venue per day — re-entering the same code
  // twice in a day is a harmless no-op, not a duplicate or an error.
  @@unique([studentId, venueId, checkInDate])
  @@index([venueId, checkInDate])
}
```

`Venue` and `Coach` each need the matching back-relation (`checkIns
CheckIn[]`), same pattern as every other relation in this schema.

`GuardianNotification` (added earlier this session for the class-attendance
version of guardian contact) is repointed at check-ins instead of class
attendance, since the thing that triggers it has changed:

```prisma
model GuardianNotification {
  id            String   @id @default(cuid())
  studentId     String
  student       Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  checkInId     String   @unique
  checkIn       CheckIn  @relation(fields: [checkInId], references: [id], onDelete: Cascade)
  recipientPhone String?
  delivered     Boolean
  message       String
  sentAt        DateTime @default(now())
}
```

Dropping `classId`/`status` (no class, no Present/Late/Absent anymore —
just "checked in") and keying off `checkInId` instead, one notification per
check-in. The `@@unique([studentId, classId, sessionDate])` dedup this
replaces is superseded by `CheckIn`'s own one-row-per-day uniqueness — a
second check-in the same day never happens, so there's nothing to
dedup at the notification layer anymore.

## Registration flow (first-time visitor)

Repurposes the existing `/students/new` page rather than adding a parallel
one: same underlying `createStudent` action and `generateUniqueLoginCode()`
helper, three changes to it —

1. **No longer admin-gated.** Today it's `requireAdmin()`; registration now
   has to happen in the moment at the desk by whichever coach is on duty,
   so this becomes `requireCoach()` instead. Real permission change from
   today's admin-only student registration — flagging it since it's a
   deliberate loosening, not an oversight.
2. **Adds the MAP / not-MAP toggle** and reorders the guardian fields to be
   prominent when MAP is selected, de-emphasized otherwise.
3. **Drops the `initialClassId` enrollment dropdown** (no classes to enroll
   into in the new flow) and instead creates the visitor's first `CheckIn`
   for today immediately after creating the `Student` row.

Reachable two ways: a persistent "Register new visitor" entry point on the
check-in desk itself (not only as a fallback after a failed code lookup),
and the not-found path below.

Fields: name, level, home centre (`venueId`), a MAP / not-MAP toggle,
guardian name + phone (prominent when MAP is selected, optional and
de-emphasized otherwise — no notification ever reads them for a non-MAP
student regardless of whether they're filled in).

On submit: generates a code the same way `generateUniqueLoginCode()`
already does for admin-created students (reused as-is, no changes needed
there), creates the `Student` row, shows the new code on screen for the
visitor to note down, and immediately records their first `CheckIn` for
today at the selected venue — including the guardian-notification step if
they're a MAP student.

## Check-in flow (returning visitor)

The coach's "Home" page (`src/app/(app)/page.tsx`) stops being "My
classes" / "take today's attendance" and becomes the check-in desk:

- **Venue selector.** Unlike a student's registered home venue, nothing
  today records "which centre is this coach working at right now" — that
  concept only exists via `Class`/`ClassAssignment`, which are going away.
  Simplest fix: a venue dropdown at the top of the check-in desk (same
  venue list used elsewhere, e.g. the registration form), defaulting to
  whichever venue the coach last picked this session. Every check-in made
  while a venue is selected is recorded against that venue.
- A single code-entry field (visually the same pattern as the student
  portal's existing login code input — short, uppercase, centered).
- Submitting an unrecognized code: clear "not registered" message with a
  link straight into registration (above).
- Submitting a recognized code: shows the matched student's name to
  confirm it's the right person (this is fine under the no-name-list rule
  above — it's confirming one specific person who just proved they hold
  that code, not browsing a roster), then confirms the check-in.
  - **Already checked in today at this venue:** friendly "already checked
    in at HH:MM," not an error — doesn't block the desk.
  - **New check-in today:** creates the `CheckIn` row. If `isMapStudent`,
    fires the guardian notification (simulated send, same mechanism as
    today — see below). If not, records the check-in with no message sent.
- **Today's check-ins:** a running count for the signed-in coach's venue
  context ("14 checked in today at Tampines Centre"), not a name list, per
  the non-goal above.

## Guardian notification

Reuses the simulated-notification mechanism built earlier this session
(`src/lib/notifications.ts`, `POST /api/notify-guardian`) — same "no real
SMS/email provider, logged + recorded as a `GuardianNotification` row"
approach, same reasoning (this project has no messaging infra, and none is
being added now). What changes is the trigger and the message shape:

- Old trigger: a coach submits a class's daily attendance; fires once per
  Present/Late student in that session.
- New trigger: a check-in is recorded for a MAP student; fires once for
  that check-in.
- Message copy drops the class/status framing (no more "marked Present for
  P3 Science") in favor of arrival-at-a-centre framing, e.g.: *"Amir Hafiz
  bin Zainal has checked in at Tampines Centre on 3 Sept 2026."*

The route/action shape stays the same (validate → look up student → log a
simulated send if a guardian phone is on file, log a skipped one if not);
only the input fields change (`checkInId` instead of `classId` +
`sessionDate` + `status`).

## Pages that need to change because classes disappear from the nav

- `src/app/(app)/page.tsx` (Home): replaced by the check-in desk, above.
- `top-nav.tsx` / `bottom-tab-bar.tsx`: no more implicit "classes" concept
  to link to from Home; Curriculum and Profile links are unaffected.
- `src/app/(app)/venues/[venueId]/page.tsx`: currently lists the classes at
  that venue — this no longer means anything and gets simplified to venue
  info (and, if useful, a same-day check-in count for that venue).
- `src/app/(app)/coaches/[coachId]/page.tsx`: currently shows "classes
  taught, student count, sessions taken" — reworked to something check-in
  relevant (e.g. check-ins this coach has recorded) or simplified.
- Everything under `src/app/(app)/classes/**` stays in the codebase,
  unlinked from nav, per the non-destructive approach above.

## Access control fallout

`canAccessStudent` (`src/lib/authorization.ts`) currently grants a
non-admin coach access to a student's profile only through a shared active
class enrollment. With classes gone, that path never fires for anyone
registered under the new flow — every profile would silently become
admin-only, which isn't a deliberate decision here, just a side effect of
removing the thing that check governed on. Since a coach only ever reaches
a specific student's profile by having already resolved them (via a
code-entry check-in or a fresh registration), not by browsing, this is
consistent with the no-name-list rule the same way the check-in
confirmation step is: **any signed-in coach can view a specific student's
profile once they know who they're looking at.** `canAccessStudent`'s
non-admin branch is replaced accordingly — a coach can open `/students/[id]`
for any student, but `/students` (the browsable list) stays admin-only,
unchanged from the earlier decision.

## Student portal

`/student` (and the coach-facing `/students/[id]` profile, which shares the
same `StudentProfileContent` component) switches from class-based
attendance history to check-in history: a simple list of past check-ins
(date + venue). Applies to both MAP and non-MAP students — anyone with a
code can see their own presence log.

## Testing approach

Following this project's existing convention (no automated test suite
beyond pure functions with real branching logic, everything else verified
manually via the dev server): the message-building and
delivered/skipped-by-guardian-phone logic already has this shape from the
class-attendance version and stays manually verified the same way. No new
pure-function surface area is introduced by this change beyond what
already exists.

# QR Check-In & Coach Shift Payroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed-class attendance model with dynamic drop-in check-ins: students self-register via a public form and get a reusable QR code; coaches clock in at a venue (which doubles as their payroll shift) and scan student QR codes to check them in; admins review clocked shifts and approve pay.

**Architecture:** Prisma schema grows three ways — `Student` gains registration-form fields and loses its fixed venue; a new `CheckIn` model replaces class-based attendance; a new `CoachShift` model tracks clock-in/out for payroll. Everything new is built with a vibrant purple→pink visual system; old class-based screens are untouched and stay reachable but unlinked from nav.

**Tech Stack:** Next.js 15 (App Router, Server Actions), Prisma 6 + SQLite, Zod 4, Tailwind v4 + shadcn/Base UI, `qrcode` (generation), `qr-scanner` (camera decode).

**Spec:** `docs/superpowers/specs/2026-09-05-qr-checkin-and-shift-payroll-design.md` — read it alongside this plan; this plan argues from it and doesn't repeat its rationale.

## Global Constraints

- No new test framework. Pure functions (`src/lib/pay.ts`) are verified with a throwaway `node:assert` script run via `npx tsx` and then discarded (this project already has zero automated tests by deliberate prior decision). Everything else is verified manually via the dev server plus `npx tsc --noEmit` after each task.
- Hourly pay rate is a hardcoded constant, `$80`/hr, in `src/lib/pay.ts`. Never admin-configurable in this plan.
- A student's QR encodes their bare `loginCode` string — no URL wrapper, no other payload shape.
- `registerStudent` (the public registration action) has **no auth check** — this is intentional, not a gap to fix.
- Never delete `Class`, `Enrollment`, `ClassAssignment`, `AttendanceSession`, `AttendanceRecord`, `ClassProgress`, `src/lib/attendance-stats.ts`, `src/components/students/attendance-flags.tsx`, or `src/components/students/manage-enrollment.tsx`. Leave them exactly as they are, simply unlinked from nothing new references them.
- The purple→pink gradient visual system (`--gradient-primary-start` / `--gradient-primary-end` tokens, added in Task 2) is applied only to screens this plan introduces. Do not restyle existing screens (Home's old look is being replaced anyway; curriculum, login, etc. stay as they are).
- Match existing conventions exactly: `"use server"` action files export `ActionResult<T> = { success: true; data: T } | { success: false; error: string }`; actions start with `requireCoach()`/`requireAdmin()` (except where a task says otherwise); Zod validates all action input; mutations call `revalidatePath(...)`; Prisma-generated types import from `@/generated/prisma/client`, never `@prisma/client`.

---

## Task 1: Prisma schema migration + LEVELS constant + shared login-code helper

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/validations/student.ts` (LEVELS array)
- Create: `src/lib/login-code.ts`
- Modify: `src/actions/students.ts` (use the shared helper, drop `createStudent`/`createStudentSchema`)

**Interfaces:**
- Produces: `generateUniqueLoginCode(): Promise<string>` and `CODE_ALPHABET: string` from `src/lib/login-code.ts` — every later task that creates a `Student` uses this.
- Produces: Prisma models `CheckIn`, `CoachShift`, `CheckInNotification`; `Student` fields `contactNumber`, `schoolName`, `email`, `isMapStudent`, `emergencyContactName`, `emergencyContactRelationship`, `emergencyContactPhone`, `referralSource`; enums `EmergencyContactRelationship`, `ReferralSource`, `CoachShiftStatus`; `Level` gains `JC1`, `JC2`. **`GuardianNotification` is left completely untouched** — it stays wired to the old class-attendance flow (`src/actions/attendance.ts` still upserts on it), which keeps working unlinked from nav rather than breaking. The check-in flow gets its own new `CheckInNotification` model instead of reusing/repointing that one.

- [ ] **Step 1: Edit the Level enum to add JC1/JC2**

In `prisma/schema.prisma`, find:

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
}
```

Replace with:

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
  JC1
  JC2
}
```

- [ ] **Step 2: Add the three new enums**

Directly below the `EnrollmentStatus` enum (before `model Venue`), insert:

```prisma
enum EmergencyContactRelationship {
  MOTHER
  FATHER
  GUARDIAN
  OTHER // the source registration form only lists the first three; added as a catch-all so no real visitor is unrepresentable
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
```

- [ ] **Step 3: Update the Venue model**

Find:

```prisma
model Venue {
  id        String   @id @default(cuid())
  name      String
  address   String?
  createdAt DateTime @default(now())

  classes  Class[]
  students Student[]

  @@index([name])
}
```

Replace with:

```prisma
model Venue {
  id        String   @id @default(cuid())
  name      String
  address   String?
  createdAt DateTime @default(now())

  classes      Class[]
  checkIns     CheckIn[]
  coachShifts  CoachShift[]

  @@index([name])
}
```

(`students Student[]` is removed — nothing points a `Student` at a fixed `Venue` anymore, see Step 4.)

- [ ] **Step 4: Replace the Student model**

Find the entire existing `model Student { ... }` block and replace it with:

```prisma
model Student {
  id       String @id @default(cuid())
  name     String
  level    Level

  contactNumber String
  schoolName    String
  email         String
  isMapStudent  Boolean @default(true)

  // Renamed from guardianName/guardianPhone to match what the registration
  // form actually calls this field (Student Emergency Contact Name /
  // relationship / number) — same person, more accurate names.
  emergencyContactName         String
  emergencyContactRelationship EmergencyContactRelationship
  emergencyContactPhone        String

  // "How do you know about Study Space?" — analytics only, nothing reads it.
  // Simplification vs. the source form: no free-text elaboration when
  // "Other" is picked, just the category.
  referralSource ReferralSource?

  status       StudentStatus @default(ACTIVE) // now a purely manual admin toggle — nothing auto-sets REMOVED anymore
  registeredAt DateTime      @default(now())

  // Entire credential for both the student portal login AND the QR payload
  // (the QR literally encodes this string). Deliberately plain text, not
  // hashed: it functions as a shared "class code" rather than a password
  // (MAP students span P1-JC2, so as young as ~7), it protects only the
  // student's own already-low-sensitivity view of data their coach already
  // manages, and it needs to be looked up directly by value.
  loginCode String @unique

  enrollments           Enrollment[]           // unused going forward — see Global Constraints
  attendanceRecords     AttendanceRecord[]      // unused going forward — see Global Constraints
  guardianNotifications GuardianNotification[]  // old class-attendance flow, untouched — see Step 5
  checkInNotifications  CheckInNotification[]
  checkIns              CheckIn[]

  @@index([level])
}
```

`GuardianNotification` itself is **not modified** — every line of that model stays exactly as it is today. It's still wired to `src/actions/attendance.ts`'s class-attendance submit flow (classId/sessionDate/status, all unchanged fields), which keeps working, simply unlinked from nav like the rest of the class-based subsystem. The check-in flow gets its own model instead, below.

- [ ] **Step 5: Add the CheckIn, CoachShift, and CheckInNotification models**

Directly below the existing `model GuardianNotification { ... }` block (leave it untouched), insert:

```prisma
model CheckIn {
  id        String  @id @default(cuid())
  studentId String
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Snapshot of the scanning coach's shift venue at check-in time — stored
  // here (not just derived via coachShift.venueId) so a later edit to a
  // shift's venue can never retroactively rewrite where a visit happened.
  venueId String
  venue   Venue  @relation(fields: [venueId], references: [id], onDelete: Restrict)

  // "YYYY-MM-DD" — same convention as every other date-only field in this
  // schema, sidesteps timezone bugs.
  checkInDate String
  checkedInAt DateTime @default(now())

  // Which coach and which of their shifts performed the scan — reached via
  // this relation rather than a separate coachId field, since no scan
  // happens without an open shift.
  coachShiftId String
  coachShift   CoachShift @relation(fields: [coachShiftId], references: [id], onDelete: Restrict)

  notification CheckInNotification?

  // Re-scanning the same person at the same venue the same day is a
  // harmless no-op, not a duplicate or an error.
  @@unique([studentId, venueId, checkInDate])
  @@index([venueId, checkInDate])
  @@index([coachShiftId])
}

model CheckInNotification {
  // The check-in flow's equivalent of GuardianNotification, above — a
  // separate model rather than a repoint of that one, since
  // GuardianNotification's classId/sessionDate/status fields are still
  // load-bearing for the untouched class-attendance flow. Same simulated
  // "delivery record" reasoning as that model: no real SMS/email provider
  // exists, this row IS the delivery.
  id             String   @id @default(cuid())
  studentId      String
  student        Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  checkInId      String   @unique
  checkIn        CheckIn  @relation(fields: [checkInId], references: [id], onDelete: Cascade)
  // Snapshot of Student.emergencyContactPhone at send time.
  recipientPhone String?
  delivered      Boolean
  message        String
  sentAt         DateTime @default(now())
}

model CoachShift {
  id      String @id @default(cuid())
  coachId String
  coach   Coach  @relation("CoachShifts", fields: [coachId], references: [id], onDelete: Restrict)
  venueId String
  venue   Venue  @relation(fields: [venueId], references: [id], onDelete: Restrict)
  // "YYYY-MM-DD", set once at clock-in and never independently edited —
  // editing only ever corrects clockInAt/clockOutAt within that same day.
  shiftDate String

  clockInAt  DateTime
  clockOutAt DateTime? // null while OPEN

  status CoachShiftStatus @default(OPEN)

  approvedByCoachId String?
  approvedByCoach   Coach?    @relation("ApprovedShifts", fields: [approvedByCoachId], references: [id], onDelete: SetNull)
  approvedAt        DateTime?
  // Required by the action layer on reject; optional note on approve.
  reviewNote        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  checkIns CheckIn[]

  @@index([coachId])
  @@index([venueId, shiftDate])
  @@index([status])
}
```

- [ ] **Step 6: Update the Coach model's relations**

Find the `model Coach { ... }` block. In its relations section (after `markedSessions AttendanceSession[]`), add:

```prisma
  shifts         CoachShift[] @relation("CoachShifts")
  approvedShifts CoachShift[] @relation("ApprovedShifts")
```

- [ ] **Step 7: Reset the dev database and run the migration**

Since every existing seeded row will be replaced by the rewritten seed script in Task 3 anyway, there's no data worth preserving through this migration — delete the dev database first so Prisma has no existing rows to reconcile against the new non-null columns and the renamed fields:

```bash
rm -f prisma/dev.db prisma/dev.db-journal
npx prisma migrate dev --name qr_checkin_and_shift_payroll
```

Expected: migration applies cleanly against an empty database, prints "Your database is now in sync with your schema," and (since `prisma.config.ts` wires a seed command) runs `prisma/seed.ts` automatically — which will fail at this point because Task 3 hasn't rewritten it yet for the new schema shape. That failure is expected here; ignore it, Task 3 fixes it. If the migration step itself (schema sync) fails, stop and re-check Steps 1-7 against the diffs above before continuing.

- [ ] **Step 8: Update the LEVELS constant**

In `src/validations/student.ts`, change:

```ts
export const LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6", "SEC1", "SEC2", "SEC3", "SEC4", "SEC5"] as const;
```

to:

```ts
export const LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6", "SEC1", "SEC2", "SEC3", "SEC4", "SEC5", "JC1", "JC2"] as const;
```

- [ ] **Step 9: Add JC1/JC2 display labels, plus labels for the two new registration enums**

In `src/lib/format.ts`, this file is already the one canonical place this codebase keeps enum→label maps (`SUBJECT_LABELS`, `LEVEL_LABELS`, `DAY_LABELS`) — Task 6 (registration form) and Task 16 (student profile) both need label maps for the two new enums from Task 1, so add them here now rather than each task inventing its own copy.

Change the top import line:

```ts
import type { Subject, Level, DayOfWeek } from "@/generated/prisma/client";
```

to:

```ts
import type { Subject, Level, DayOfWeek, EmergencyContactRelationship, ReferralSource } from "@/generated/prisma/client";
```

Find the `LEVEL_LABELS` map and add two entries so the new levels render as `"JC 1"` / `"JC 2"` everywhere `formatLevel` is used:

```ts
const LEVEL_LABELS: Record<Level, string> = {
  P1: "P1",
  P2: "P2",
  P3: "P3",
  P4: "P4",
  P5: "P5",
  P6: "P6",
  SEC1: "Sec 1",
  SEC2: "Sec 2",
  SEC3: "Sec 3",
  SEC4: "Sec 4",
  SEC5: "Sec 5",
  JC1: "JC 1",
  JC2: "JC 2",
};
```

Then add these two new exported maps anywhere after it:

```ts
export const EMERGENCY_CONTACT_LABELS: Record<EmergencyContactRelationship, string> = {
  MOTHER: "Mother",
  FATHER: "Father",
  GUARDIAN: "Guardian",
  OTHER: "Other",
};

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  MAP_CLASS: "A MAP class",
  SOCIAL_MEDIA: "Social media",
  FRIENDS_FAMILY: "Friends & family",
  OTHER: "Other",
};
```

- [ ] **Step 10: Create the shared login-code helper**

Create `src/lib/login-code.ts`:

```ts
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

// Excludes visually-ambiguous characters (0/O, 1/I) since a student reads
// this off a card or hears it spoken by their coach. Same alphabet as
// prisma/seed.ts's own generator, but genuinely random here rather than
// deterministic, since this runs at arbitrary times against real data.
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function generateUniqueLoginCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    const existing = await prisma.student.findUnique({ where: { loginCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique student login code after 10 attempts.");
}
```

- [ ] **Step 11: Remove the old admin student-creation action and its schema**

In `src/actions/students.ts`, delete the `CODE_ALPHABET` constant, the local `generateUniqueLoginCode` function, and the entire `createStudent` export — they referenced `venueId`/`guardianName`/`guardianPhone`/`initialClassId`, all gone or renamed. Replace the top of the file's imports:

```ts
"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  createStudentSchema,
  enrollStudentSchema,
  dropEnrollmentSchema,
  updateStudentStatusSchema,
} from "@/validations/student";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

const MAX_ACTIVE_ENROLLMENTS = 3;

// Same alphabet as the seed script's generator (no ambiguous 0/O, 1/I), but
// genuinely random here rather than deterministic — this runs at arbitrary
// times against real data, not for reproducible demo seeding.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function generateUniqueLoginCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    const existing = await prisma.student.findUnique({ where: { loginCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique student login code after 10 attempts.");
}

export async function createStudent(input: unknown): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  await requireAdmin();
  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { name, level, venueId, guardianName, guardianPhone, initialClassId } = parsed.data;

  const loginCode = await generateUniqueLoginCode();
  const student = await prisma.student.create({
    data: { name, level, venueId, guardianName, guardianPhone, loginCode },
  });

  if (initialClassId) {
    await prisma.enrollment.create({ data: { studentId: student.id, classId: initialClassId } });
  }

  revalidatePath("/students");
  return { success: true, data: { studentId: student.id, loginCode } };
}
```

with:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateUniqueLoginCode } from "@/lib/login-code";
import {
  enrollStudentSchema,
  dropEnrollmentSchema,
  updateStudentStatusSchema,
} from "@/validations/student";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

const MAX_ACTIVE_ENROLLMENTS = 3;
```

Leave `regenerateLoginCode`, `enrollStudentInClass`, `dropEnrollment`, and `updateStudentStatus` exactly as they are below that point — they still reference only fields that are unchanged. `regenerateLoginCode` already calls a function named `generateUniqueLoginCode`; it now resolves to the imported one instead of a local duplicate, with no other change needed.

- [ ] **Step 12: Remove the now-dead createStudentSchema**

In `src/validations/student.ts`, delete the `createStudentSchema` export (it referenced `venueId`/`guardianName`/`guardianPhone`/`initialClassId`, all gone or renamed, and its only caller was just deleted in Step 12).

- [ ] **Step 13: Verify**

```bash
npx tsc --noEmit
```

Expected: errors only in files this plan hasn't reached yet (`prisma/seed.ts`, `src/lib/notifications.ts`, `src/data/students.ts`, `src/components/students/student-profile-content.tsx`, `src/app/(app)/students/new/page.tsx`, `src/app/(app)/students/page.tsx`, `src/app/(app)/venues/page.tsx`, `src/components/students/create-student-form.tsx`) — later tasks fix each of those. No errors should reference `src/actions/students.ts`, `src/validations/student.ts`, `src/lib/format.ts`, or the schema itself.

- [ ] **Step 14: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/validations/student.ts src/lib/format.ts src/lib/login-code.ts src/actions/students.ts
git commit -m "$(cat <<'EOF'
feat: migrate schema to dynamic check-ins and coach shifts

Replaces Student's fixed venue with registration-form fields, adds
CheckIn/CoachShift models for QR check-in and shift payroll, extends
Level with JC1/JC2, and extracts the login-code generator so both the
admin flow and the new public registration flow can share it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 2: Visual design tokens

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: CSS custom properties `--gradient-primary-start` (`#7C3AED`) and `--gradient-primary-end` (`#EC4899`) — every new component from Task 6 onward that needs the vibrant accent references these two, e.g. `bg-gradient-to-br from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)]`.

- [ ] **Step 1: Add the gradient tokens**

In `src/app/globals.css`, in the `:root` block, add two lines after `--ring: #1e3a5f;`:

```css
  --ring: #1e3a5f;
  --gradient-primary-start: #7C3AED;
  --gradient-primary-end: #EC4899;
```

Add the same two lines (same values — this accent stays vivid in both themes) to the `.dark` block, after its own `--ring: #4a73a0;` line.

- [ ] **Step 2: Verify**

```bash
npm run dev
```

In a browser, confirm the app still loads with no visual regression on existing screens (these are new, currently-unreferenced tokens — nothing consumes them yet). Stop the dev server after checking.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
feat: add vibrant gradient design tokens

Purple-to-pink CSS variables for the new check-in/registration/payroll
screens this feature introduces, per the visual direction settled in
the design spec. Not yet referenced by any component.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 3: Seed script rewrite

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: nothing from later tasks — this only depends on Task 1's schema.
- Produces: seeded demo data every later task's manual verification relies on — specifically a coach (`farhan@map.test`) with an **OPEN** shift today at Tampines Centre (so logging in lands straight on the check-in desk), a coach (`aishah@map.test`) with a **PENDING** shift (for the payroll queue demo), one **APPROVED** and one **REJECTED** shift, and 16 students with the new registration fields (14 MAP, 2 non-MAP, levels spanning P2–JC1).

The elaborate attendance-pattern engineering in the old seed (below-80%, 4/6-consecutive-absence patterns) is dropped entirely — those existed only to demo the MAP policy flags, which no longer exist. `Enrollment`, `AttendanceSession`, `AttendanceRecord`, and `ClassProgress` are no longer seeded at all — nothing in the new flows reads them, and the two legacy classes kept below exist only so the still-functional (but unlinked) `/classes/*` routes have something valid to point at if visited directly.

- [ ] **Step 1: Replace the whole file**

Replace the entire contents of `prisma/seed.ts` with:

```ts
// Seed data for local demo/dev. Seeds a coach (farhan) with an OPEN shift at
// Tampines Centre so a fresh login lands directly on the check-in desk, plus
// shifts in every payroll state (PENDING/APPROVED/REJECTED) so the admin
// payroll queue has something real to review immediately.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { getSingaporeTodayString, addDaysToDateString } from "../src/lib/dates";
import { mathCurriculum } from "./curriculum-data/math";
import { englishCurriculum } from "./curriculum-data/english";
import { scienceCurriculum } from "./curriculum-data/science";
import type { LevelCurriculum } from "./curriculum-data/types";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Coach123!";
const today = getSingaporeTodayString();

type LevelStr =
  | "P1" | "P2" | "P3" | "P4" | "P5" | "P6"
  | "SEC1" | "SEC2" | "SEC3" | "SEC4" | "SEC5"
  | "JC1" | "JC2";
type SubjectStr = "ENGLISH" | "MATH" | "SCIENCE";
type DayStr = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
type RelationshipStr = "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER";
type ReferralStr = "MAP_CLASS" | "SOCIAL_MEDIA" | "FRIENDS_FAMILY" | "OTHER";
type ShiftStatus = "OPEN" | "PENDING" | "APPROVED" | "REJECTED";

// Excludes visually-ambiguous characters (0/O, 1/I) since a child reads this
// off a card or hears it spoken by their coach.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateLoginCode(seed: number): string {
  // Math.imul keeps every step within real 32-bit integer arithmetic —
  // plain `*` silently loses precision past 2^53, which degenerated this
  // into producing duplicate codes for different seeds.
  let code = "";
  let n = (seed + 1) >>> 0;
  for (let i = 0; i < 6; i++) {
    n = (Math.imul(n, 1103515245) + 12345) >>> 0;
    code += CODE_ALPHABET[n % CODE_ALPHABET.length];
  }
  return code;
}

function deriveEmergencyContact(studentName: string, index: number) {
  const match = studentName.match(/\bbin(?:te)?\s+(\S+)/i);
  const fatherFirstName = match ? match[1] : "Rahman";
  const emergencyContactName = `Encik ${fatherFirstName}`;
  const areaCode = 200 + (index % 30);
  const suffix = ((1000 + index * 111) % 9000) + 1000;
  const emergencyContactPhone = `9${areaCode} ${suffix}`;
  return { emergencyContactName, emergencyContactPhone };
}

// Singapore is a fixed UTC+8 with no DST — building the offset directly
// avoids any dependence on the machine's local timezone.
function toSingaporeDateTime(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${time}:00+08:00`);
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.checkInNotification.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.coachShift.deleteMany();
  await prisma.guardianNotification.deleteMany();
  await prisma.classProgress.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.curriculumTopic.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.venue.deleteMany();

  console.log("Creating venues...");
  const tampines = await prisma.venue.create({
    data: { name: "Tampines Centre", address: "Blk 201 Tampines Street 21, #01-123, Singapore 521201" },
  });
  const woodlands = await prisma.venue.create({
    data: { name: "Woodlands Centre", address: "Blk 885 Woodlands Street 82, #01-456, Singapore 730885" },
  });
  const bedok = await prisma.venue.create({
    data: { name: "Bedok Centre", address: "Blk 511 Bedok North Street 3, #01-789, Singapore 460511" },
  });

  console.log("Creating coaches...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const coachDefs = [
    { key: "hidayah", name: "Nur Hidayah Rahman", email: "admin@map.test", isAdmin: true },
    { key: "farhan", name: "Muhammad Farhan Yusof", email: "farhan@map.test", isAdmin: false },
    { key: "aishah", name: "Siti Aishah Kamal", email: "aishah@map.test", isAdmin: false },
    { key: "danial", name: "Ahmad Danial Rosli", email: "danial@map.test", isAdmin: false },
    { key: "ain", name: "Nurul Ain Zulkifli", email: "ain@map.test", isAdmin: false },
    { key: "haziq", name: "Muhammad Haziq Ismail", email: "haziq@map.test", isAdmin: false },
    { key: "nabila", name: "Farah Nabila Hassan", email: "nabila@map.test", isAdmin: false },
  ] as const;

  const coaches: Record<string, Awaited<ReturnType<typeof prisma.coach.create>>> = {};
  for (const [i, def] of coachDefs.entries()) {
    coaches[def.key] = await prisma.coach.create({
      data: {
        name: def.name,
        email: def.email,
        passwordHash,
        isAdmin: def.isAdmin,
        phone: `9${100 + i}${(200 + i * 3).toString().padStart(4, "0")}`.replace(/(\d{4})(\d{4})$/, "$1 $2"),
        trainingCompletedAt: new Date(Date.now() - (365 - i * 10) * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Creating a couple of legacy classes (unlinked from nav, kept non-destructively)...");
  // Minimal — just enough that the still-existing /classes/* routes have
  // something valid to show if visited directly. Nothing in the new
  // coach-facing flow links here.
  const classDefs: { key: string; venueId: string; subject: SubjectStr; level: LevelStr; dayOfWeek: DayStr; startTime: string }[] = [
    { key: "c0", venueId: tampines.id, subject: "SCIENCE", level: "P3", dayOfWeek: "MON", startTime: "16:00" },
    { key: "c1", venueId: woodlands.id, subject: "MATH", level: "SEC1", dayOfWeek: "TUE", startTime: "17:30" },
  ];
  const classes: Record<string, Awaited<ReturnType<typeof prisma.class.create>>> = {};
  for (const def of classDefs) {
    classes[def.key] = await prisma.class.create({
      data: { venueId: def.venueId, subject: def.subject, level: def.level, dayOfWeek: def.dayOfWeek, startTime: def.startTime },
    });
  }
  await prisma.classAssignment.createMany({
    data: [
      { coachId: coaches.farhan.id, classId: classes.c0.id },
      { coachId: coaches.haziq.id, classId: classes.c1.id },
    ],
  });

  console.log("Creating students...");
  type StudentDef = {
    key: string;
    name: string;
    level: LevelStr;
    schoolName: string;
    isMapStudent: boolean;
    relationship: RelationshipStr;
    referralSource: ReferralStr;
  };
  const studentDefs: StudentDef[] = [
    { key: "s1", name: "Amir Hafiz bin Zainal", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "MAP_CLASS" },
    { key: "s2", name: "Nur Aleesya binte Rosman", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "FATHER", referralSource: "FRIENDS_FAMILY" },
    { key: "s3", name: "Muhammad Irfan bin Karim", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "GUARDIAN", referralSource: "SOCIAL_MEDIA" },
    { key: "s4", name: "Siti Zara binte Anuar", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "MAP_CLASS" },
    { key: "s5", name: "Ahmad Zayyan bin Rizal", level: "P2", schoolName: "Bedok North Primary School", isMapStudent: true, relationship: "FATHER", referralSource: "OTHER" },
    { key: "s6", name: "Nur Batrisyia binte Faizal", level: "P5", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "FRIENDS_FAMILY" },
    { key: "s7", name: "Muhammad Aiman bin Rahim", level: "P5", schoolName: "Woodlands Ring Primary School", isMapStudent: true, relationship: "GUARDIAN", referralSource: "MAP_CLASS" },
    { key: "s8", name: "Nur Damia binte Hakim", level: "P6", schoolName: "Tampines North Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "SOCIAL_MEDIA" },
    { key: "s9", name: "Muhd Amsyar bin Fadzil", level: "SEC1", schoolName: "Yishun Secondary School", isMapStudent: true, relationship: "FATHER", referralSource: "MAP_CLASS" },
    { key: "s10", name: "Nur Alysha binte Rusli", level: "SEC2", schoolName: "Woodlands Secondary School", isMapStudent: true, relationship: "MOTHER", referralSource: "FRIENDS_FAMILY" },
    { key: "s11", name: "Muhammad Haiqal bin Suhaili", level: "SEC3", schoolName: "Bedok View Secondary School", isMapStudent: true, relationship: "GUARDIAN", referralSource: "MAP_CLASS" },
    { key: "s12", name: "Nur Adriana binte Shukor", level: "SEC3", schoolName: "Damai Secondary School", isMapStudent: true, relationship: "MOTHER", referralSource: "OTHER" },
    { key: "s13", name: "Ahmad Danish bin Yaakob", level: "SEC4", schoolName: "Woodlands Ring Secondary School", isMapStudent: true, relationship: "FATHER", referralSource: "SOCIAL_MEDIA" },
    { key: "s14", name: "Nurul Iman binte Salleh", level: "JC1", schoolName: "Tampines Junior College", isMapStudent: true, relationship: "MOTHER", referralSource: "MAP_CLASS" },
    { key: "s15", name: "Farid Danish bin Osman", level: "P4", schoolName: "Woodlands Primary School", isMapStudent: false, relationship: "GUARDIAN", referralSource: "FRIENDS_FAMILY" },
    { key: "s16", name: "Siti Khadijah binte Rahim", level: "SEC1", schoolName: "Bedok Green Secondary School", isMapStudent: false, relationship: "FATHER", referralSource: "OTHER" },
  ];

  const students: Record<string, Awaited<ReturnType<typeof prisma.student.create>>> = {};
  for (const [i, def] of studentDefs.entries()) {
    const { emergencyContactName, emergencyContactPhone } = deriveEmergencyContact(def.name, i);
    students[def.key] = await prisma.student.create({
      data: {
        name: def.name,
        level: def.level,
        schoolName: def.schoolName,
        contactNumber: `8${100 + i}${(200 + i * 3).toString().padStart(4, "0")}`.replace(/(\d{4})(\d{4})$/, "$1 $2"),
        email: `${def.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        isMapStudent: def.isMapStudent,
        emergencyContactName,
        emergencyContactRelationship: def.relationship,
        emergencyContactPhone,
        referralSource: def.referralSource,
        loginCode: generateLoginCode(i),
      },
    });
  }

  console.log("Creating coach shifts (every payroll status, so the admin queue has something to review)...");
  type ShiftDef = {
    coachKey: string;
    venue: typeof tampines;
    shiftDate: string;
    clockInTime: string;
    clockOutTime: string | null;
    status: ShiftStatus;
    reviewNote?: string;
  };
  const shiftDefs: ShiftDef[] = [
    // farhan: OPEN today at Tampines — logging in as farhan lands directly
    // on the check-in desk, camera-ready.
    { coachKey: "farhan", venue: tampines, shiftDate: today, clockInTime: "16:00", clockOutTime: null, status: "OPEN" },
    // farhan: two past approved shifts, so his profile shows real hours.
    { coachKey: "farhan", venue: tampines, shiftDate: addDaysToDateString(today, -7), clockInTime: "16:00", clockOutTime: "19:30", status: "APPROVED" },
    { coachKey: "farhan", venue: bedok, shiftDate: addDaysToDateString(today, -3), clockInTime: "17:00", clockOutTime: "20:00", status: "APPROVED" },
    // aishah: clocked out yesterday, awaiting review.
    { coachKey: "aishah", venue: woodlands, shiftDate: addDaysToDateString(today, -1), clockInTime: "16:00", clockOutTime: "18:45", status: "PENDING" },
    // danial: already reviewed and approved.
    { coachKey: "danial", venue: bedok, shiftDate: addDaysToDateString(today, -2), clockInTime: "17:00", clockOutTime: "20:15", status: "APPROVED" },
    // ain: rejected, with a reason — demos the reject-with-reviewNote path.
    {
      coachKey: "ain",
      venue: tampines,
      shiftDate: addDaysToDateString(today, -4),
      clockInTime: "16:00",
      clockOutTime: "16:20",
      status: "REJECTED",
      reviewNote: "Clocked out after 20 minutes — check with Ain before re-approving.",
    },
    { coachKey: "haziq", venue: woodlands, shiftDate: addDaysToDateString(today, -6), clockInTime: "17:30", clockOutTime: "20:00", status: "APPROVED" },
    { coachKey: "nabila", venue: woodlands, shiftDate: addDaysToDateString(today, -5), clockInTime: "16:00", clockOutTime: "18:00", status: "APPROVED" },
  ];

  const shifts: Record<string, Awaited<ReturnType<typeof prisma.coachShift.create>>> = {};
  for (const [i, def] of shiftDefs.entries()) {
    const clockInAt = toSingaporeDateTime(def.shiftDate, def.clockInTime);
    const clockOutAt = def.clockOutTime ? toSingaporeDateTime(def.shiftDate, def.clockOutTime) : null;
    const isReviewed = def.status === "APPROVED" || def.status === "REJECTED";
    shifts[`shift${i}`] = await prisma.coachShift.create({
      data: {
        coachId: coaches[def.coachKey].id,
        venueId: def.venue.id,
        shiftDate: def.shiftDate,
        clockInAt,
        clockOutAt,
        status: def.status,
        approvedByCoachId: isReviewed ? coaches.hidayah.id : null,
        approvedAt: isReviewed ? clockOutAt : null,
        reviewNote: def.reviewNote ?? null,
      },
    });
  }

  console.log("Creating check-ins...");
  // The Tampines P3 crew, checked in today under farhan's open shift — so
  // "checked in this shift" isn't zero the moment you log in.
  for (const key of ["s1", "s2", "s3", "s4"]) {
    await prisma.checkIn.create({
      data: {
        studentId: students[key].id,
        venueId: tampines.id,
        checkInDate: today,
        checkedInAt: toSingaporeDateTime(today, "16:05"),
        coachShiftId: shifts.shift0.id,
      },
    });
  }

  // A little check-in history under the past approved shifts, so student
  // profile pages have real history to show.
  const historyCheckIns: { studentKey: string; shiftKey: string; venue: typeof tampines; date: string; time: string }[] = [
    { studentKey: "s1", shiftKey: "shift1", venue: tampines, date: addDaysToDateString(today, -7), time: "16:10" },
    { studentKey: "s2", shiftKey: "shift1", venue: tampines, date: addDaysToDateString(today, -7), time: "16:12" },
    { studentKey: "s6", shiftKey: "shift6", venue: woodlands, date: addDaysToDateString(today, -6), time: "17:40" },
    { studentKey: "s7", shiftKey: "shift6", venue: woodlands, date: addDaysToDateString(today, -6), time: "17:45" },
    { studentKey: "s9", shiftKey: "shift7", venue: woodlands, date: addDaysToDateString(today, -5), time: "16:05" },
    { studentKey: "s11", shiftKey: "shift4", venue: bedok, date: addDaysToDateString(today, -2), time: "17:05" },
  ];
  for (const c of historyCheckIns) {
    await prisma.checkIn.create({
      data: {
        studentId: students[c.studentKey].id,
        venueId: c.venue.id,
        checkInDate: c.date,
        checkedInAt: toSingaporeDateTime(c.date, c.time),
        coachShiftId: shifts[c.shiftKey].id,
      },
    });
  }

  console.log("Creating curriculum topics (full P1-Sec4 syllabus, English/Math; P3-Sec4, Science)...");
  // Unchanged from before — /curriculum is independent of Class/Student and
  // needs no changes for this feature.
  const allCurricula: { subject: SubjectStr; levels: LevelCurriculum[] }[] = [
    { subject: "MATH", levels: mathCurriculum },
    { subject: "ENGLISH", levels: englishCurriculum },
    { subject: "SCIENCE", levels: scienceCurriculum },
  ];

  let totalTopics = 0;
  let totalCombos = 0;
  for (const { subject, levels } of allCurricula) {
    for (const levelCurriculum of levels) {
      for (const [i, t] of levelCurriculum.topics.entries()) {
        await prisma.curriculumTopic.create({
          data: {
            subject,
            level: levelCurriculum.level,
            order: i + 1,
            title: t.title,
            strand: t.strand,
            description: t.description,
            conceptExplanation: t.conceptExplanation,
            workedExamples: JSON.stringify(t.workedExamples),
            teachingSteps: JSON.stringify(t.teachingSteps),
            diagramSpec: t.diagram ? JSON.stringify(t.diagram) : null,
          },
        });
        totalTopics++;
      }
      totalCombos++;
    }
  }

  console.log("\nSeed complete.\n");
  console.log("Demo login credentials (all coaches share the same password):");
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  for (const def of coachDefs) {
    console.log(`  ${def.email}${def.isAdmin ? "  (admin)" : ""}`);
  }
  console.log("\nfarhan@map.test is clocked in at Tampines Centre with 4 students already checked in today —");
  console.log("log in as farhan to see the check-in desk live. admin@map.test has a pending shift (aishah's)");
  console.log("waiting for review at /payroll.");
  console.log(`\nCurriculum guide: ${totalTopics} topics across ${totalCombos} subject/level combinations (Math & English P1-Sec4, Science P3-Sec4).`);

  console.log("\nStudent QR/portal login codes (sign in at /login's Student tab, or scan the QR from their profile):");
  for (const def of studentDefs.slice(0, 5)) {
    console.log(`  ${def.name}: ${students[def.key].loginCode}`);
  }
  console.log(`  ...and ${studentDefs.length - 5} more (every student has one; look any of them up at /students as admin).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Re-run the migration's seed**

```bash
npx prisma migrate reset --force
```

Expected: drops and recreates the dev database, reapplies all migrations, and runs the new seed script to completion, ending with the "Seed complete." log block above. If it errors on a specific line, that almost always means a field name in this seed doesn't match Task 1's schema exactly — recheck the two against each other before changing anything else.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

Expected: `prisma/seed.ts` no longer appears in the error output. The remaining errors (in files this plan hasn't reached yet) are unchanged from Task 1's Step 13 check.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "$(cat <<'EOF'
feat: rewrite seed data for check-ins and shift payroll

Drops the old attendance-percentage/streak demo patterns (the policy
flags they demonstrated no longer exist) in favor of seeding coach
shifts in every payroll status and students with the new registration
fields, so the check-in desk and payroll queue both have real data on
first login.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 4: Pure lib functions — pay.ts, qr.ts

**Files:**
- Create: `src/lib/pay.ts`
- Create: `src/lib/qr.ts`
- Modify: `package.json` (add `qrcode`)

**Interfaces:**
- Produces: `HOURLY_RATE: number`, `computeShiftHours(shift): number`, `computeShiftPay(shift): number`, `summarizePayByCoach(shifts): CoachPaySummaryRow[]`, and types `PayShiftLike`, `CoachPaySummaryRow` from `src/lib/pay.ts` — Tasks 10, 11, and the CSV export in Task 11 all import these.
- Produces: `generateQrDataUrl(code: string): Promise<string>` from `src/lib/qr.ts` — Task 6's `QrDisplay`/`RegistrationFlow` and Task 16's `StudentProfileContent` all call this.

This is the one task in this plan with a real, runnable verification step (no framework — a throwaway script using Node's built-in `node:assert`, deleted afterward), since `computeShiftHours`/`computeShiftPay`/`summarizePayByCoach` are pure functions worth actually checking, unlike everything else in this plan which is verified manually through the running app.

- [ ] **Step 1: Install qrcode**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Create src/lib/pay.ts**

```ts
// Pure functions — no I/O — computing coach pay from shift timestamps.
// Hours and pay are always computed on read, never stored, same philosophy
// as src/lib/attendance-stats.ts computing attendance percentages.

export const HOURLY_RATE = 80;

export type PayShiftLike = { clockInAt: Date; clockOutAt: Date | null };

export function computeShiftHours(shift: PayShiftLike): number {
  if (!shift.clockOutAt) return 0;
  return (shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / 3_600_000;
}

export function computeShiftPay(shift: PayShiftLike): number {
  return computeShiftHours(shift) * HOURLY_RATE;
}

export type CoachPayShiftLike = PayShiftLike & { coachId: string; coach: { name: string } };
export type CoachPaySummaryRow = { coachId: string; coachName: string; hours: number; pay: number };

export function summarizePayByCoach(shifts: CoachPayShiftLike[]): CoachPaySummaryRow[] {
  const byCoach = new Map<string, CoachPaySummaryRow>();
  for (const shift of shifts) {
    const hours = computeShiftHours(shift);
    const pay = computeShiftPay(shift);
    const existing = byCoach.get(shift.coachId);
    if (existing) {
      existing.hours += hours;
      existing.pay += pay;
    } else {
      byCoach.set(shift.coachId, { coachId: shift.coachId, coachName: shift.coach.name, hours, pay });
    }
  }
  return [...byCoach.values()].sort((a, b) => a.coachName.localeCompare(b.coachName));
}
```

- [ ] **Step 3: Write and run a throwaway verification script**

Create a temporary file inside the repo, `scripts/verify-pay.ts` (not committed — deleted in Step 4):

```ts
import assert from "node:assert/strict";
import { computeShiftHours, computeShiftPay, summarizePayByCoach, HOURLY_RATE } from "../src/lib/pay";

assert.equal(HOURLY_RATE, 80);

// A 3.5-hour shift.
const clockedShift = { clockInAt: new Date("2026-09-01T16:00:00+08:00"), clockOutAt: new Date("2026-09-01T19:30:00+08:00") };
assert.equal(computeShiftHours(clockedShift), 3.5);
assert.equal(computeShiftPay(clockedShift), 280);

// Still-open shift (no clock-out) counts as zero hours, not an error.
const openShift = { clockInAt: new Date("2026-09-01T16:00:00+08:00"), clockOutAt: null };
assert.equal(computeShiftHours(openShift), 0);
assert.equal(computeShiftPay(openShift), 0);

// Two coaches, two shifts each — totals per coach, sorted by name.
const rows = summarizePayByCoach([
  { coachId: "c2", coach: { name: "Zara" }, clockInAt: new Date("2026-09-01T16:00:00+08:00"), clockOutAt: new Date("2026-09-01T18:00:00+08:00") },
  { coachId: "c1", coach: { name: "Amir" }, clockInAt: new Date("2026-09-01T16:00:00+08:00"), clockOutAt: new Date("2026-09-01T19:00:00+08:00") },
  { coachId: "c1", coach: { name: "Amir" }, clockInAt: new Date("2026-09-02T16:00:00+08:00"), clockOutAt: new Date("2026-09-02T17:00:00+08:00") },
]);
assert.deepEqual(rows.map((r) => r.coachName), ["Amir", "Zara"]);
assert.equal(rows[0].hours, 4); // Amir: 3h + 1h
assert.equal(rows[0].pay, 320);
assert.equal(rows[1].hours, 2); // Zara: 2h
assert.equal(rows[1].pay, 160);

console.log("pay.ts: all assertions passed");
```

Run it from the repo root:

```bash
npx tsx scripts/verify-pay.ts
```

Expected: `pay.ts: all assertions passed`. If an assertion fails, fix `src/lib/pay.ts` (not the script) and re-run until it passes.

- [ ] **Step 4: Delete the throwaway script**

```bash
rm -f scripts/verify-pay.ts
```

(This project has no automated test suite by deliberate prior decision — see Global Constraints — so nothing from this verification is committed. If `scripts/` is now empty, that's fine, leave the directory or remove it either way.)

- [ ] **Step 5: Create src/lib/qr.ts**

```ts
import QRCode from "qrcode";

// A student's QR always encodes their bare login code — a scan is simply
// "type this in faster." No URL wrapper: if opened by a generic camera app
// by accident, it's inert text, not a broken link. Isomorphic — this runs
// both server-side (student profile pages) and client-side (right after a
// successful registration, before any page navigation), since the `qrcode`
// package supports both environments.
export async function generateQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, { width: 256, margin: 2 });
}
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
```

Expected: no new errors introduced by these two files (they aren't imported anywhere yet, so this mostly confirms they compile in isolation).

- [ ] **Step 7: Commit**

```bash
git add src/lib/pay.ts src/lib/qr.ts package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: add pay computation and QR generation helpers

Pure hours/pay functions for coach shift payroll (verified with a
throwaway node:assert script, matching this project's no-test-
framework convention) and an isomorphic QR data-URL generator for
student check-in codes. Neither is wired into any UI yet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 5: Registration validation schema + registerStudent action

**Files:**
- Create: `src/validations/registration.ts`
- Create: `src/actions/registration.ts`

**Interfaces:**
- Consumes: `generateUniqueLoginCode` from `src/lib/login-code.ts` (Task 1), `ActionResult<T>` pattern (existing convention).
- Produces: `registerStudentSchema` and constants `EMERGENCY_CONTACT_RELATIONSHIPS`, `REFERRAL_SOURCES` from `src/validations/registration.ts` — Task 6's form and Task 12's `registerAndCheckInStudent` both use these. Produces `registerStudent(input: unknown): Promise<ActionResult<{ studentId: string; loginCode: string }>>` — **no auth check, intentionally public** (see Global Constraints) — Task 6's public/admin registration flows call this directly.

- [ ] **Step 1: Create the validation schema**

Create `src/validations/registration.ts`:

```ts
import { z } from "zod";
import { LEVELS } from "@/validations/student";

export const EMERGENCY_CONTACT_RELATIONSHIPS = ["MOTHER", "FATHER", "GUARDIAN", "OTHER"] as const;
export const REFERRAL_SOURCES = ["MAP_CLASS", "SOCIAL_MEDIA", "FRIENDS_FAMILY", "OTHER"] as const;

export const registerStudentSchema = z.object({
  name: z.string().min(2).max(100),
  level: z.enum(LEVELS),
  contactNumber: z.string().min(7).max(20),
  schoolName: z.string().min(2).max(150),
  email: z.email(),
  isMapStudent: z.enum(["true", "false"]).transform((v) => v === "true"),
  emergencyContactName: z.string().min(2).max(100),
  emergencyContactRelationship: z.enum(EMERGENCY_CONTACT_RELATIONSHIPS),
  emergencyContactPhone: z.string().min(7).max(20),
  referralSource: z.enum(REFERRAL_SOURCES).optional(),
});
```

- [ ] **Step 2: Create the registration action**

Create `src/actions/registration.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateUniqueLoginCode } from "@/lib/login-code";
import { registerStudentSchema } from "@/validations/registration";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

// Deliberately NO requireCoach()/requireAdmin() call — this is the one
// action in the app meant to be reachable by a signed-out visitor (the
// public /register page, reached via the onboarding QR). See this plan's
// Global Constraints for why that's intentional, not an oversight.
export async function registerStudent(input: unknown): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const loginCode = await generateUniqueLoginCode();
  const student = await prisma.student.create({
    data: { ...parsed.data, loginCode },
  });

  revalidatePath("/students");
  return { success: true, data: { studentId: student.id, loginCode } };
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors in `src/validations/registration.ts` or `src/actions/registration.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/validations/registration.ts src/actions/registration.ts
git commit -m "$(cat <<'EOF'
feat: add public student registration action

registerStudent has no auth check by design — it's the one action
meant to be reachable by a signed-out visitor via the onboarding QR.
Not yet wired to any page.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 6: Shared QrDisplay + RegistrationFlow components

**Files:**
- Create: `src/components/registration/qr-display.tsx`
- Create: `src/components/registration/registration-flow.tsx`

**Interfaces:**
- Consumes: `generateQrDataUrl` (Task 4), `registerStudentSchema`/`EMERGENCY_CONTACT_RELATIONSHIPS`/`REFERRAL_SOURCES` (Task 5), `EMERGENCY_CONTACT_LABELS`/`REFERRAL_SOURCE_LABELS` (Task 1, Step 9), `ActionResult<T>`, `LEVELS`/`formatLevel` (existing).
- Produces: `QrDisplay({ name, loginCode, qrDataUrl }): JSX.Element` — a plain presentational component with no hooks and no server-only APIs, safe to render from either a Server Component (Task 16) or this task's Client Component. Produces `RegistrationFlow({ onSubmitAction, footer? }): JSX.Element` (Client Component) — Task 7's public `/register` page, Task 7's admin `/students/new`, and Task 15's coach-assisted registration page all render this, differing only in which server action they pass as `onSubmitAction`.

**Why one component serves three pages:** the form fields are identical whether a visitor is registering themselves, a coach is registering a walk-in, or an admin is pre-registering someone — only *which action runs on submit* differs (`registerStudent` vs. Task 12's `registerAndCheckInStudent`). `RegistrationFlow` owns the field markup, the `useActionState` call, and the "show the QR on success" transition; each page just supplies the action and, optionally, page-specific `footer` content to show alongside the QR (e.g., a "Scan another" link).

- [ ] **Step 1: Create QrDisplay**

Create `src/components/registration/qr-display.tsx`:

```tsx
// No "use client" — a plain presentational component with no hooks or
// server-only APIs. Its qrDataUrl prop may have been generated server-side
// (student profile pages) or client-side (RegistrationFlow, right after a
// successful registration, before any navigation) — this component doesn't
// care which.
import { Card, CardContent } from "@/components/ui/card";

export function QrDisplay({ name, loginCode, qrDataUrl }: { name: string; loginCode: string; qrDataUrl: string }) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm font-medium opacity-90">{name}&apos;s check-in code</p>
        <div className="rounded-2xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, not an optimizable remote/static asset */}
          <img src={qrDataUrl} alt={`QR code for ${name}`} width={192} height={192} />
        </div>
        <p className="font-mono text-lg font-semibold tracking-[0.3em]">{loginCode}</p>
        <p className="max-w-xs text-xs opacity-80">
          Screenshot this or save the code — a coach scans it every time you visit a study space.
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create RegistrationFlow**

Create `src/components/registration/registration-flow.tsx`:

```tsx
"use client";

import { useActionState, useState, type ReactNode } from "react";
import { generateQrDataUrl } from "@/lib/qr";
import { LEVELS } from "@/validations/student";
import { EMERGENCY_CONTACT_RELATIONSHIPS, REFERRAL_SOURCES } from "@/validations/registration";
import { formatLevel, EMERGENCY_CONTACT_LABELS, REFERRAL_SOURCE_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { QrDisplay } from "@/components/registration/qr-display";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };
type RegisteredResult = { name: string; loginCode: string; qrDataUrl: string };
type FormState = { error?: string } | undefined;

export function RegistrationFlow({
  onSubmitAction,
  footer,
}: {
  onSubmitAction: (input: unknown) => Promise<ActionResult<{ studentId: string; loginCode: string }>>;
  footer?: (result: RegisteredResult) => ReactNode;
}) {
  const [result, setResult] = useState<RegisteredResult | null>(null);
  const [isMapStudent, setIsMapStudent] = useState(true);

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const res = await onSubmitAction({
      name: formData.get("name"),
      level: formData.get("level"),
      contactNumber: formData.get("contactNumber"),
      schoolName: formData.get("schoolName"),
      email: formData.get("email"),
      isMapStudent: formData.get("isMapStudent"),
      emergencyContactName: formData.get("emergencyContactName"),
      emergencyContactRelationship: formData.get("emergencyContactRelationship"),
      emergencyContactPhone: formData.get("emergencyContactPhone"),
      referralSource: formData.get("referralSource") || undefined,
    });
    if (!res.success) return { error: res.error };

    const qrDataUrl = await generateQrDataUrl(res.data.loginCode);
    setResult({ name: String(formData.get("name")), loginCode: res.data.loginCode, qrDataUrl });
    return undefined;
  }

  const [state, formAction, isPending] = useActionState(action, undefined);

  if (result) {
    return (
      <div className="space-y-4">
        <QrDisplay name={result.name} loginCode={result.loginCode} qrDataUrl={result.qrDataUrl} />
        {footer?.(result)}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="isMapStudent" value={isMapStudent ? "true" : "false"} />

      <div className="space-y-2">
        <Label htmlFor="name">Student name</Label>
        <Input id="name" name="name" required minLength={2} autoComplete="name" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="level">School level</Label>
          <NativeSelect id="level" name="level" required defaultValue="">
            <option value="" disabled>
              Select level
            </option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {formatLevel(level)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactNumber">Contact number</Label>
          <Input id="contactNumber" name="contactNumber" type="tel" required autoComplete="tel" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolName">School name</Label>
        <Input id="schoolName" name="schoolName" required minLength={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-2">
        <Label>Are you an MAP student?</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={isMapStudent ? "default" : "outline"}
            onClick={() => setIsMapStudent(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!isMapStudent ? "default" : "outline"}
            onClick={() => setIsMapStudent(false)}
          >
            No
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContactName">Emergency contact name</Label>
        <Input id="emergencyContactName" name="emergencyContactName" required minLength={2} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactRelationship">Relationship</Label>
          <NativeSelect id="emergencyContactRelationship" name="emergencyContactRelationship" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {EMERGENCY_CONTACT_RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {EMERGENCY_CONTACT_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Contact number</Label>
          <Input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" required autoComplete="tel" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="referralSource">How did you hear about Study Space? (optional)</Label>
        <NativeSelect id="referralSource" name="referralSource" defaultValue="">
          <option value="">Prefer not to say</option>
          {REFERRAL_SOURCES.map((r) => (
            <option key={r} value={r}>
              {REFERRAL_SOURCE_LABELS[r]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white hover:opacity-90"
      >
        {isPending ? "Registering…" : "Register"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors in either new file. Neither is imported by a page yet, so this only confirms they compile.

- [ ] **Step 4: Commit**

```bash
git add src/components/registration/qr-display.tsx src/components/registration/registration-flow.tsx
git commit -m "$(cat <<'EOF'
feat: add shared registration form and QR display components

One RegistrationFlow component serves the public, coach-assisted, and
admin registration entry points — only the server action it's given
differs. Not yet wired to any page.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 7: Public /register page, middleware update, retire the old admin form

**Files:**
- Create: `src/app/register/page.tsx`
- Modify: `middleware.ts`
- Modify: `src/app/(app)/students/new/page.tsx`
- Delete: `src/components/students/create-student-form.tsx`

**Interfaces:**
- Consumes: `RegistrationFlow` (Task 6), `registerStudent` (Task 5).

- [ ] **Step 1: Create the public register page**

`src/app/register/page.tsx` lives outside every route group (`(app)`, `(auth)`, `(student)`), so it inherits only the root layout — no top nav, no bottom tab bar, no auth-gated shell. Create it:

```tsx
import { registerStudent } from "@/actions/registration";
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

- [ ] **Step 2: Exclude /register from the auth-gated middleware matcher**

In `middleware.ts`, change:

```ts
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
```

to:

```ts
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)"],
};
```

- [ ] **Step 3: Repoint the admin registration page**

Replace the entire contents of `src/app/(app)/students/new/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { registerStudent } from "@/actions/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buttonVariants } from "@/components/ui/button";

export default async function NewStudentPage() {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/students");

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
        footer={() => (
          <Link href="/students" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to students
          </Link>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Delete the old admin-only form component**

```bash
rm src/components/students/create-student-form.tsx
```

It only rendered fields for `venueId`/`guardianName`/`guardianPhone`/`initialClassId`, all gone or renamed in Task 1, and its only caller (`/students/new`) was just replaced in Step 3. Nothing else imports it (grep confirmed earlier: `login-code-card.tsx` and `manage-enrollment.tsx` matched the earlier `createStudentSchema` search because they import unrelated things from `@/actions/students` and `@/validations/student` — neither imports `create-student-form.tsx` itself).

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```

Expected: `src/app/(app)/students/new/page.tsx` and `src/components/students/create-student-form.tsx` no longer appear in the error list from Task 1's Step 13 check (the latter because the file is gone).

```bash
npm run dev
```

In a browser (ideally at a mobile viewport — Chrome DevTools device toolbar, e.g. iPhone 14), visit `http://localhost:3000/register` while signed out. Confirm: no top nav or tab bar appears, the form renders, submitting with all fields filled shows the purple→pink `QrDisplay` with a real QR image and the plain code beneath it. Then sign in as `admin@map.test` (quick demo login) and visit `/students/new` — confirm the same form renders there, gated behind admin sign-in this time, with a "Back to students" link after submitting. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add src/app/register/page.tsx middleware.ts "src/app/(app)/students/new/page.tsx"
git rm src/components/students/create-student-form.tsx
git commit -m "$(cat <<'EOF'
feat: wire up public and admin student registration

/register is now reachable while signed out (excluded from the auth
middleware matcher) and shows a real QR on successful registration.
Admin's /students/new reuses the same shared form instead of the old
venue/enrollment-oriented one, which is deleted.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 8: Venue picker data, coach-shift validation, coach-shifts data queries

**Files:**
- Create: `src/data/venues.ts`
- Create: `src/validations/coach-shift.ts`
- Create: `src/data/coach-shifts.ts`

**Interfaces:**
- Produces: `getAllVenues(): Promise<{ id: string; name: string }[]>` — Task 9's clock-in form uses this.
- Produces: `clockInSchema { venueId }`, `clockOutSchema { shiftId }`, `editShiftSchema { shiftId, clockInAt, clockOutAt }`, `rejectShiftSchema { shiftId, reviewNote }` — Task 9's and Task 10's actions validate against these.
- Produces: `getOpenShiftForCoach(coachId)`, `getShiftHistoryForCoach(coachId)`, `getPendingShifts()`, `getPaySummary(from, to)` — Task 9 (Home page), Task 10 (coach profile), and Task 11 (payroll page + CSV export) all read through these.

- [ ] **Step 1: Create src/data/venues.ts**

```ts
import { prisma } from "@/lib/prisma";

export async function getAllVenues() {
  return prisma.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}
```

- [ ] **Step 2: Create the coach-shift validation schemas**

Create `src/validations/coach-shift.ts`:

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
  clockInAt: z.string().min(1),
  clockOutAt: z.string().min(1).nullable(),
});

export const rejectShiftSchema = z.object({
  shiftId: z.string().min(1),
  reviewNote: z.string().min(1).max(500),
});
```

- [ ] **Step 3: Create the coach-shift data queries**

Create `src/data/coach-shifts.ts`:

```ts
import { prisma } from "@/lib/prisma";

export async function getOpenShiftForCoach(coachId: string) {
  return prisma.coachShift.findFirst({
    where: { coachId, status: "OPEN" },
    include: { venue: true },
  });
}

export async function getShiftHistoryForCoach(coachId: string) {
  return prisma.coachShift.findMany({
    where: { coachId },
    include: { venue: true },
    orderBy: { clockInAt: "desc" },
  });
}

export async function getPendingShifts() {
  return prisma.coachShift.findMany({
    where: { status: "PENDING" },
    include: { coach: true, venue: true },
    orderBy: { clockInAt: "asc" },
  });
}

// from/to are "YYYY-MM-DD" strings, compared lexicographically against the
// stored shiftDate — safe because that format sorts correctly as plain text,
// same convention this schema already relies on everywhere else (see
// src/lib/dates.ts).
export async function getPaySummary(from: string, to: string) {
  return prisma.coachShift.findMany({
    where: { status: "APPROVED", shiftDate: { gte: from, lte: to } },
    include: { coach: true, venue: true },
    orderBy: [{ coach: { name: "asc" } }, { shiftDate: "asc" }],
  });
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors in these three new files.

- [ ] **Step 5: Commit**

```bash
git add src/data/venues.ts src/validations/coach-shift.ts src/data/coach-shifts.ts
git commit -m "$(cat <<'EOF'
feat: add coach-shift data layer and validation schemas

Read queries and Zod schemas for clock-in/out, the admin pending
queue, and pay-period summaries. Not yet wired to any action or page.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 9: clockIn/clockOut actions + Home page clock-in gate

**Files:**
- Create: `src/actions/coach-shifts.ts`
- Create: `src/components/checkin/clock-in-form.tsx`
- Modify: `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `clockInSchema`/`clockOutSchema` (Task 8), `getOpenShiftForCoach` (Task 8), `getAllVenues` (Task 8).
- Produces: `clockIn(input): Promise<ActionResult<{ shiftId: string }>>`, `clockOut(input): Promise<ActionResult>` from `src/actions/coach-shifts.ts` — Task 10 adds `editShift`/`reopenShift`/`approveShift`/`rejectShift` to this same file later. Home (`src/app/(app)/page.tsx`) stops being "My classes" and becomes shift-gated — this is the change every later coach-facing task (10, 12, 15) builds on.

- [ ] **Step 1: Create the clock-in/out actions**

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
  if (!parsed.success) return { success: false, error: "Pick a venue first." };

  const existingOpen = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (existingOpen) return { success: false, error: "You're already clocked in." };

  const shift = await prisma.coachShift.create({
    data: {
      coachId: coach.id,
      venueId: parsed.data.venueId,
      shiftDate: getSingaporeTodayString(),
      clockInAt: new Date(),
    },
  });

  revalidatePath("/");
  return { success: true, data: { shiftId: shift.id } };
}

export async function clockOut(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift || shift.coachId !== coach.id) return { success: false, error: "Shift not found." };
  if (shift.status !== "OPEN") return { success: false, error: "This shift is already clocked out." };

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: { clockOutAt: new Date(), status: "PENDING" },
  });

  revalidatePath("/");
  return { success: true, data: undefined };
}
```

- [ ] **Step 2: Create the clock-in form**

Create `src/components/checkin/clock-in-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { clockIn } from "@/actions/coach-shifts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Venue = { id: string; name: string };
type FormState = { error?: string } | undefined;

export function ClockInForm({ venues }: { venues: Venue[] }) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await clockIn({ venueId: formData.get("venueId") });
    if (!result.success) return { error: result.error };
    return undefined;
  }
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-5 pt-10 text-center">
      <div>
        <h1 className="text-xl font-semibold">Clock in to start</h1>
        <p className="text-sm text-muted-foreground">Pick where you&apos;re coaching today.</p>
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="venueId">Location</Label>
        <NativeSelect id="venueId" name="venueId" required defaultValue="">
          <option value="" disabled>
            Select a venue
          </option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white hover:opacity-90"
      >
        {isPending ? "Clocking in…" : "Clock In"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Replace the Home page**

Replace the entire contents of `src/app/(app)/page.tsx` with:

```tsx
import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach } from "@/data/coach-shifts";
import { getAllVenues } from "@/data/venues";
import { ClockInForm } from "@/components/checkin/clock-in-form";

export default async function DashboardPage() {
  const coach = await requireCoach();
  const openShift = await getOpenShiftForCoach(coach.id);

  if (!openShift) {
    const venues = await getAllVenues();
    return <ClockInForm venues={venues} />;
  }

  // Task 15 replaces this placeholder with the real CheckInDesk (scanner,
  // manual code fallback, running count, clock-out, register-new-visitor).
  return <p>Clocked in at {openShift.venue.name}. Check-in desk coming in Task 15.</p>;
}
```

This intentionally leaves a placeholder for the "open shift" branch — Task 15 replaces it once `CheckInDesk` exists. The old "My classes" markup (`getClassesForCoach`, `formatClassLabel`, the classes `<ul>`) is fully removed here, not kept alongside; `src/data/classes.ts`'s `getClassesForCoach` stays in the codebase unused, same as every other class-based export.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: `src/app/(app)/page.tsx` no longer appears in the error list.

```bash
npm run dev
```

Sign in as `admin@map.test` (has no open shift per the seed) — confirm you land on the Clock In screen, pick a venue, submit, and see the placeholder "Clocked in at `<venue>`" text. Then sign in as `farhan@map.test` (seeded with an OPEN shift already) — confirm you see the placeholder text immediately, skipping the clock-in screen entirely. Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add src/actions/coach-shifts.ts src/components/checkin/clock-in-form.tsx "src/app/(app)/page.tsx"
git commit -m "$(cat <<'EOF'
feat: replace Home with the coach clock-in gate

Signing in now shows a Clock In screen (pick a venue) when a coach has
no open shift, or a placeholder for the check-in desk when they do.
The old class-list Home page is fully replaced, not kept alongside.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 10: Shift review actions, shared EditShiftDialog, ShiftHistory, coach profile rework

**Files:**
- Modify: `src/actions/coach-shifts.ts` (add 4 actions)
- Create: `src/components/coach/edit-shift-dialog.tsx`
- Create: `src/components/coach/shift-history.tsx`
- Modify: `src/app/(app)/coaches/[coachId]/page.tsx`

**Interfaces:**
- Consumes: `computeShiftHours`/`computeShiftPay` (Task 4), `getCoachProfile` (existing, unchanged), `getShiftHistoryForCoach` (Task 8).
- Produces: `editShift(input)`, `reopenShift(input)`, `approveShift(input)`, `rejectShift(input)` appended to `src/actions/coach-shifts.ts` — Task 11's `PendingShiftsTable` calls `approveShift`/`rejectShift`/`editShift` directly. Produces `EditShiftDialog({ shift })` — Task 11's pending-shifts table reuses this exact component rather than a second copy.

This is the "review a shift after the fact" surface: it's how a coach's own hours (and, for an admin, anyone's) get corrected, approved, or rejected, and it's what "My Hours" in the nav decision actually points at — there's no separate `/hours` route in this plan, it lives on the existing coach profile page.

- [ ] **Step 1: Append the four review actions**

Add these imports to the top of `src/actions/coach-shifts.ts` (alongside the existing ones from Task 9):

```ts
import { requireAdmin } from "@/lib/session";
import { editShiftSchema, rejectShiftSchema } from "@/validations/coach-shift";
```

(`requireCoach`, `clockInSchema`, `clockOutSchema` are already imported from Task 9 — don't duplicate those lines, just add the two above alongside them.)

Then append these four exports at the end of the file, after `clockOut`:

```ts
export async function editShift(input: unknown): Promise<ActionResult> {
  const coach = await requireCoach();
  const parsed = editShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (!coach.isAdmin && shift.coachId !== coach.id) return { success: false, error: "Not your shift." };
  if (shift.status === "APPROVED" || shift.status === "REJECTED") {
    return { success: false, error: "Reopen this shift before editing it." };
  }

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: {
      clockInAt: new Date(parsed.data.clockInAt),
      clockOutAt: parsed.data.clockOutAt ? new Date(parsed.data.clockOutAt) : null,
    },
  });

  revalidatePath(`/coaches/${shift.coachId}`);
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function reopenShift(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clockOutSchema.safeParse(input); // same { shiftId } shape
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const shift = await prisma.coachShift.update({
    where: { id: parsed.data.shiftId },
    data: { status: "PENDING", approvedAt: null, approvedByCoachId: null },
  });

  revalidatePath(`/coaches/${shift.coachId}`);
  revalidatePath("/payroll");
  return { success: true, data: undefined };
}

export async function approveShift(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.status !== "PENDING") return { success: false, error: "Only pending shifts can be approved." };

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: { status: "APPROVED", approvedByCoachId: admin.id, approvedAt: new Date() },
  });

  revalidatePath("/payroll");
  revalidatePath(`/coaches/${shift.coachId}`);
  return { success: true, data: undefined };
}

export async function rejectShift(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = rejectShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "A reason is required." };

  const shift = await prisma.coachShift.findUnique({ where: { id: parsed.data.shiftId } });
  if (!shift) return { success: false, error: "Shift not found." };
  if (shift.status !== "PENDING") return { success: false, error: "Only pending shifts can be rejected." };

  await prisma.coachShift.update({
    where: { id: shift.id },
    data: { status: "REJECTED", approvedByCoachId: admin.id, approvedAt: new Date(), reviewNote: parsed.data.reviewNote },
  });

  revalidatePath("/payroll");
  revalidatePath(`/coaches/${shift.coachId}`);
  return { success: true, data: undefined };
}
```

- [ ] **Step 2: Create the shared edit-shift dialog**

Create `src/components/coach/edit-shift-dialog.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { editShift } from "@/actions/coach-shifts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

type Shift = { id: string; clockInAt: Date; clockOutAt: Date | null };

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditShiftDialog({ shift }: { shift: Shift }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await editShift({
        shiftId: shift.id,
        clockInAt: formData.get("clockInAt"),
        clockOutAt: formData.get("clockOutAt") || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Shift updated.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit shift</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`clockInAt-${shift.id}`}>Clock in</Label>
            <Input
              id={`clockInAt-${shift.id}`}
              name="clockInAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(shift.clockInAt)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`clockOutAt-${shift.id}`}>Clock out</Label>
            <Input
              id={`clockOutAt-${shift.id}`}
              name="clockOutAt"
              type="datetime-local"
              defaultValue={shift.clockOutAt ? toDatetimeLocal(shift.clockOutAt) : ""}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create ShiftHistory**

Create `src/components/coach/shift-history.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reopenShift } from "@/actions/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { formatDateForDisplay } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditShiftDialog } from "@/components/coach/edit-shift-dialog";

type Shift = {
  id: string;
  venue: { name: string };
  shiftDate: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  status: "OPEN" | "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
};

const STATUS_VARIANT = {
  OPEN: "default",
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
} as const;

export function ShiftHistory({ shifts, canReopen }: { shifts: Shift[]; canReopen: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleReopen(shiftId: string) {
    startTransition(async () => {
      const result = await reopenShift({ shiftId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Reopened for editing.");
      router.refresh();
    });
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">No shifts logged yet.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {shifts.map((shift) => (
        <li key={shift.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {shift.venue.name} · {formatDateForDisplay(shift.shiftDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {computeShiftHours(shift).toFixed(2)}h · ${computeShiftPay(shift).toFixed(2)}
              {shift.reviewNote && ` · ${shift.reviewNote}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={STATUS_VARIANT[shift.status]}>{shift.status}</Badge>
            {(shift.status === "OPEN" || shift.status === "PENDING") && <EditShiftDialog shift={shift} />}
            {canReopen && (shift.status === "APPROVED" || shift.status === "REJECTED") && (
              <Button size="sm" variant="ghost" disabled={isPending} onClick={() => handleReopen(shift.id)}>
                Reopen
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Rework the coach profile page**

Replace the entire contents of `src/app/(app)/coaches/[coachId]/page.tsx` with:

```tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getCoachProfile } from "@/data/coaches";
import { getShiftHistoryForCoach } from "@/data/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { getInitials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ShiftHistory } from "@/components/coach/shift-history";

export default async function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = await params;
  const currentCoach = await requireCoach();
  if (!currentCoach.isAdmin && currentCoach.id !== coachId) redirect(`/coaches/${currentCoach.id}`);

  const data = await getCoachProfile(coachId);
  if (!data) notFound();
  const { coach } = data;

  const shifts = await getShiftHistoryForCoach(coachId);
  const approvedShifts = shifts.filter((s) => s.status === "APPROVED");
  const approvedHours = approvedShifts.reduce((sum, s) => sum + computeShiftHours(s), 0);
  const approvedPay = approvedShifts.reduce((sum, s) => sum + computeShiftPay(s), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{coach.name}</h1>
            {coach.isAdmin && <Badge>Admin</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{coach.email}</p>
          {coach.phone && <p className="text-sm text-muted-foreground">{coach.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">{approvedHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Approved hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold">${approvedPay.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Approved pay</p>
          </CardContent>
        </Card>
      </div>

      {currentCoach.isAdmin && (
        <Link href="/payroll" className={buttonVariants({ variant: "outline" })}>
          Go to payroll
        </Link>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Shifts</h2>
        <ShiftHistory shifts={shifts} canReopen={currentCoach.isAdmin} />
      </div>
    </div>
  );
}
```

This drops the old "classes taught" `<ul>` of `ClassAssignment`s entirely (per the spec's "swap classes-taught for a shift/hours/pay summary") — `getCoachProfile`'s `assignments`/`sessionsCount`/`studentCount` fields are simply no longer read by this page. `getCoachProfile` itself is untouched (Task 17 doesn't need to fix it — nothing in it references `Student.venueId` or `Venue.students`).

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```

Expected: `src/app/(app)/coaches/[coachId]/page.tsx` no longer appears in the error list; no errors in the two new component files or the appended actions.

```bash
npm run dev
```

Sign in as `admin@map.test`, visit `/coaches/<farhan's id>` (find it via a browser devtools inspection of a link, or just visit your own admin profile first) — confirm approved hours/pay show a real number (farhan has two seeded APPROVED shifts) and the shift list shows all of farhan's shifts with correct status badges, including the REJECTED one under `ain` showing its review note. Click **Edit** on an OPEN/PENDING shift, change the clock-out time, save, confirm the hours/pay recompute. Click **Reopen** on an APPROVED shift, confirm it flips to PENDING and becomes editable. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add src/actions/coach-shifts.ts src/components/coach/edit-shift-dialog.tsx src/components/coach/shift-history.tsx "src/app/(app)/coaches/[coachId]/page.tsx"
git commit -m "$(cat <<'EOF'
feat: add shift review actions and rework the coach profile page

editShift/reopenShift/approveShift/rejectShift, a shared edit dialog,
and a shift-history list replace the old classes-taught section on a
coach's profile — this is where "My Hours" lives, per the nav design.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 11: Admin payroll page — pending queue, pay summary, CSV export

**Files:**
- Create: `src/components/payroll/pending-shifts-table.tsx`
- Create: `src/components/payroll/pay-summary.tsx`
- Create: `src/app/(app)/payroll/page.tsx`
- Create: `src/app/api/payroll/export/route.ts`

**Interfaces:**
- Consumes: `getPendingShifts`/`getPaySummary` (Task 8), `approveShift`/`rejectShift`/`editShift` + `EditShiftDialog` (Task 10), `computeShiftHours`/`computeShiftPay`/`summarizePayByCoach`/`HOURLY_RATE` (Task 4), `getSingaporeTodayString` (existing).
- This is the last piece of "how much payroll workflow should this phase build" — the admin now has a full pending → approve/edit/reject loop plus a downloadable pay summary. Nothing later in this plan depends on these three files.

- [ ] **Step 1: Create the pending-shifts table**

Create `src/components/payroll/pending-shifts-table.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveShift, rejectShift } from "@/actions/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { formatDateForDisplay } from "@/lib/dates";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { EditShiftDialog } from "@/components/coach/edit-shift-dialog";

type Shift = {
  id: string;
  coach: { name: string };
  venue: { name: string };
  shiftDate: string;
  clockInAt: Date;
  clockOutAt: Date | null;
};

export function PendingShiftsTable({ shifts }: { shifts: Shift[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove(shiftId: string) {
    startTransition(async () => {
      const result = await approveShift({ shiftId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Approved.");
      router.refresh();
    });
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Coach</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>Pay</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shifts.map((shift) => (
          <TableRow key={shift.id}>
            <TableCell>{shift.coach.name}</TableCell>
            <TableCell>{shift.venue.name}</TableCell>
            <TableCell>{formatDateForDisplay(shift.shiftDate)}</TableCell>
            <TableCell>{computeShiftHours(shift).toFixed(2)}</TableCell>
            <TableCell>${computeShiftPay(shift).toFixed(2)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <EditShiftDialog shift={shift} />
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleApprove(shift.id)}>
                  Approve
                </Button>
                <RejectShiftDialog shiftId={shift.id} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RejectShiftDialog({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await rejectShift({ shiftId, reviewNote: formData.get("reviewNote") });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Rejected.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive" />}>Reject</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject shift</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reviewNote">Reason</Label>
            <Textarea id="reviewNote" name="reviewNote" required minLength={1} />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              Confirm reject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create the pay summary component**

Create `src/components/payroll/pay-summary.tsx`:

```tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { HOURLY_RATE, type CoachPaySummaryRow } from "@/lib/pay";

export function PaySummary({ from, to, rows }: { from: string; to: string; rows: CoachPaySummaryRow[] }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      from: String(formData.get("from")),
      to: String(formData.get("to")),
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Update
        </button>
        <a href={`/api/payroll/export?from=${from}&to=${to}`} className={buttonVariants({ variant: "outline" })}>
          Download CSV
        </a>
      </form>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No approved shifts in this range.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Pay (${HOURLY_RATE}/hr)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.coachId}>
                <TableCell>{row.coachName}</TableCell>
                <TableCell>{row.hours.toFixed(2)}</TableCell>
                <TableCell>${row.pay.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the payroll page**

Create `src/app/(app)/payroll/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getPendingShifts, getPaySummary } from "@/data/coach-shifts";
import { getSingaporeTodayString } from "@/lib/dates";
import { summarizePayByCoach } from "@/lib/pay";
import { PendingShiftsTable } from "@/components/payroll/pending-shifts-table";
import { PaySummary } from "@/components/payroll/pay-summary";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const coach = await requireCoach();
  if (!coach.isAdmin) redirect("/");

  const pending = await getPendingShifts();

  const today = getSingaporeTodayString();
  const { from = `${today.slice(0, 7)}-01`, to = today } = await searchParams;
  const approvedShifts = await getPaySummary(from, to);
  const rows = summarizePayByCoach(approvedShifts);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Payroll</h1>
        <p className="text-sm text-muted-foreground">Review clocked shifts and see coaching pay.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pending review</h2>
        <PendingShiftsTable shifts={pending} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pay summary</h2>
        <PaySummary from={from} to={to} rows={rows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the CSV export route**

Create `src/app/api/payroll/export/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/session";
import { getPaySummary } from "@/data/coach-shifts";
import { computeShiftHours, computeShiftPay } from "@/lib/pay";
import { formatDateForDisplay } from "@/lib/dates";

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const coach = await requireCoach().catch(() => null);
  if (!coach?.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to are required." }, { status: 400 });

  const shifts = await getPaySummary(from, to);

  const header = "Coach,Date,Venue,Clock In,Clock Out,Hours,Pay";
  const rows = shifts.map((shift) => {
    const hours = computeShiftHours(shift).toFixed(2);
    const pay = computeShiftPay(shift).toFixed(2);
    const clockIn = shift.clockInAt.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
    const clockOut = shift.clockOutAt
      ? shift.clockOutAt.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })
      : "";
    return [csvField(shift.coach.name), csvField(formatDateForDisplay(shift.shiftDate)), csvField(shift.venue.name), csvField(clockIn), csvField(clockOut), hours, pay].join(",");
  });

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payroll-${from}-to-${to}.csv"`,
    },
  });
}
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors in any of the four new files.

```bash
npm run dev
```

Sign in as `admin@map.test`, visit `/payroll` — confirm the pending queue shows aishah's seeded PENDING shift, and the pay summary (defaulting to this calendar month) shows farhan/danial/haziq/nabila's approved hours. Approve aishah's shift and confirm it disappears from the pending list and, after widening the date range if needed, appears in the pay summary. Click **Download CSV** and confirm a file downloads with the expected columns. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add src/components/payroll/pending-shifts-table.tsx src/components/payroll/pay-summary.tsx "src/app/(app)/payroll/page.tsx" src/app/api/payroll/export/route.ts
git commit -m "$(cat <<'EOF'
feat: add admin payroll page with pending queue and CSV export

Completes the payroll workflow: approve/edit/reject pending shifts,
a date-range pay summary per coach, and a CSV download of the same.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 12: Check-in validation, data queries, scanCheckIn and registerAndCheckInStudent actions

**Files:**
- Create: `src/validations/checkin.ts`
- Create: `src/data/checkins.ts`
- Create: `src/actions/checkins.ts`
- Modify: `src/actions/registration.ts` (add `registerAndCheckInStudent`)

**Interfaces:**
- Consumes: `registerStudentSchema` (Task 5), `getSingaporeTodayString` (existing).
- Produces: `getCheckInCountForShift(coachShiftId): Promise<number>` from `src/data/checkins.ts` — Task 15's Home wiring uses this for the initial "X checked in" count. Produces `scanCheckIn(input): Promise<ScanResult>` and the `ScanResult` union type from `src/actions/checkins.ts` — Task 15's `CheckInDesk` and `Scanner` consume this exact shape. Produces `registerAndCheckInStudent(input): Promise<ActionResult<{ studentId: string; loginCode: string }>>` appended to `src/actions/registration.ts` — Task 15's coach-assisted registration page calls this.

**Note on guardian notifications:** `scanCheckIn` below calls `sendGuardianCheckInNotification`, which doesn't exist until Task 13. Task 13 must land before this task's manual verification step will fully pass (the check-in itself will still work; only the notification call will error). If executing tasks out of strict order, do Task 13 first or expect that one step to fail until it's done.

- [ ] **Step 1: Create the check-in validation schema**

Create `src/validations/checkin.ts`:

```ts
import { z } from "zod";

export const scanCheckInSchema = z.object({
  code: z.string().min(4).max(12),
});
```

- [ ] **Step 2: Create the check-in data queries**

Create `src/data/checkins.ts`:

```ts
import { prisma } from "@/lib/prisma";

export async function getCheckInCountForShift(coachShiftId: string): Promise<number> {
  return prisma.checkIn.count({ where: { coachShiftId } });
}
```

- [ ] **Step 3: Create the scanCheckIn action**

Create `src/actions/checkins.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
import { scanCheckInSchema } from "@/validations/checkin";
import { sendGuardianCheckInNotification } from "@/lib/notifications";

export type ScanResult =
  | { outcome: "checked_in"; studentName: string }
  | { outcome: "already_checked_in"; studentName: string }
  | { outcome: "not_found" }
  | { outcome: "error"; error: string };

export async function scanCheckIn(input: unknown): Promise<ScanResult> {
  const coach = await requireCoach();
  const parsed = scanCheckInSchema.safeParse(input);
  if (!parsed.success) return { outcome: "error", error: "Invalid code." };

  const shift = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (!shift) return { outcome: "error", error: "Clock in before scanning." };

  const student = await prisma.student.findUnique({ where: { loginCode: parsed.data.code.toUpperCase() } });
  if (!student) return { outcome: "not_found" };

  const checkInDate = getSingaporeTodayString();
  const existing = await prisma.checkIn.findUnique({
    where: { studentId_venueId_checkInDate: { studentId: student.id, venueId: shift.venueId, checkInDate } },
  });
  if (existing) {
    return { outcome: "already_checked_in", studentName: student.name };
  }

  const checkIn = await prisma.checkIn.create({
    data: { studentId: student.id, venueId: shift.venueId, checkInDate, coachShiftId: shift.id },
  });

  if (student.isMapStudent) {
    await sendGuardianCheckInNotification({ checkInId: checkIn.id });
  }

  revalidatePath("/");
  return { outcome: "checked_in", studentName: student.name };
}
```

- [ ] **Step 4: Append registerAndCheckInStudent**

Add this import to the top of `src/actions/registration.ts` (alongside the existing ones from Task 5):

```ts
import { requireCoach } from "@/lib/session";
import { getSingaporeTodayString } from "@/lib/dates";
```

Then append this export at the end of the file, after `registerStudent`:

```ts
// The coach-assisted registration variant: same validation and Student
// creation as registerStudent, but requires an open shift (a venue is
// needed for the visitor's first check-in) and, unlike the public flow,
// requires being signed in as a coach.
export async function registerAndCheckInStudent(
  input: unknown,
): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const coach = await requireCoach();
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const shift = await prisma.coachShift.findFirst({ where: { coachId: coach.id, status: "OPEN" } });
  if (!shift) return { success: false, error: "Clock in before registering a visitor." };

  const loginCode = await generateUniqueLoginCode();
  const student = await prisma.student.create({
    data: { ...parsed.data, loginCode },
  });

  await prisma.checkIn.create({
    data: {
      studentId: student.id,
      venueId: shift.venueId,
      checkInDate: getSingaporeTodayString(),
      coachShiftId: shift.id,
    },
  });

  revalidatePath("/students");
  revalidatePath("/");
  return { success: true, data: { studentId: student.id, loginCode } };
}
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```

Expected: `src/actions/checkins.ts` and `src/data/checkins.ts` compile cleanly; `src/actions/registration.ts` shows exactly one error — an unresolved import of `sendGuardianCheckInNotification` inside `checkins.ts` from `@/lib/notifications`, since that export doesn't exist until Task 13. That single error is expected at this point in the plan; every other file should be clean.

- [ ] **Step 6: Commit**

```bash
git add src/validations/checkin.ts src/data/checkins.ts src/actions/checkins.ts src/actions/registration.ts
git commit -m "$(cat <<'EOF'
feat: add scanCheckIn and coach-assisted registration actions

scanCheckIn looks up a student by their login code (the same value
their QR encodes), requires an open coach shift, and is a no-op if
already checked in today at that venue. registerAndCheckInStudent
combines registration with an immediate first check-in for walk-ins.
Depends on Task 13's guardian-notification function, not yet added.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 13: Guardian check-in notification

**Files:**
- Modify: `src/lib/notifications.ts` (append, don't replace anything)
- Create: `src/app/api/notify-checkin-guardian/route.ts`

**Interfaces:**
- Produces: `buildGuardianCheckInMessage(input)` and `sendGuardianCheckInNotification({ checkInId }): Promise<{ delivered: boolean }>`, appended to `src/lib/notifications.ts` — this is the import Task 12's `scanCheckIn` was already written against.

**Why a new file section, not a rewrite:** `src/lib/notifications.ts` already has `buildGuardianMessage`/`sendGuardianAttendanceNotification`, wired to the still-functional class-attendance flow (`src/actions/attendance.ts` calls it on every session submit). Those stay completely untouched — this task only *adds* their check-in equivalents below them, exactly mirroring the `GuardianNotification`/`CheckInNotification` split from Task 1. A new route (`/api/notify-checkin-guardian`, not the existing `/api/notify-guardian`) keeps the same one-flow-per-route pattern already established.

- [ ] **Step 1: Append the check-in notification function**

Add this to the end of `src/lib/notifications.ts` (after the existing `sendGuardianAttendanceNotification` — do not modify anything above it):

```ts
export function buildGuardianCheckInMessage(input: { studentName: string; venueName: string; checkInDate: string }): string {
  return `${input.studentName} has checked in at ${input.venueName} on ${formatDateForDisplay(input.checkInDate)}.`;
}

// The check-in flow's equivalent of sendGuardianAttendanceNotification,
// above — same simulated-send reasoning, writing to CheckInNotification
// instead of GuardianNotification since this is triggered by a CheckIn, not
// a class attendance session. Only ever called for isMapStudent students
// (see the call site in src/actions/checkins.ts), and Student.emergencyContactPhone
// is a required field, so "delivered" is always true here — unlike the
// class-attendance version, there's no optional-phone branch to handle.
export async function sendGuardianCheckInNotification(input: { checkInId: string }): Promise<{ delivered: boolean }> {
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: input.checkInId },
    include: { student: true, venue: true },
  });
  if (!checkIn) throw new Error("Check-in not found.");

  const message = buildGuardianCheckInMessage({
    studentName: checkIn.student.name,
    venueName: checkIn.venue.name,
    checkInDate: checkIn.checkInDate,
  });

  console.log(`[guardian-notify] SMS to ${checkIn.student.emergencyContactPhone}: ${message}`);

  await prisma.checkInNotification.create({
    data: {
      studentId: checkIn.studentId,
      checkInId: checkIn.id,
      recipientPhone: checkIn.student.emergencyContactPhone,
      delivered: true,
      message,
    },
  });

  return { delivered: true };
}
```

`prisma` and `formatDateForDisplay` are already imported at the top of this file for the existing function — no new imports needed.

- [ ] **Step 2: Create the check-in notification route**

Create `src/app/api/notify-checkin-guardian/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCoach } from "@/lib/session";
import { sendGuardianCheckInNotification } from "@/lib/notifications";

// Mirrors /api/notify-guardian's shape for the check-in flow — the same
// logic scanCheckIn already calls directly (no self-HTTP round trip); this
// route exists so it's also reachable as its own API, same reasoning as the
// original route's own comment.
const notifyCheckInGuardianSchema = z.object({
  checkInId: z.string().min(1),
});

export async function POST(request: Request) {
  const coach = await requireCoach().catch(() => null);
  if (!coach) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = notifyCheckInGuardianSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    const result = await sendGuardianCheckInNotification(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Notification failed." }, { status: 400 });
  }
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

Expected: the `sendGuardianCheckInNotification` import error in `src/actions/checkins.ts` (from Task 12's Step 5) is now gone. No other errors introduced.

```bash
npm run dev
```

Sign in as `farhan@map.test` (open shift, seeded). At the placeholder Home text from Task 9, there's no scan UI yet — instead, verify this task directly: open a second terminal and run

```bash
curl -X POST http://localhost:3000/api/notify-checkin-guardian \
  -H "Content-Type: application/json" \
  --cookie "<paste your session cookie from the browser's dev tools>" \
  -d '{"checkInId":"<a real CheckIn id from `npx prisma studio`>"}'
```

Expected: `{"delivered":true}` and a `[guardian-notify] SMS to ...` line in the `npm run dev` terminal. (Full end-to-end verification — scanning a QR and seeing this fire automatically — happens in Task 15, once the scanner exists. This step only confirms the function and route work in isolation.) Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add src/lib/notifications.ts src/app/api/notify-checkin-guardian/route.ts
git commit -m "$(cat <<'EOF'
feat: add guardian notification for check-ins

Adds sendGuardianCheckInNotification alongside the existing class-
attendance version rather than replacing it, since that one is still
wired to the untouched legacy attendance flow.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 14: Scanner component

**Files:**
- Create: `src/components/checkin/scanner.tsx`
- Create: `public/qr-scanner-worker.min.js` (copied from the installed package)
- Modify: `package.json` (add `qr-scanner`)

**Interfaces:**
- Produces: `Scanner({ onDecode, active }): JSX.Element` — Task 15's `CheckInDesk` renders this.

**Why `qr-scanner` and why the worker file is copied into `public/`:** the native `BarcodeDetector` Web API doesn't exist on iOS Safari, and coaches will be on a mix of iOS/Android phones — `qr-scanner` (camera decode via a background Worker) works everywhere. Its worker script needs to be reachable as a static URL at runtime; pointing `QrScanner.WORKER_PATH` at a copy in `public/` is the documented, bundler-agnostic way to wire this up and avoids any Turbopack-specific import-suffix guesswork.

- [ ] **Step 1: Install qr-scanner**

```bash
npm install qr-scanner
```

- [ ] **Step 2: Copy the worker script into public/**

```bash
cp node_modules/qr-scanner/qr-scanner-worker.min.js public/qr-scanner-worker.min.js
```

- [ ] **Step 3: Create the Scanner component**

Create `src/components/checkin/scanner.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

export function Scanner({ onDecode, active }: { onDecode: (code: string) => void; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    const scanner = new QrScanner(videoRef.current, (result) => onDecode(result.data), {
      highlightScanRegion: true,
      highlightCodeOutline: true,
      preferredCamera: "environment",
    });

    scanner.start().catch(() => {
      setError("Couldn't access the camera — check permissions, or use the code field below.");
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [active, onDecode]);

  if (error) {
    return <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{error}</p>;
  }

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      className="aspect-square w-full rounded-2xl bg-black object-cover"
    />
  );
}
```

**Important — the `onDecode` prop must be stable across renders.** This effect re-runs (stopping and restarting the camera, causing a visible flicker) every time `onDecode` is a new function reference. Task 15's `CheckInDesk` must wrap the function it passes as `onDecode` in `useCallback` — flagged here so it isn't missed when writing that task.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors in the new file. It isn't rendered by any page yet, so full camera behavior can't be checked until Task 15 — this step only confirms it compiles.

- [ ] **Step 5: Commit**

```bash
git add src/components/checkin/scanner.tsx public/qr-scanner-worker.min.js package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: add QR scanner component

Camera-based QR decode via qr-scanner (works on iOS Safari, unlike the
native BarcodeDetector API). Worker script copied into public/ so
WORKER_PATH resolves the same way regardless of bundler. Not yet
rendered by any page.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 15: CheckInDesk wired into Home + register-new-visitor page

**Files:**
- Create: `src/components/checkin/check-in-desk.tsx`
- Modify: `src/app/(app)/page.tsx` (replace Task 9's placeholder)
- Create: `src/app/(app)/checkin/register/page.tsx`

**Interfaces:**
- Consumes: `Scanner` (Task 14), `scanCheckIn`/`ScanResult` (Task 12), `clockOut` (Task 9), `getCheckInCountForShift` (Task 12), `registerAndCheckInStudent` (Task 12), `RegistrationFlow` (Task 6), `getOpenShiftForCoach` (Task 8).

This is the task that makes the check-in loop real end-to-end: register → get a QR → coach scans it → guardian notified (if MAP) → count goes up.

- [ ] **Step 1: Create CheckInDesk**

Create `src/components/checkin/check-in-desk.tsx`:

```tsx
"use client";

import { useCallback, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { scanCheckIn } from "@/actions/checkins";
import { clockOut } from "@/actions/coach-shifts";
import { Scanner } from "@/components/checkin/scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Shift = { id: string; venue: { name: string }; clockInAt: Date };

export function CheckInDesk({ shift, initialCount }: { shift: Shift; initialCount: number }) {
  const [scanning, setScanning] = useState(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [count, setCount] = useState(initialCount);
  const [manualCode, setManualCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isClockingOut, startClockOutTransition] = useTransition();

  // Stable across renders (empty dep array) — Scanner's effect re-inits the
  // camera every time this reference changes, which would otherwise flicker
  // on every state update this component makes.
  const handleCode = useCallback((code: string) => {
    setScanning(false);
    startTransition(async () => {
      const result = await scanCheckIn({ code });
      if (result.outcome === "checked_in") {
        setLastMessage(`${result.studentName} checked in.`);
        setCount((c) => c + 1);
      } else if (result.outcome === "already_checked_in") {
        setLastMessage(`${result.studentName} already checked in today.`);
      } else if (result.outcome === "not_found") {
        setLastMessage("Code not recognized — not registered yet.");
      } else {
        toast.error(result.error);
        setScanning(true);
      }
    });
  }, []);

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    setManualCode("");
    handleCode(code);
  }

  function handleClockOut() {
    startClockOutTransition(async () => {
      const result = await clockOut({ shiftId: shift.id });
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-gradient-to-r from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white">
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Clocked in at {shift.venue.name}</p>
            <p className="text-xs opacity-80">
              since {new Date(shift.clockInAt).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            onClick={handleClockOut}
            disabled={isClockingOut}
          >
            Clock Out
          </Button>
        </CardContent>
      </Card>

      {scanning ? (
        <Scanner onDecode={handleCode} active={scanning} />
      ) : (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm font-medium">{isPending ? "Checking…" : lastMessage}</p>
            <Button
              onClick={() => {
                setLastMessage(null);
                setScanning(true);
              }}
            >
              Scan next
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or type code, e.g. GHW7UD"
          autoCapitalize="characters"
          className="text-center uppercase tracking-[0.2em]"
        />
        <Button type="submit" variant="outline">
          Check in
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{count} checked in this shift</span>
        <Link href="/checkin/register" className="underline">
          Register new visitor
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the Home page placeholder**

Replace the entire contents of `src/app/(app)/page.tsx` with:

```tsx
import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach } from "@/data/coach-shifts";
import { getCheckInCountForShift } from "@/data/checkins";
import { getAllVenues } from "@/data/venues";
import { ClockInForm } from "@/components/checkin/clock-in-form";
import { CheckInDesk } from "@/components/checkin/check-in-desk";

export default async function DashboardPage() {
  const coach = await requireCoach();
  const openShift = await getOpenShiftForCoach(coach.id);

  if (!openShift) {
    const venues = await getAllVenues();
    return <ClockInForm venues={venues} />;
  }

  const count = await getCheckInCountForShift(openShift.id);
  return <CheckInDesk shift={openShift} initialCount={count} />;
}
```

- [ ] **Step 3: Create the register-new-visitor page**

Create `src/app/(app)/checkin/register/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCoach } from "@/lib/session";
import { getOpenShiftForCoach } from "@/data/coach-shifts";
import { registerAndCheckInStudent } from "@/actions/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buttonVariants } from "@/components/ui/button";

export default async function RegisterVisitorPage() {
  const coach = await requireCoach();
  const openShift = await getOpenShiftForCoach(coach.id);
  if (!openShift) redirect("/");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Register new visitor</h1>
        <p className="text-sm text-muted-foreground">Checks them in immediately at {openShift.venue.name}.</p>
      </div>
      <RegistrationFlow
        onSubmitAction={registerAndCheckInStudent}
        footer={() => (
          <Link href="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to check-in desk
          </Link>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: `src/app/(app)/page.tsx` no longer appears in the error list; no errors in the two new files.

```bash
npm run dev
```

At a mobile viewport in a desktop browser, camera access may be blocked or absent — that's expected; the point of this check is the manual code fallback and the full check-in loop, not the camera itself (real camera scanning needs a phone hitting the dev server over LAN, worth trying once if convenient but not required to consider this task done). Sign in as `farhan@map.test` (open shift, seeded): confirm the check-in desk renders with a "4 checked in this shift" count already showing (the seeded s1-s4 check-ins). If the camera fails to start, confirm the graceful fallback message appears instead of a crash. Type a real student's login code (e.g. `s5`'s code, printed by the seed script's console output) into the manual field, submit — confirm the count increments to 5 and the `npm run dev` terminal logs a `[guardian-notify]` line (that student is a MAP student). Try a code from a **non-MAP** student (`s15` or `s16`) — confirm they check in with no guardian-notify log line. Try an already-checked-in code (`s1`) — confirm the friendly "already checked in" message, not an error. Try a nonsense code — confirm "not registered" and that clicking through reaches `/checkin/register`, where submitting the full form both creates the student and shows their QR. Finally hit **Clock Out** and confirm the screen switches to the Clock In form. Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add src/components/checkin/check-in-desk.tsx "src/app/(app)/page.tsx" "src/app/(app)/checkin/register/page.tsx"
git commit -m "$(cat <<'EOF'
feat: wire up the check-in desk

Home now shows the full scan-or-type check-in loop once clocked in,
with a live count, guardian notifications for MAP students, and a
register-new-visitor path for walk-ins without their own QR yet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 16: Student profile rework (canAccessStudent removal, check-in history, QR)

**Files:**
- Modify: `src/lib/authorization.ts` (remove `canAccessStudent`)
- Modify: `src/data/students.ts` (rewrite both exports)
- Modify: `src/components/students/student-profile-content.tsx` (full rewrite)
- Modify: `src/app/(app)/students/[studentId]/page.tsx`
- `src/app/(student)/student/page.tsx` — **no change**, confirmed below

**Interfaces:**
- Consumes: `generateQrDataUrl` (Task 4), `QrDisplay` (Task 6), `EMERGENCY_CONTACT_LABELS` (Task 1, Step 9).
- Produces: `getStudentProfile(studentId)` now returns `{ student, checkIns }` instead of `{ student, records }` — this is a breaking shape change consumed by both `/students/[id]` and `/student`, both updated in this task.

This is the one place `canAccessStudent` mattered — since it always returned `true` once past `requireCoach()` (per the design spec's rule that any signed-in coach may view a specific student's profile once they've resolved who it is), keeping a function that always returns `true` would read as a security check that isn't one. Deleting it and the gate that called it is more honest than keeping a vacuous guard. `canAccessClass` is untouched — it's still real, still used by the legacy class-attendance flow.

- [ ] **Step 1: Remove canAccessStudent**

In `src/lib/authorization.ts`, delete the entire `canAccessStudent` function, leaving `canAccessClass` and its imports exactly as they are. The file should end with just:

```ts
import { prisma } from "@/lib/prisma";

// An admin coach can access any class; a regular coach only classes
// they're assigned to. (There used to be a matching canAccessStudent here,
// gating student profiles by shared class enrollment — removed because any
// signed-in coach may now view a specific student's profile once they've
// resolved who it is via a scan or a fresh registration. /students, the
// browsable list, is what actually stays admin-only; see its page.)

export async function canAccessClass(coachId: string, classId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  const assignment = await prisma.classAssignment.findUnique({
    where: { coachId_classId: { coachId, classId } },
  });
  return !!assignment;
}
```

- [ ] **Step 2: Rewrite the student data queries**

Replace the entire contents of `src/data/students.ts` with:

```ts
import { prisma } from "@/lib/prisma";

export async function getStudentProfile(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  const checkIns = await prisma.checkIn.findMany({
    where: { studentId },
    include: { venue: true },
    orderBy: { checkInDate: "desc" },
  });

  return { student, checkIns };
}

export async function getStudentsForCoach(coachId: string, isAdmin: boolean) {
  if (isAdmin) {
    return prisma.student.findMany({ orderBy: { name: "asc" } });
  }

  return prisma.student.findMany({
    where: { enrollments: { some: { status: "ACTIVE", class: { assignments: { some: { coachId } } } } } },
    orderBy: { name: "asc" },
  });
}
```

`EMERGENCY_CONTACT_LABELS` already exists in `src/lib/format.ts` as of Task 1, Step 9 (added there alongside the JC1/JC2 level labels, specifically so this task and Task 6 could share one copy instead of each defining their own) — nothing further to add here.

- [ ] **Step 3: Rewrite StudentProfileContent**

Replace the entire contents of `src/components/students/student-profile-content.tsx` with:

```tsx
import { generateQrDataUrl } from "@/lib/qr";
import { getInitials, formatLevel, EMERGENCY_CONTACT_LABELS } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrDisplay } from "@/components/registration/qr-display";
import type { getStudentProfile } from "@/data/students";

type StudentProfileData = NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>;

// Shared between the coach-facing student profile (/students/[id]) and the
// student's own self-view (/student) — same data, same read-only rendering.
export async function StudentProfileContent({ student, checkIns }: StudentProfileData) {
  const qrDataUrl = await generateQrDataUrl(student.loginCode);

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

      <QrDisplay name={student.name} loginCode={student.loginCode} qrDataUrl={qrDataUrl} />

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

This drops `AttendanceFlags`, the pooled/per-class attendance-percentage cards, and the enrollment list entirely — none of them mean anything without a fixed class schedule. `src/lib/attendance-stats.ts` and `src/components/students/attendance-flags.tsx` are untouched and simply no longer imported here (see Global Constraints).

- [ ] **Step 4: Simplify the coach-facing student profile page**

Replace the entire contents of `src/app/(app)/students/[studentId]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/session";
import { getStudentProfile } from "@/data/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";
import { LoginCodeCard } from "@/components/students/login-code-card";

export default async function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const coach = await requireCoach();

  const data = await getStudentProfile(studentId);
  if (!data) notFound();

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

This drops the `canAccessStudent` check/redirect (Step 1 removed the function it called), the `EnrollInClassForm`/`DropEnrollmentButton` rendering, and `getAllClassesForSelect` import — none apply anymore. `requireCoach()` alone is now the entire gate: any signed-in coach reaching this URL sees the profile.

- [ ] **Step 5: Confirm the student portal page needs no change**

Open `src/app/(student)/student/page.tsx` and confirm it still reads exactly:

```tsx
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/session";
import { getStudentProfile } from "@/data/students";
import { StudentProfileContent } from "@/components/students/student-profile-content";

export default async function StudentDashboardPage() {
  const student = await requireStudent();
  const data = await getStudentProfile(student.id);
  if (!data) redirect("/login");

  return <StudentProfileContent {...data} />;
}
```

It already spreads `{...data}` into `StudentProfileContent` with no other prop wiring, so Step 2 and Step 4's shape change (`{ student, checkIns }`) flows through with zero edits needed here. Leave the file untouched — this step is a confirmation, not a change.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
```

Expected: none of `src/lib/authorization.ts`, `src/data/students.ts`, `src/lib/format.ts`, `src/components/students/student-profile-content.tsx`, `src/app/(app)/students/[studentId]/page.tsx`, or `src/app/(student)/student/page.tsx` appear in the error list.

```bash
npm run dev
```

Sign in as `admin@map.test`, visit `/students`, open Amir Hafiz bin Zainal's profile (`s1` — checked in today and 7 days ago per the seed). Confirm: his QR renders, contact/emergency-contact cards show real data, "MAP student" badge appears, check-in history shows both dates with correct venues, and the admin-only login-code card sits above it all. Open Farid Danish bin Osman's profile (`s15`, seeded `isMapStudent: false`) and confirm no "MAP student" badge. Then sign in as a student (Student tab at `/login`, use any printed code) and confirm `/student` renders the same content, no login-code card. Stop the dev server after checking.

- [ ] **Step 7: Commit**

```bash
git add src/lib/authorization.ts src/data/students.ts src/components/students/student-profile-content.tsx "src/app/(app)/students/[studentId]/page.tsx"
git commit -m "$(cat <<'EOF'
feat: rework student profile for check-ins instead of class attendance

Drops canAccessStudent (was always true post-pivot, so it read as a
security check that wasn't one) in favor of requireCoach() alone.
StudentProfileContent now shows QR, contact/emergency-contact info,
and check-in history — shared unchanged by /student, which needed no
edits since it already just spreads the data through.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 17: Fix remaining references to removed Student.venueId / Venue.students

**Files:**
- Modify: `src/app/(app)/students/page.tsx`
- Modify: `src/data/classes.ts` (`getAllVenuesWithClassCounts` only)
- Modify: `src/app/(app)/venues/page.tsx`

**Interfaces:** none — this task only fixes compile errors left over from Task 1's schema change. No new exports.

Two call sites still reference the fields Task 1 removed. Everything else that touched `Student.venueId`/`Venue.students` was already handled by Task 16 (`getStudentProfile`/`getStudentsForCoach`) or never referenced them (`/venues/[venueId]` uses `getVenueWithClasses`, which only touches `Venue.classes`/`Class.enrollments` — both untouched — so it's correctly left alone in this plan).

- [ ] **Step 1: Fix the admin students list**

In `src/app/(app)/students/page.tsx`, find:

```tsx
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLevel(student.level)} · {student.venue.name}
                  </p>
                </div>
```

Replace with:

```tsx
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLevel(student.level)} · {student.schoolName}
                  </p>
                </div>
```

- [ ] **Step 2: Fix getAllVenuesWithClassCounts**

In `src/data/classes.ts`, find:

```ts
export async function getAllVenuesWithClassCounts() {
  return prisma.venue.findMany({
    include: { _count: { select: { classes: true, students: true } } },
    orderBy: { name: "asc" },
  });
}
```

Replace with:

```ts
export async function getAllVenuesWithClassCounts() {
  return prisma.venue.findMany({
    include: { _count: { select: { classes: true, checkIns: true } } },
    orderBy: { name: "asc" },
  });
}
```

This function is also used by `src/app/(app)/classes/new/page.tsx`, which only passes its result through to `CreateClassForm` without reading `_count` at all — that caller needs no change.

- [ ] **Step 3: Fix the venues list display**

In `src/app/(app)/venues/page.tsx`, find:

```tsx
                  <p className="mt-2 text-xs text-muted-foreground">
                    {venue._count.classes} classes · {venue._count.students} students
                  </p>
```

Replace with:

```tsx
                  <p className="mt-2 text-xs text-muted-foreground">
                    {venue._count.classes} classes · {venue._count.checkIns} check-ins
                  </p>
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: **zero errors** — this is the first point in the plan where the whole project should type-check cleanly end to end. If anything remains, it means an earlier task's file wasn't updated exactly as written; find it from the error's file path and cross-check that task's steps before touching anything not mentioned in this plan.

```bash
npm run dev
```

Sign in as `admin@map.test`, visit `/students` — confirm every row shows a school name instead of a crash or `undefined`. Visit `/venues` — confirm each card shows "`N` classes · `M` check-ins" with real numbers (Tampines should show a non-zero check-in count from the seed). Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/students/page.tsx" src/data/classes.ts "src/app/(app)/venues/page.tsx"
git commit -m "$(cat <<'EOF'
fix: update remaining Student.venueId/Venue.students references

The admin students list now shows school name instead of a removed
venue relation, and the venues list shows check-in counts instead of
a removed student count. Project now type-checks cleanly end to end.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131haKACXAD5dKE8th7dGUv
EOF
)"
```

---

## Task 18: Final integration pass

**Files:** none created or modified — this task is pure verification.

**Interfaces:** none.

Everything up to this point has been checked task-by-task in isolation. This task walks the complete, real user journeys end to end in one sitting, the way an actual coach and student would experience them, plus the project-wide checks the spec's "Testing approach" section calls for.

- [ ] **Step 1: Full project checks**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero errors from both. If lint flags something in a file this plan touched, fix it in that file directly rather than suppressing the rule.

- [ ] **Step 2: Reset to a clean seeded state**

```bash
npx prisma migrate reset --force
npm run dev
```

- [ ] **Step 3: Walk the student journey, start to finish**

At a mobile viewport (Chrome DevTools device toolbar): visit `/register` signed out, fill in a brand-new student, submit, confirm the purple→pink QR screen appears with a real scannable QR and the plain code beneath it. Sign in at `/login`'s Student tab with that same code, confirm `/student` shows the new profile with "My QR Code," contact info, and an empty check-in history (this student hasn't been scanned in yet). Sign out.

- [ ] **Step 4: Walk the coach journey, start to finish**

Sign in as `admin@map.test` (seeded with no open shift), confirm the Clock In screen appears, pick a venue, clock in, confirm the check-in desk appears with a 0-count. Using the manual code field, check in the student created in Step 3 — confirm the count goes to 1 and (since new registrations default to `isMapStudent: true`) a `[guardian-notify]` line appears in the terminal. Scan/type the same code again — confirm the friendly "already checked in" message, not an error. Clock out, confirm the screen reverts to Clock In.

- [ ] **Step 5: Walk the payroll journey, start to finish**

Still as `admin@map.test`, visit `/coaches/<your own id>` (reachable via the account you're signed in as — admin is also a coach) and confirm the shift you just clocked in Step 4 shows in the shift history as PENDING with correct hours/pay. Visit `/payroll`, confirm the same shift appears in the pending queue, approve it, confirm it disappears from pending and (after adjusting the date range if needed) appears in the pay summary. Download the CSV and open it — confirm it has a header row and one data row matching what you just approved.

- [ ] **Step 6: Confirm the legacy class-based subsystem still works, unlinked**

Nothing in the nav links to it anymore, but visit `/classes/new` directly as `admin@map.test`, create a class, then visit `/classes/<its id>/attendance` — confirm the old Present/Late/Absent attendance-taking UI still renders and functions (it has no students enrolled yet, so this just confirms the page doesn't crash). This proves the non-destructive claim in this plan's Global Constraints is actually true, not just asserted.

- [ ] **Step 7: Confirm access boundaries**

Signed out, visit any route other than `/login` or `/register` (e.g. `/`) — confirm it redirects to `/login`. Visit `/register` — confirm it loads with no redirect. Signed in as a non-admin coach (`farhan@map.test`), visit `/payroll` and `/students` — confirm both redirect away (admin-only). Visit `/students/<any known student id>` as `farhan` — confirm it **does** render (any signed-in coach can view a resolved profile, per Task 16).

- [ ] **Step 8: Stop the dev server; no commit for this task**

This task produces no file changes, so there's nothing to commit. If any step above surfaced a real bug, fix it in the task file where the bug actually lives, re-run that task's own verification, then re-run this task's steps from the top.

---

## Summary

18 tasks: schema + seed + pure functions (1-4) → public/admin registration and QR (5-7) → coach clock-in and shift review (8-10) → admin payroll (11) → check-in scanning, tying registration and shifts together (12-15) → student-facing profile rework (16) → cleanup of everything the schema change broke (17) → full end-to-end walkthrough (18). Each task after the first three stands on the ones before it, so this plan is meant to be executed roughly in order — Task 12's note about Task 13 is the one explicit exception where a later task's function is referenced slightly early.


# MAP Coach Portal

A web app for MENDAKI Achievement Programme (MAP) coaches — replaces the shared Google Sheets
attendance link with one-tap Present/Absent/Late attendance, real student and coach profiles, a
subject/level curriculum guide, and per-class progress tracking.

Built with Next.js 15 (App Router, TypeScript), Prisma + SQLite, Tailwind v4 + shadcn/ui, and
Auth.js (NextAuth v5). Two account types share the login page (a Coach/Student tab at `/login`):
coaches sign in with hashed-password Credentials, students sign in with a short login code their
coach gives them (see "Student portal" below for why).

## Setup

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL to an ABSOLUTE path — see the comment in that file
npx prisma migrate dev   # creates the SQLite db, applies the schema, and seeds it automatically
npm run dev
```

Open http://localhost:3000. If you ever need to re-seed from scratch:

```bash
npx prisma migrate reset --force
```

### Demo logins

All seeded coaches share the password `Coach123!`:

| Email | Role |
|---|---|
| `admin@map.test` | Admin — full access to every venue, class, coach, and student |
| `farhan@map.test` | Coach — teaches P3 Science (Tampines) and Sec3 English (Bedok) |
| `aishah@map.test`, `danial@map.test`, `ain@map.test`, `haziq@map.test`, `nabila@map.test` | Coaches, each assigned to 1–2 classes |

The seed script deliberately leaves **today's attendance session unmarked** for `farhan`'s P3
Science class at Tampines Centre, so logging in as `farhan@map.test` immediately shows a live,
actionable "take attendance" screen — and that same class has a curriculum topic due today, so the
dashboard's "Today: …" hint is visible right away too.

It also seeds a few students with engineered attendance histories so the real MAP policy flags have
something to show: one below the 80% disbursement threshold, one with 4 consecutive unexcused
absences (2 short of removal), one with exactly 6 (removed), and one whose streak was broken by an
excused absence. Open any of them from `/students` to see the flags render.

Every seeded student also has a **student portal login code** (printed at the end of the seed
script's output, or visible to an admin on any student's profile page). Try the "Student" tab at
`/login` with one — e.g. `GHW7UD` for Amir Hafiz bin Zainal.

## Student portal

A second, much narrower account type: students sign in at the same `/login` page (a Coach/Student
tab) with just a short code — no email or password. This is a deliberate design choice, not a
shortcut: MAP serves students from P1 through Sec4, so as young as ~7, for whom "email + password"
is impractical. The code is the entire credential (see the `Student.loginCode` schema comment for
why it's plain text, not hashed, and why there's no per-account lockout counter — the code's own
~1-billion-combination entropy is the defense, appropriate for a **view-only**, already-low-sensitivity
account).

Once signed in, a student reaches `/student` — their own read-only dashboard (their attendance
history, computed percentage, the same MAP policy flags a coach sees, and their curriculum progress)
with no write actions anywhere. It deliberately reuses the exact same data-fetching and stat
computation as the coach-facing student profile page (`StudentProfileContent`, shared between both)
— same numbers, same flags, just a friendlier shell (`src/app/(student)/layout.tsx`) around it.
Role is carried through the JWT session (`role: "coach" | "student"`) and enforced at two levels:
middleware gates "logged in at all," and each route group's layout (`(app)` vs `(student)`) checks
the specific role, redirecting a wrong-role session back to `/login` rather than leaking into the
other portal — verified in both directions (a student session hitting `/venues` or `/`, and a coach
session hitting `/student`, both correctly bounce).

## Features

- **Attendance** (`/classes/[id]/attendance`) — pick a class, tap Present/Absent/Late per student,
  save. Large touch targets, optimistic updates, locks once submitted (tap to reopen and correct).
- **Student profiles** (`/students/[id]`) — attendance history, a computed attendance % and
  consecutive-absence streak per class and pooled overall, live flags for the real MAP policies (80%
  attendance for the funding disbursement, 6 consecutive unexcused absences for removal), and
  per-class curriculum progress.
- **Coach profiles** (`/coaches/[id]`) — classes taught, student count, sessions taken.
- **Curriculum guide** (`/curriculum`) — full real MOE-aligned syllabus coverage: English and Math
  from **P1 through Sec4**, Science from **P3 through Sec4** (Singapore doesn't teach Science before
  P3). 187 topics across 28 subject/level combinations. Each topic has a short overview plus a
  separate, genuinely elaborate **step-by-step teaching guide** (4-8 concrete steps: hook, introduce
  the concept, model a worked example, guided practice, independent practice, the topic's specific
  common error/misconception, and a link to what comes before/after) — expand any topic on its level
  page to see it. See `prisma/curriculum-data/{math,english,science}.ts` for the content and its
  sourcing notes. Open to any coach as a reference, independent of which classes actually exist.
- **Class progress** (`/classes/[id]/progress`) — checklist of that class's curriculum topics,
  mark taught, see what's due today.
- **Student portal** (`/student`) — a student's own read-only view of their attendance and progress,
  signed in with a short login code instead of email/password. See "Student portal" below.
- Admin-only: create venues, classes, coach accounts, register students, assign coaches to classes,
  manage a student's enrollments (up to 3 active classes, matching the real MAP rule), and view/
  regenerate a student's login code (on their profile page).

## Architecture notes

- `src/data/` — read-only Prisma queries, called directly from Server Components.
- `src/actions/` — `"use server"` mutations, each starting with `requireCoach()`/`requireAdmin()`,
  validating input with Zod, and checking `canAccessClass`/`canAccessStudent` before touching data
  outside the caller's own classes.
- `src/lib/attendance-stats.ts` — pure functions computing the attendance % and consecutive-absence
  streak; see its comments for the exact (deliberately-stated) rules around excused absences.
- `src/auth.config.ts` / `src/auth.ts` / `src/middleware.ts` — split because `middleware.ts` runs on
  the Edge runtime, which Prisma/bcrypt can't; only `auth.config.ts` (callbacks only) is safe to
  import there.
- Full design rationale, schema, and risk notes: see the implementation plan this was built from.

## Known limitations (by design, this pass)

No parent-facing portal, no payment/disbursement automation, no notifications, no real photo upload
(initials-based avatars only), no multi-language support, no offline mode, no curriculum-editing UI
(seed-managed reference data). The color palette and the app mark (`src/components/app-logo.tsx`, an
icon-in-a-badge, not a wordmark) are an original placeholder — deliberately not an attempt at
MENDAKI's actual logo or brand identity. This is an unofficial student project; using the real
organisation's trademark here would misleadingly imply official endorsement. Swap in a real,
approved MENDAKI asset if this is ever built with the organisation directly.

**On the curriculum content specifically**: the official MOE syllabus PDFs weren't machine-readable
during research (binary/compression issues in every fetch attempt), so the topic lists and
descriptions were built from cross-checked secondary sources — school curriculum briefings, SEAB
syllabus structure pages, and multiple independent tuition/assessment-site breakdowns — not a single
authoritative document. Math covers E-Math only (Additional Math is a separate elective, out of
scope). Upper Secondary Science (Sec3-4) is framed as Combined Science, since this app has one
`SCIENCE` subject rather than separate Physics/Chemistry/Biology. Exact Sec3-vs-Sec4 splits are a
reasonable reconstruction of dependency order rather than a citation of an exact MOE year-by-year
mandate, since schools have real flexibility in how they sequence upper-secondary content. Treat this
as a solid teaching reference, not a verbatim reproduction of the official syllabus documents.

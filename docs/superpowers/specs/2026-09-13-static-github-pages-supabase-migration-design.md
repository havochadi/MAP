# Static Frontend on GitHub Pages, Supabase-Only Backend — Design Spec

**Status:** Follows the SQLite→Postgres/Supabase migration (see the "Migration" and "Complete
Postgres cutover" commits). That work moved the *database* to Supabase but kept the app itself as
a live Next.js server on Render. This spec removes the server entirely: the app becomes a fully
static export hosted on GitHub Pages, and Supabase (Postgres + Auth + Edge Functions) becomes the
only other service involved. No Render, no Vercel, no other host.

## Goal

Same functionality, no server. Every page, every coach/admin/student action, and the app's data
keep working exactly as they do today, but the compute that currently runs in Next.js server
components, Server Actions, middleware, and API routes moves to one of two places:

- **The browser**, via `@supabase/supabase-js` talking directly to Postgres, secured by Row Level
  Security (RLS) policies that replace today's `requireAdmin()`/`requireCoach()`/`canAccessClass()`
  TypeScript checks.
- **Supabase Edge Functions**, for the small number of operations that genuinely cannot run
  client-side because they need a secret the browser must never see (a password hash comparison,
  the service-role key needed to create a new `auth.users` row).

Plus one new feature requested alongside this migration: a real, visible **Notifications** page
(today, guardian-contact "sends" are a `console.log` and an invisible audit row — this makes that
audit trail an actual page in the app, still with no real SMS/email provider, matching this
project's existing "no extra infra for problems that haven't occurred" posture).

## Non-goals

- **Real SMS/email delivery.** Explicitly rejected — would require a paid/third-party messaging
  provider (Twilio, Resend, etc.), breaking the Supabase-and-GitHub-only constraint that's the
  entire point of this migration. The notification record becomes real and visible; nothing is
  actually texted or emailed.
- **A UI redesign.** Every page keeps its current design and layout. This is a data-access and
  auth migration, not a visual one.
- **Switching frameworks.** Next.js stays, in static-export mode. See Approach discussion (already
  agreed in chat) for why a Vite/React rewrite was rejected.
- **Preserving server-side route middleware.** `src/middleware.ts` cannot exist in a statically
  hosted app. Route gating becomes a client-side redirect-if-no-session check — cosmetic UX, not
  a security boundary. RLS is the only real security boundary from this point on.
- **Rate-limiting the public registration endpoint.** Matches existing project posture (see
  `2026-09-05-qr-checkin-and-shift-payroll-design.md`, Non-goals) — still intentionally open.
- **Migrating real (non-seed) user data.** There is no production data yet; the current Coach/
  Student rows are all seed data. If that changes before this ships, revisit the account-migration
  step below.

## Architecture

```
Browser (static HTML/JS/CSS from GitHub Pages)
  │
  ├─ @supabase/supabase-js ──► Supabase Postgres (RLS-enforced reads/writes)
  │                             — every src/actions/*.ts function becomes a
  │                               plain client-side function here
  │
  ├─ supabase.auth ──────────► Supabase Auth (session issuance/refresh,
  │                             signOut, getSession)
  │
  └─ supabase.functions.invoke ► 4 Edge Functions (service-role secrets live
                                  only here, never in the browser bundle):
                                    - coach-login
                                    - student-login
                                    - register-student
                                    - admin-create-coach

GitHub Actions (on push to main): npm ci && npm run build (static export)
                                   → actions/deploy-pages
```

Prisma's role shrinks to schema-authoring and migrations only: `prisma migrate deploy` still runs
(from a developer machine, against Supabase) whenever the schema changes. `@prisma/client` is
removed from the app bundle entirely — it's a Node-only library and cannot run in a browser, so
this isn't a design choice, it's forced.

## Identity & Auth

**Two new columns**, not a primary-key swap — `Coach.id`/`Student.id` stay as-is (dozens of
existing foreign keys reference them):

```prisma
model Coach {
  // ...existing fields...
  authUserId String? @unique // Supabase auth.users.id (UUID), set once linked
}

model Student {
  // ...existing fields...
  authUserId String? @unique // Supabase auth.users.id (UUID), set once linked
}
```

`Coach.passwordHash` is dropped once Supabase Auth owns the credential — it becomes the single
source of truth for passwords, hashed internally by GoTrue, never touched by app code again.
`failedLoginAttempts`/`lockedUntil` stay on `Coach`, repurposed as bookkeeping for the
`coach-login` function below (unrelated to what Supabase Auth itself does internally).

`isAdmin` and `role` (`"coach" | "student"`) get attached to every session as **custom JWT
claims**, set via a Supabase Auth Hook (a Postgres function invoked at token-issuance time that
reads the linked `Coach`/`Student` row once and stamps the claim onto the JWT). RLS policies then
read `auth.jwt() -> 'isAdmin'` directly — no per-policy subquery back to the `Coach` table.

### Edge Function: `coach-login`

Input: `{ email, password }`. Logic: look up `Coach` by email → if `lockedUntil` is in the future,
reject → call Supabase Auth's password verification (via the admin client, using the service-role
key, which only this function holds) → on failure, increment `failedLoginAttempts`, set
`lockedUntil` if it hits 5 → on success, reset both counters to zero and return a real Supabase
session (access + refresh token) for that coach's linked `auth.users` identity. This is a
byte-for-byte behavioral match for today's `authorize()` callback in `src/auth.ts`.

### Edge Function: `student-login`

Input: `{ code }`. Logic: look up `Student` by `loginCode` (case-normalized, matching today) →
reject if missing or `status !== "ACTIVE"` → mint and return a session for that student's linked
identity. Matches today's student Credentials provider exactly.

### Edge Function: `register-student`

Input: the registration form payload (unauthenticated — callable with no session, matching
`registerStudent`'s deliberate public reachability from the QR-linked `/register` page). Logic:
validate, generate a unique `loginCode` (same collision-checked generation as today), insert the
`Student` row, return `{ studentId, loginCode }`. Kept as a function rather than an open RLS
insert policy specifically because an anonymous, unauthenticated write directly into a real table
is a much wider and harder-to-reason-about surface than one narrow, single-purpose endpoint — the
validation and uniqueness logic stay exactly where they are today, just moved from a Server Action
into a Function.

The coach-assisted variant, `registerAndCheckInStudent`, does not need this treatment — the caller
is already an authenticated coach with an open shift, so it becomes a normal RLS-protected
sequence of client calls (create `Student` → create `CheckIn` → create `CheckInNotification`).
Recommend wrapping those three inserts in a single Postgres function (`SECURITY INVOKER`, called
via `supabase.rpc(...)`) rather than three sequential client calls, so a mid-sequence failure can't
leave a `Student` row with no matching `CheckIn`.

### Edge Function: `admin-create-coach`

Input: new coach's `{ name, email, password, phone, isAdmin }`, callable only by a caller whose JWT
already carries `isAdmin: true` (checked first thing inside the function). Logic: create the
`auth.users` entry via the admin client (service-role key), then insert the `Coach` profile row
linked via `authUserId`. This one exists purely because creating a new login requires the
service-role key — nothing about it is behaviorally different from today's `createCoach`.

### Account provisioning for existing seed data

The 7 seeded coaches and ~16 seeded students currently have Prisma-only credentials (a bcrypt hash,
a plaintext login code). A one-off script (not part of the app, run once against Supabase) creates
the matching `auth.users` entries via the admin API for each — coaches keep their existing demo
password (`Coach123!`), students need no `auth.users` password at all (their "credential" is only
ever exchanged through `student-login`, so a random unusable password can be set on their linked
auth identity). Then backfill `authUserId` on each `Coach`/`Student` row.

## Data access layer

Every function in `src/actions/{attendance,checkins,classes,coach-shifts,coaches,registration,
students,venues}.ts` is rewritten as a plain client-side function calling `supabase.from(...)`
instead of `prisma.*`. `"use server"` and `revalidatePath()` disappear — there's no server cache to
revalidate; a mutation's caller re-fetches (or optimistically updates local state) instead. The
four files under `src/app/api/` (`notify-guardian`, `notify-checkin-guardian`, `payroll/export`,
`auth/[...nextauth]`) are deleted outright: the first two become plain client-side inserts (no
secret involved, per the notifications research below), the CSV export becomes a client-side
`Blob`+`<a download>` built from an already-RLS-filtered query, and NextAuth's route is replaced by
the Edge Functions above.

## Row Level Security — policy per table

`is_admin()` below means "the caller's JWT has the `isAdmin` claim set to `true`" (admins always
bypass every policy). All policies assume an authenticated Supabase session unless marked
"(public)".

| Table | Read | Write |
|---|---|---|
| `Venue` | any authenticated user | admin only |
| `Class` | any authenticated user | admin only |
| `CurriculumTopic` | any authenticated user | admin only (no UI mutates this today — seeded only) |
| `Coach` | own row; admin all. Non-admin coaches also need `name`/`isAdmin` of *other* coaches for display (e.g. "approved by Farhan") — expose via a narrow `coach_public` view (id, name, isAdmin only), not the base table, so `passwordHash`/`email`/`phone`/lockout columns never leak sideways | admin only, except a coach may update their own non-privileged fields (none currently exposed to self-edit in the UI — verify against `/coaches/[coachId]` during implementation) |
| `Student` | admin; a coach assigned (via `ClassAssignment`→`Enrollment`) to a class that student is enrolled in; the student's own row | INSERT via `register-student`/`admin`-driven RPC only (no open policy — see Edge Functions); UPDATE (status, login-code regen) admin only |
| `Enrollment` | admin; the assigned coach (via `ClassAssignment` on the same class); the student's own enrollments | admin only |
| `ClassAssignment` | admin; the coach's own assignments | admin only |
| `AttendanceSession` | admin; coach assigned to that class | admin; coach assigned to that class |
| `AttendanceRecord` | admin; coach assigned to that record's session's class | admin; coach assigned to that class |
| `GuardianNotification` | admin; coach assigned to that class (legacy class-attendance flow, still live code — not removed by this migration) | created alongside `AttendanceRecord` writes, same access |
| `CheckIn` | admin; the coach via their shift (`coachShift.coachId`); the student's own check-ins | insert by a coach with a currently-OPEN `CoachShift` only |
| `CheckInNotification` | admin; same coach/student rule as `CheckIn` (join through it) | created alongside `CheckIn` writes, same access |
| `CoachShift` | admin (all — payroll); coach's own shifts only | coach can INSERT/UPDATE **own** shift while not yet `APPROVED`/`REJECTED` (clock in/out, edit); only admin can set `status` to `APPROVED`/`REJECTED`, matching `approveShift`/`rejectShift`/`reopenShift` being admin-only today |
| `ClassProgress` | admin; coach assigned to that class | admin; coach assigned to that class (verify against whatever currently writes this — no dedicated action file was found for it; treat as same pattern as `AttendanceSession` pending confirmation during implementation) |

This table is the highest-risk artifact in this spec. Two things about it are call-outs, not
just rows:

1. **Student access is tightened, not preserved as-is.** Today, any signed-in coach can open any
   specific student's profile — the code comment explains this relied on the *server* only ever
   handing a coach a profile after they'd resolved it via a scan or registration. RLS can't
   reproduce "how you got here," only "which rows are visible," so an unrestricted read policy
   would let any coach enumerate the entire student list/PII directly, bypassing the admin-only
   `/students` page. **Already discussed and agreed in chat:** tightened to admin + assigned
   coaches only.
2. **Column-level sensitivity on `Coach`** needs a view, not a table-wide policy, since Postgres
   RLS is row-scoped, not column-scoped, and `passwordHash` (soon removed) / `email` / lockout
   columns must never be visible to a coach looking up a colleague's name.

## Notifications (new feature)

A `/notifications` page, admin-visible (and coach-visible scoped to their own venue/students,
matching the RLS row above), listing `CheckInNotification` rows: student name, venue, timestamp,
`delivered`. `GuardianNotification` (the old class-attendance flow) is **not** surfaced here —
it's already marked "unused going forward" in the schema, and resurfacing a deprecated flow in a
new feature would be a step backwards. If both are wanted, that's a small addition to the same
page later.

## Static export & deployment

`next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/MAP",
};
```

`.github/workflows/deploy.yml`: on push to `main` — `npm ci`, `npm run build` (runs the static
export; no `prisma migrate deploy` step here since there's no persistent boot process to gate —
schema migrations run separately, from a developer machine, when the schema changes), then
`actions/upload-pages-artifact` + `actions/deploy-pages`. GitHub Pages enabled once, in repo
Settings → Pages → Source: GitHub Actions. No dashboard env-var step like Render/Vercel needed —
the only "secrets" the static bundle holds are the Supabase URL and anon key, both meant to be
public (RLS is what makes the anon key safe to ship).

## What gets removed entirely

`src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts`,
`src/app/api/**`, the `next-auth` and `bcryptjs` dependencies, `@prisma/client` as a runtime
dependency (schema/migrate-only), and `Coach.passwordHash`.

## Testing strategy

RLS is now the entire security boundary, so beyond normal feature testing, the implementation plan
needs explicit **negative-path** tests per table above: signed in as Coach A, confirm every
Coach-B-only row is unreadable/unwritable; signed in as a non-assigned coach, confirm an assigned
class's data is invisible; signed in as a student, confirm only their own rows are visible. These
are new tests, not a port of existing ones — today's tests (if any) exercise TypeScript
authorization functions that won't exist anymore.

## Open items to confirm during implementation (not blocking this spec)

- Exact self-edit permissions on `Coach` (whether a coach can update their own phone number, etc.)
  — verify against `/coaches/[coachId]` page behavior.
- What currently writes `ClassProgress` — no dedicated server action was found; locate it before
  writing that table's policy.

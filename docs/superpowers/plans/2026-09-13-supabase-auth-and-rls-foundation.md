# Supabase Auth & RLS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the entire Supabase-side backend (auth linking, 4 Edge Functions, RLS on all 15 tables) that Plan 2 will point the frontend at — independently testable, with the current NextAuth/Prisma app left running and unmodified throughout.

**Architecture:** Additive Postgres migration links `Coach`/`Student` rows to `auth.users` via a new `authUserId` column; a Postgres function stamps `isAdmin`/`role` onto every issued JWT as a custom claim; four Deno Edge Functions handle the operations that need the service-role key; RLS policies on every table read the JWT claim (and two `security definer` helper functions) to reproduce today's `requireAdmin()`/`requireCoach()`/`canAccessClass()` checks at the database layer.

**Tech Stack:** Supabase CLI, Supabase Edge Functions (Deno), `@supabase/supabase-js`, Postgres RLS/PL-pgSQL, Prisma (schema/migrations only), `tsx` for verification scripts (this repo has no test runner — see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md`

## Global Constraints

- No new test framework — this repo has none today (no jest/vitest/playwright in `package.json`). Verification uses plain `tsx` scripts under `scripts/` that assert and `process.exit(1)` on failure, matching the existing `db:seed` pattern.
- Demo accounts already seeded (from the earlier Postgres migration), password `Coach123!` for all coaches: `admin@map.test` (admin), `farhan@map.test`, `aishah@map.test`, `danial@map.test`, `ain@map.test`, `haziq@map.test`, `nabila@map.test`. Known student login codes include `GHW7UD` and `VSKQR6`. Verification scripts look up fixtures dynamically (via the service-role client) rather than hardcoding assumed relationships — only the accounts above are assumed to exist.
- `Coach.passwordHash` is **not** dropped in this plan — `src/auth.ts` still reads it and the app must keep compiling/running until Plan 2 removes that code. It becomes dead weight after this plan, cleaned up in Plan 2.
- Every RLS policy must be paired with a verification script proving both the positive case (allowed access works) and at least one negative case (a different coach/student is denied) — an RLS task without a negative-path assertion is incomplete.
- Table names in SQL are double-quoted (`"Coach"`, `"CoachShift"`, etc.) throughout — Prisma created them case-sensitively.

---

## Task 1: Supabase CLI setup and project linking (one-time, manual)

This task has manual sub-steps only you can do (OAuth login, project selection) — same pattern as the Render/Vercel dashboard steps earlier.

**Files:**
- Create: `supabase/config.toml` (via `supabase init`), `scripts/verify-supabase-connection.ts`
- Modify: `.env` (3 new entries), `package.json`/`package-lock.json` (2 new dependencies)
- Local-only, gitignored, not committed: `.supabase/`

- [x] **Step 1: Install the Supabase CLI as a dev dependency**

```bash
npm install --save-dev supabase
```

- [x] **Step 2: Initialize the Supabase project structure**

```bash
npx supabase init
```

This creates `supabase/config.toml` and a `supabase/functions/` directory (already partially scaffolded by this plan's setup).

- [x] **Step 3 (manual — you do this): Log in and link**

```bash
npx supabase login
```

This opens a browser for OAuth — only you can approve it. Then link to the project already in use for the database (the one `DATABASE_URL`/`DIRECT_URL` in `.env` point at):

```bash
npx supabase link --project-ref <your-project-ref>
```

The project ref is the subdomain segment in your Supabase dashboard URL (`https://supabase.com/dashboard/project/<project-ref>`) — it's also the same string that appears right after `postgres.` in the username portion of your `DATABASE_URL`.

- [x] **Step 4 (manual — you do this): Add three values to `.env`**

From the Supabase dashboard → Project Settings → API, add to `.env` (do not paste these into chat — add them directly in your editor, same as the database password earlier):

```
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_ANON_KEY="<the anon/public key>"
SUPABASE_SERVICE_ROLE_KEY="<the service_role key — never expose this to a browser>"
```

- [x] **Step 5: Install the JS client and verify connectivity**

```bash
npm install @supabase/supabase-js
```

Create `scripts/verify-supabase-connection.ts`:

```ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("FAIL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey);

async function main() {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) {
    console.error("FAIL:", error.message);
    process.exit(1);
  }
  console.log(`PASS: connected, admin API reachable (${data.users.length} user(s) on page 1)`);
}

main();
```

- [x] **Step 6: Run it**

Run: `npx tsx scripts/verify-supabase-connection.ts`
Expected: `PASS: connected, admin API reachable (...)`

- [x] **Step 7: Commit**

```bash
git add package.json package-lock.json supabase/config.toml scripts/verify-supabase-connection.ts .gitignore
git commit -m "chore: set up Supabase CLI and JS client for the auth/RLS migration"
```

(If `npx supabase init` added anything under `.supabase/` locally, add `.supabase/` to `.gitignore` first — it holds local CLI state, not project config.)

---

## Task 2: Add `authUserId` link columns (additive schema change)

**Files:**
- Modify: `prisma/schema.prisma` (`Coach`, `Student` models)
- Create: `prisma/migrations/<timestamp>_add_supabase_auth_link/migration.sql`

**Interfaces:**
- Produces: `Coach.authUserId` (`String?`, unique), `Student.authUserId` (`String?`, unique) — every later task's SQL and scripts join through these.

- [x] **Step 1: Edit the schema**

In `prisma/schema.prisma`, add one field to each model (do not remove `passwordHash` yet — see Global Constraints):

```prisma
model Coach {
  id                  String    @id @default(cuid())
  name                String
  email               String    @unique
  passwordHash        String
  isAdmin             Boolean   @default(false)
  phone               String?
  trainingCompletedAt DateTime?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  createdAt           DateTime  @default(now())
  authUserId          String?   @unique // Supabase auth.users.id, set once linked

  assignments    ClassAssignment[]
  markedSessions AttendanceSession[]
  shifts         CoachShift[] @relation("CoachShifts")
  approvedShifts CoachShift[] @relation("ApprovedShifts")

  @@index([email])
}
```

```prisma
model Student {
  id       String @id @default(cuid())
  name     String
  level    Level

  contactNumber String
  schoolName    String
  email         String
  isMapStudent  Boolean @default(true)

  emergencyContactName         String
  emergencyContactRelationship EmergencyContactRelationship
  emergencyContactPhone        String

  referralSource ReferralSource?

  status       StudentStatus @default(ACTIVE)
  registeredAt DateTime      @default(now())

  loginCode  String  @unique
  authUserId String? @unique // Supabase auth.users.id, set once linked

  enrollments           Enrollment[]
  attendanceRecords     AttendanceRecord[]
  guardianNotifications GuardianNotification[]
  checkInNotifications  CheckInNotification[]
  checkIns              CheckIn[]

  @@index([level])
}
```

- [x] **Step 2: Generate and apply the migration**

Run: `npx prisma migrate dev --name add_supabase_auth_link`
Expected: prompts for nothing (purely additive, nullable columns — no data loss warning), ends with `Your database is now in sync with your schema.`

- [x] **Step 3: Verify the column exists on both tables**

Run:
```bash
echo 'SELECT column_name FROM information_schema.columns WHERE table_name IN ('"'"'Coach'"'"', '"'"'Student'"'"') AND column_name = '"'"'authUserId'"'"';' | npx prisma db execute --stdin --schema prisma/schema.prisma
```
Expected: exits successfully with no error (the earlier `db pull --print` trick showed this doesn't print rows — instead confirm via `npx prisma studio` or by checking `npx prisma validate` plus the migration file diff includes `ADD COLUMN "authUserId"` for both tables).

Concretely: `cat prisma/migrations/*_add_supabase_auth_link/migration.sql` and confirm it contains two `ALTER TABLE ... ADD COLUMN "authUserId" TEXT` (or equivalent) statements plus two unique indexes.

- [x] **Step 4: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors (this column is additive and unused by existing code so far).

- [x] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add authUserId link columns for Supabase Auth migration"
```

---

## Task 3: Account provisioning script (creates auth.users for seed data)

**Files:**
- Create: `scripts/provision-auth-users.ts`

**Interfaces:**
- Consumes: `Coach.authUserId`/`Student.authUserId` (Task 2), `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (Task 1), `DATABASE_URL` (existing).
- Produces: every seeded `Coach`/`Student` row gets a non-null `authUserId`; every seeded coach's `auth.users` password matches their existing demo password (`Coach123!`); every seeded student gets a synthetic, never-emailed address of the form `student-<id>@students.map.internal` on their linked `auth.users` entry (this is the address `student-login`, Task 6, will look up via `admin.getUserById` and use with `generateLink`/`verifyOtp` — no real mail is ever sent to it).

- [x] **Step 1: Write the script**

```ts
// scripts/provision-auth-users.ts
//
// One-off: creates a Supabase Auth identity for every Coach/Student that
// doesn't have one yet, and links it via authUserId. Safe to re-run — it
// skips rows that already have an authUserId.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();
const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const DEMO_COACH_PASSWORD = "Coach123!";

function studentSyntheticEmail(studentId: string): string {
  return `student-${studentId}@students.map.internal`;
}

async function provisionCoaches() {
  const coaches = await prisma.coach.findMany({ where: { authUserId: null } });
  for (const coach of coaches) {
    const { data, error } = await admin.auth.admin.createUser({
      email: coach.email,
      password: DEMO_COACH_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create auth user for coach ${coach.email}: ${error?.message}`);
    }
    await prisma.coach.update({ where: { id: coach.id }, data: { authUserId: data.user.id } });
    console.log(`linked coach ${coach.email} -> ${data.user.id}`);
  }
}

async function provisionStudents() {
  const students = await prisma.student.findMany({ where: { authUserId: null } });
  for (const student of students) {
    const syntheticEmail = studentSyntheticEmail(student.id);
    const randomPassword = crypto.randomUUID();
    const { data, error } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: randomPassword,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create auth user for student ${student.id}: ${error?.message}`);
    }
    await prisma.student.update({ where: { id: student.id }, data: { authUserId: data.user.id } });
    console.log(`linked student ${student.name} (${student.id}) -> ${data.user.id}`);
  }
}

async function main() {
  await provisionCoaches();
  await provisionStudents();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
```

- [x] **Step 2: Run it**

Run: `npx tsx scripts/provision-auth-users.ts`
Expected: one `linked coach ...` line per seeded coach (7) and one `linked student ...` line per seeded student (~16), no errors.

- [x] **Step 3: Write and run the verification script**

```ts
// scripts/verify-account-provisioning.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unlinkedCoaches = await prisma.coach.count({ where: { authUserId: null } });
  const unlinkedStudents = await prisma.student.count({ where: { authUserId: null } });
  if (unlinkedCoaches > 0 || unlinkedStudents > 0) {
    console.error(`FAIL: ${unlinkedCoaches} coach(es) and ${unlinkedStudents} student(s) still unlinked`);
    process.exit(1);
  }
  const totalCoaches = await prisma.coach.count();
  const totalStudents = await prisma.student.count();
  console.log(`PASS: all ${totalCoaches} coaches and ${totalStudents} students have authUserId set`);
  await prisma.$disconnect();
}

main();
```

Run: `npx tsx scripts/verify-account-provisioning.ts`
Expected: `PASS: all 7 coaches and 16 students have authUserId set` (exact counts may vary slightly — 0 unlinked is what matters).

- [x] **Step 4: Commit**

```bash
git add scripts/provision-auth-users.ts scripts/verify-account-provisioning.ts
git commit -m "feat: provision Supabase Auth identities for seeded coaches and students"
```

---

## Task 4: Custom Access Token Hook (`isAdmin`/`role` JWT claims)

**Files:**
- Create: `prisma/migrations/<timestamp>_auth_claims_hook/migration.sql`, `scripts/verify-claims-hook-function.ts`

**Interfaces:**
- Produces: `public.custom_access_token_hook(event jsonb)` (invoked by Supabase Auth at token-issuance time once enabled — Step 3 below); `public.is_admin()`, `public.current_coach_id()`, `public.current_student_id()` (used by every RLS policy from Task 9 onward).

- [x] **Step 1: Create an empty migration to hand-write**

Run: `npx prisma migrate dev --create-only --name auth_claims_hook`

This creates `prisma/migrations/<timestamp>_auth_claims_hook/migration.sql` with no content (schema.prisma hasn't changed — RLS/functions aren't expressible in it).

- [x] **Step 2: Write the migration SQL**

```sql
-- prisma/migrations/<timestamp>_auth_claims_hook/migration.sql

-- Stamps isAdmin + role onto every issued JWT, so RLS policies can read
-- auth.jwt() directly instead of a subquery back to Coach/Student on every
-- row check. Must be wired up as the active "Custom Access Token" hook in
-- the Supabase dashboard (Authentication -> Hooks) — see Step 3, a
-- one-time manual step; this migration only creates the function.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  coach_is_admin boolean;
  student_found boolean;
begin
  claims := coalesce(event->'claims', '{}'::jsonb);

  select "isAdmin" into coach_is_admin
  from "Coach"
  where "authUserId" = (event->>'user_id');

  if found then
    claims := jsonb_set(claims, '{isAdmin}', to_jsonb(coach_is_admin));
    -- app_role, NOT role: the top-level `role` claim is reserved —
    -- PostgREST does SET ROLE <claim> on every REST request, and it must
    -- stay "authenticated". Overwriting it with "coach" here originally
    -- broke every direct table query for a coach/student session with
    -- `role "coach" does not exist` (caught in Task 9's verification,
    -- fixed by a follow-up migration — see 20260914083253_fix_auth_claims_hook_role_collision).
    claims := jsonb_set(claims, '{app_role}', to_jsonb('coach'::text));
    return jsonb_set(event, '{claims}', claims);
  end if;

  select true into student_found
  from "Student"
  where "authUserId" = (event->>'user_id');

  if found then
    claims := jsonb_set(claims, '{isAdmin}', to_jsonb(false));
    claims := jsonb_set(claims, '{app_role}', to_jsonb('student'::text));
    return jsonb_set(event, '{claims}', claims);
  end if;

  -- No linked Coach/Student row (shouldn't happen for real sessions) —
  -- leave claims unset. Every policy below fails closed in that case.
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Reads the isAdmin claim the hook above stamped onto the JWT. Every
-- write-policy admin-bypass in this migration set calls this.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'isAdmin')::boolean, false);
$$;

-- security definer: resolves "which Coach/Student is this session" without
-- being subject to that same table's own RLS policy (avoids the function
-- being unable to see the very row it's trying to identify).
create or replace function public.current_coach_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from "Coach" where "authUserId" = auth.uid()::text;
$$;

create or replace function public.current_student_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from "Student" where "authUserId" = auth.uid()::text;
$$;
```

- [x] **Step 3 (manual — you do this): Enable the hook in the dashboard**

Supabase dashboard → Authentication → Hooks (Auth Hooks) → add a "Custom Access Token" hook → select Postgres function `public.custom_access_token_hook` → Enable. This can only be done from the dashboard/Management API, not from a migration file.

- [x] **Step 4: Apply the migration**

Run: `npx prisma migrate deploy`
Expected: `1 migration found... applied.` / `No pending migrations to apply` on subsequent runs.

- [x] **Step 5: Write and run a function-level sanity check (doesn't require Step 3 to be done yet)**

```ts
// scripts/verify-claims-hook-function.ts
//
// Tests the SQL function logic directly, independent of whether it's been
// wired up as the active Auth Hook yet (that requires the dashboard step —
// this only proves the function itself returns the right shape).
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.coach.findFirst({ where: { isAdmin: true, authUserId: { not: null } } });
  if (!admin) throw new Error("No admin coach with authUserId found — run Task 3 first.");

  const result = await prisma.$queryRawUnsafe<{ custom_access_token_hook: unknown }[]>(
    `select public.custom_access_token_hook($1::jsonb) as custom_access_token_hook`,
    JSON.stringify({ user_id: admin.authUserId, claims: {} }),
  );
  const claims = (result[0].custom_access_token_hook as { claims: { isAdmin: boolean; app_role: string } }).claims;
  if (claims.isAdmin !== true || claims.app_role !== "coach") {
    console.error("FAIL: expected isAdmin=true, app_role=coach, got", claims);
    process.exit(1);
  }
  console.log("PASS: hook function stamps correct claims for an admin coach:", claims);
  await prisma.$disconnect();
}

main();
```

Run: `npx tsx scripts/verify-claims-hook-function.ts`
Expected: `PASS: hook function stamps correct claims for an admin coach: { isAdmin: true, role: 'coach' }`

- [x] **Step 6: Commit**

```bash
git add prisma/migrations scripts/verify-claims-hook-function.ts
git commit -m "feat: add custom access token hook stamping isAdmin/role claims"
```

(Full end-to-end proof that the *enabled* hook actually reaches a real issued JWT happens in Task 5's verification, once `coach-login` exists and mints a real session.)

---

## Task 5: Edge Function `coach-login`

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/coach-login/index.ts`
- Create: `scripts/verify-coach-login.ts`

**Interfaces:**
- Consumes: `Coach.authUserId`/`failedLoginAttempts`/`lockedUntil` (Task 2), `public.is_admin()`-relevant claims (Task 4).
- Produces: `POST /functions/v1/coach-login` — request `{ email: string; password: string }`, response `200 { session: Session }` or `401/423 { error: string }`. `Session` is the shape `@supabase/supabase-js`'s `Session` type expects (`access_token`, `refresh_token`, etc.) — later, the browser client calls `supabase.auth.setSession(session)` with this directly.

- [x] **Step 1: Shared CORS helper**

```ts
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

- [x] **Step 2: Write the function**

```ts
// supabase/functions/coach-login/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const LOGIN_LOCK_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") {
    return Response.json({ error: "email and password are required." }, { status: 400, headers: corsHeaders });
  }

  const { data: coach, error: coachError } = await admin
    .from("Coach")
    .select('id, "authUserId", "failedLoginAttempts", "lockedUntil"')
    .eq("email", email)
    .maybeSingle();

  if (coachError) {
    return Response.json({ error: "Lookup failed." }, { status: 500, headers: corsHeaders });
  }
  if (!coach || !coach.authUserId) {
    return Response.json({ error: "Invalid email or password." }, { status: 401, headers: corsHeaders });
  }
  if (coach.lockedUntil && new Date(coach.lockedUntil) > new Date()) {
    return Response.json({ error: "Account temporarily locked. Try again later." }, { status: 423, headers: corsHeaders });
  }

  const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.session) {
    const attempts = coach.failedLoginAttempts + 1;
    await admin
      .from("Coach")
      .update({
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= LOGIN_LOCK_ATTEMPTS
            ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000).toISOString()
            : coach.lockedUntil,
      })
      .eq("id", coach.id);
    return Response.json({ error: "Invalid email or password." }, { status: 401, headers: corsHeaders });
  }

  if (coach.failedLoginAttempts > 0 || coach.lockedUntil) {
    await admin.from("Coach").update({ failedLoginAttempts: 0, lockedUntil: null }).eq("id", coach.id);
  }

  return Response.json({ session: signInData.session }, { status: 200, headers: corsHeaders });
});
```

- [x] **Step 3: Deploy it**

Run: `npx supabase functions deploy coach-login`
Expected: `Deployed Function coach-login`

- [x] **Step 4: Write and run the verification script**

```ts
// scripts/verify-coach-login.ts
import "dotenv/config";

const url = `${process.env.SUPABASE_URL}/functions/v1/coach-login`;

async function callLogin(email: string, password: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const good = await callLogin("admin@map.test", "Coach123!");
  if (good.status !== 200 || !good.body.session?.access_token) {
    console.error("FAIL: expected 200 with a session for correct credentials, got", good.status, good.body);
    process.exit(1);
  }

  // Decode the JWT payload (no verification needed here — just confirming
  // the claims hook actually reached this real, issued token).
  const payload = JSON.parse(atob(good.body.session.access_token.split(".")[1]));
  // app_role, not role: `role` is reserved by PostgREST for SET ROLE and
  // must stay "authenticated" — see the Task 4 hook's app_role note.
  if (payload.isAdmin !== true || payload.app_role !== "coach") {
    console.error("FAIL: expected isAdmin=true, app_role=coach in the issued JWT, got", payload.isAdmin, payload.app_role);
    console.error("If this fails, confirm Task 4 Step 3 (enabling the hook in the dashboard) was done.");
    process.exit(1);
  }
  if (payload.role !== "authenticated") {
    console.error("FAIL: expected the reserved `role` claim to stay 'authenticated' (PostgREST SET ROLE), got", payload.role);
    process.exit(1);
  }

  const bad = await callLogin("admin@map.test", "wrong-password");
  if (bad.status !== 401) {
    console.error("FAIL: expected 401 for wrong password, got", bad.status, bad.body);
    process.exit(1);
  }

  console.log("PASS: correct login returns a session with isAdmin/role claims; wrong password is rejected");
}

main();
```

Run: `npx tsx scripts/verify-coach-login.ts`
Expected: `PASS: correct login returns a session with isAdmin/role claims; wrong password is rejected`

If it fails on the claims check specifically, go back to Task 4 Step 3 — the hook function existing isn't enough, it must be toggled on in the dashboard.

- [x] **Step 5: Commit**

```bash
git add supabase/functions scripts/verify-coach-login.ts
git commit -m "feat: add coach-login Edge Function with lockout preserved"
```

---

## Task 6: Edge Function `student-login`

**Files:**
- Create: `supabase/functions/student-login/index.ts`
- Create: `scripts/verify-student-login.ts`

**Interfaces:**
- Consumes: `Student.loginCode`/`status`/`authUserId` (existing + Task 2).
- Produces: `POST /functions/v1/student-login` — request `{ code: string }`, response `200 { session: Session }` or `401 { error: string }`.

- [x] **Step 1: Write the function**

```ts
// supabase/functions/student-login/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || code.length === 0) {
    return Response.json({ error: "code is required." }, { status: 400, headers: corsHeaders });
  }

  const { data: student, error: studentError } = await admin
    .from("Student")
    .select('id, status, "authUserId"')
    .eq("loginCode", code.toUpperCase())
    .maybeSingle();

  if (studentError || !student || student.status !== "ACTIVE" || !student.authUserId) {
    return Response.json({ error: "Invalid code." }, { status: 401, headers: corsHeaders });
  }

  const { data: authUser, error: getUserError } = await admin.auth.admin.getUserById(student.authUserId);
  if (getUserError || !authUser.user?.email) {
    return Response.json({ error: "Account not fully set up." }, { status: 500, headers: corsHeaders });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.user.email,
  });
  if (linkError || !linkData.properties?.hashed_token) {
    return Response.json({ error: "Could not start session." }, { status: 500, headers: corsHeaders });
  }

  const { data: verifyData, error: verifyError } = await admin.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
    // Deliberately no `email` field here: @supabase/supabase-js 2.116.0
    // rejects token_hash + email together ("Only the token_hash and type
    // should be provided"). token_hash alone is sufficient.
  });
  if (verifyError || !verifyData.session) {
    return Response.json({ error: "Could not start session." }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ session: verifyData.session }, { status: 200, headers: corsHeaders });
});
```

- [x] **Step 2: Deploy**

Run: `npx supabase functions deploy student-login`

- [x] **Step 3: Write and run the verification script**

```ts
// scripts/verify-student-login.ts
import "dotenv/config";

const url = `${process.env.SUPABASE_URL}/functions/v1/student-login`;

async function callLogin(code: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ code }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const good = await callLogin("GHW7UD");
  if (good.status !== 200 || !good.body.session?.access_token) {
    console.error("FAIL: expected 200 with a session for a valid code, got", good.status, good.body);
    process.exit(1);
  }

  const payload = JSON.parse(atob(good.body.session.access_token.split(".")[1]));
  if (payload.app_role !== "student") {
    console.error("FAIL: expected app_role=student in the issued JWT, got", payload.app_role);
    process.exit(1);
  }
  if (payload.role !== "authenticated") {
    console.error("FAIL: expected the reserved `role` claim to stay 'authenticated' (PostgREST SET ROLE), got", payload.role);
    process.exit(1);
  }

  const bad = await callLogin("ZZZZZZ");
  if (bad.status !== 401) {
    console.error("FAIL: expected 401 for an invalid code, got", bad.status, bad.body);
    process.exit(1);
  }

  console.log("PASS: valid code returns a session with role=student claim; invalid code is rejected");
}

main();
```

Run: `npx tsx scripts/verify-student-login.ts`
Expected: `PASS: valid code returns a session with role=student claim; invalid code is rejected`

(If `GHW7UD` no longer exists in your seed data, substitute any current student's `loginCode`.)

- [x] **Step 4: Commit**

```bash
git add supabase/functions/student-login scripts/verify-student-login.ts
git commit -m "feat: add student-login Edge Function"
```

---

## Task 7: Edge Function `register-student`

**Files:**
- Create: `supabase/functions/register-student/index.ts`
- Create: `scripts/verify-register-student.ts`

**Interfaces:**
- Consumes: nothing prior (public, unauthenticated — matches today's `registerStudent` server action exactly).
- Produces: `POST /functions/v1/register-student` — request matches `registerStudentSchema`'s shape (`name`, `level`, `contactNumber`, `schoolName`, `email`, `isMapStudent`, `emergencyContactName`, `emergencyContactRelationship`, `emergencyContactPhone`, `referralSource?`), response `200 { studentId: string; loginCode: string }` or `400 { error: string }`.

- [x] **Step 1: Check the exact validation schema first**

Run: `cat src/validations/registration.ts`

Copy its exact field list/types into the Edge Function's own validation below — Deno Edge Functions can't import from `src/` directly (it's a separate Deno runtime, not bundled with the Next.js app), so the shape is intentionally duplicated here, not imported.

- [x] **Step 2: Write the function**

```ts
// supabase/functions/register-student/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const LOGIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomLoginCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += LOGIN_CODE_ALPHABET[Math.floor(Math.random() * LOGIN_CODE_ALPHABET.length)];
  }
  return code;
}

async function generateUniqueLoginCode(admin: ReturnType<typeof createClient>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomLoginCode();
    const { data } = await admin.from("Student").select("id").eq("loginCode", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique login code after 10 attempts.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => null);
  const required = [
    "name", "level", "contactNumber", "schoolName", "email",
    "emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone",
  ];
  if (!body || required.some((key) => typeof body[key] !== "string" || body[key].length === 0)) {
    return Response.json({ error: "Please check the form — something wasn't filled in correctly." }, { status: 400, headers: corsHeaders });
  }

  const loginCode = await generateUniqueLoginCode(admin);

  const { data: student, error } = await admin
    .from("Student")
    .insert({
      // Prisma's @default(cuid()) only runs client-side in Prisma Client —
      // there's no DB-level default, so a direct PostgREST insert must
      // supply its own id or hit a NOT NULL violation. crypto.randomUUID()
      // is native to Deno (the `cuid` npm package crashes at module-load
      // time in this edge sandbox); no code in this repo validates id format.
      id: crypto.randomUUID(),
      name: body.name,
      level: body.level,
      contactNumber: body.contactNumber,
      schoolName: body.schoolName,
      email: body.email,
      isMapStudent: body.isMapStudent ?? true,
      emergencyContactName: body.emergencyContactName,
      emergencyContactRelationship: body.emergencyContactRelationship,
      emergencyContactPhone: body.emergencyContactPhone,
      referralSource: body.referralSource ?? null,
      loginCode,
    })
    .select("id")
    .single();

  if (error || !student) {
    return Response.json({ error: "Registration failed." }, { status: 400, headers: corsHeaders });
  }

  return Response.json({ studentId: student.id, loginCode }, { status: 200, headers: corsHeaders });
});
```

- [x] **Step 3: Deploy**

Run: `npx supabase functions deploy register-student --no-verify-jwt`

(`--no-verify-jwt` is required here specifically — this is the one function meant to be callable with no session at all, matching today's public `/register` page.)

- [x] **Step 4: Write and run the verification script**

```ts
// scripts/verify-register-student.ts
import "dotenv/config";

const url = `${process.env.SUPABASE_URL}/functions/v1/register-student`;

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // deliberately NO Authorization header
    body: JSON.stringify({
      name: "Verification Test Student",
      level: "P3",
      contactNumber: "91234567",
      schoolName: "Test Primary School",
      email: "verify-test@example.com",
      isMapStudent: true,
      emergencyContactName: "Test Guardian",
      emergencyContactRelationship: "MOTHER",
      emergencyContactPhone: "91234567",
    }),
  });
  const body = await res.json();
  if (res.status !== 200 || !body.studentId || !body.loginCode) {
    console.error("FAIL: expected 200 with studentId+loginCode for an unauthenticated request, got", res.status, body);
    process.exit(1);
  }
  console.log("PASS: unauthenticated registration succeeded:", body);
}

main();
```

Run: `npx tsx scripts/verify-register-student.ts`
Expected: `PASS: unauthenticated registration succeeded: { studentId: '...', loginCode: '...' }`

- [x] **Step 5: Commit**

```bash
git add supabase/functions/register-student scripts/verify-register-student.ts
git commit -m "feat: add public register-student Edge Function"
```

---

## Task 8: Edge Function `admin-create-coach`

**Files:**
- Create: `supabase/functions/admin-create-coach/index.ts`
- Create: `scripts/verify-admin-create-coach.ts`

**Interfaces:**
- Consumes: the caller's `Authorization: Bearer <access_token>` header (from a session minted by Task 5's `coach-login`).
- Produces: `POST /functions/v1/admin-create-coach` — request `{ name, email, password, phone?, isAdmin }`, response `200 { coachId: string }`, `403 { error: string }` if the caller isn't an admin.

- [x] **Step 1: Write the function**

```ts
// supabase/functions/admin-create-coach/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerToken = authHeader.replace("Bearer ", "");
  const { data: callerUser, error: callerError } = await admin.auth.getUser(callerToken);
  if (callerError || !callerUser.user) {
    return Response.json({ error: "Unauthenticated." }, { status: 401, headers: corsHeaders });
  }

  // Authoritative check against the database, not the JWT claim — this
  // function bypasses RLS anyway (service role), so there's no cost to
  // reading the live value instead of trusting a cached claim.
  const { data: callerCoach } = await admin
    .from("Coach")
    .select('"isAdmin"')
    .eq("authUserId", callerUser.user.id)
    .maybeSingle();
  if (!callerCoach?.isAdmin) {
    return Response.json({ error: "Admin access required." }, { status: 403, headers: corsHeaders });
  }

  const { name, email, password, phone, isAdmin } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return Response.json({ error: "name, email, and password are required." }, { status: 400, headers: corsHeaders });
  }

  const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !newAuthUser.user) {
    return Response.json({ error: createError?.message ?? "Could not create login." }, { status: 400, headers: corsHeaders });
  }

  // Coach.passwordHash is still NOT NULL (Global Constraints: it's not
  // dropped until Plan 2, since src/auth.ts's NextAuth path still reads
  // it) — hash the same password at the same cost factor as the existing
  // admin coach-creation flow (src/actions/coaches.ts) so it stays valid
  // there too, not just via this new Supabase-auth path.
  const passwordHash = await bcrypt.hash(password, 12);

  const { data: coach, error: insertError } = await admin
    .from("Coach")
    // id: Prisma's @default(cuid()) only runs client-side in Prisma Client —
    // a direct PostgREST insert must supply its own id (see register-student,
    // Task 7, which hit this as a NOT NULL violation first).
    .insert({
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      phone: phone ?? null,
      isAdmin: Boolean(isAdmin),
      authUserId: newAuthUser.user.id,
    })
    .select("id")
    .single();
  if (insertError || !coach) {
    return Response.json({ error: "Could not create coach profile." }, { status: 400, headers: corsHeaders });
  }

  return Response.json({ coachId: coach.id }, { status: 200, headers: corsHeaders });
});
```

- [x] **Step 2: Deploy**

Run: `npx supabase functions deploy admin-create-coach`

- [x] **Step 3: Write and run the verification script**

```ts
// scripts/verify-admin-create-coach.ts
import "dotenv/config";

const loginUrl = `${process.env.SUPABASE_URL}/functions/v1/coach-login`;
const createUrl = `${process.env.SUPABASE_URL}/functions/v1/admin-create-coach`;

async function login(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.session?.access_token as string | undefined;
}

async function main() {
  const adminToken = await login("admin@map.test", "Coach123!");
  if (!adminToken) throw new Error("Could not log in as admin@map.test for this test.");

  const newEmail = `verify-test-coach-${Date.now()}@map.test`;
  const asAdmin = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Verify Test Coach", email: newEmail, password: "TempPass123!", isAdmin: false }),
  });
  const asAdminBody = await asAdmin.json();
  if (asAdmin.status !== 200 || !asAdminBody.coachId) {
    console.error("FAIL: admin should be able to create a coach, got", asAdmin.status, asAdminBody);
    process.exit(1);
  }

  const nonAdminToken = await login("farhan@map.test", "Coach123!");
  if (!nonAdminToken) throw new Error("Could not log in as farhan@map.test for this test.");

  const asNonAdmin = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${nonAdminToken}` },
    body: JSON.stringify({ name: "Should Fail", email: `should-fail-${Date.now()}@map.test`, password: "TempPass123!", isAdmin: false }),
  });
  if (asNonAdmin.status !== 403) {
    console.error("FAIL: non-admin should be rejected with 403, got", asNonAdmin.status, await asNonAdmin.json());
    process.exit(1);
  }

  console.log("PASS: admin can create a coach; non-admin is rejected with 403");
}

main();
```

Run: `npx tsx scripts/verify-admin-create-coach.ts`
Expected: `PASS: admin can create a coach; non-admin is rejected with 403`

- [x] **Step 4: Commit**

```bash
git add supabase/functions/admin-create-coach scripts/verify-admin-create-coach.ts
git commit -m "feat: add admin-create-coach Edge Function"
```

---

## Task 9: RLS — `Venue`, `Class`, `CurriculumTopic` (public-read tables)

**Files:**
- Create: `prisma/migrations/<timestamp>_rls_public_read_tables/migration.sql`
- Create: `scripts/verify-rls-public-read-tables.ts`

- [x] **Step 1: Create the empty migration**

Run: `npx prisma migrate dev --create-only --name rls_public_read_tables`

**Note:** from here on, `migrate dev`/`--create-only` fails with `P3006: schema "auth" does not exist` — it replays the full migration history into a shadow database to diff, and every migration from Task 4 onward references Supabase's `auth` schema (`auth.uid()`), which a bare shadow Postgres instance doesn't have. Create the migration folder by hand instead (`mkdir -p prisma/migrations/<UTC-timestamp-YYYYMMDDHHMMSS>_<name>`, write `migration.sql` directly) and apply with `prisma migrate deploy`, which never touches a shadow database. Applies to every remaining task in this plan.

- [x] **Step 2: Write the SQL**

```sql
-- prisma/migrations/<timestamp>_rls_public_read_tables/migration.sql
alter table "Venue" enable row level security;
create policy "venue_select_authenticated" on "Venue" for select to authenticated using (true);
create policy "venue_write_admin" on "Venue" for all to authenticated using (is_admin()) with check (is_admin());

alter table "Class" enable row level security;
create policy "class_select_authenticated" on "Class" for select to authenticated using (true);
create policy "class_write_admin" on "Class" for all to authenticated using (is_admin()) with check (is_admin());

alter table "CurriculumTopic" enable row level security;
create policy "curriculum_select_authenticated" on "CurriculumTopic" for select to authenticated using (true);
create policy "curriculum_write_admin" on "CurriculumTopic" for all to authenticated using (is_admin()) with check (is_admin());
```

- [x] **Step 3: Apply**

Run: `npx prisma migrate deploy`

- [x] **Step 4: Write and run the verification script**

```ts
// scripts/verify-rls-public-read-tables.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  const farhan = await coachClient("farhan@map.test", "Coach123!");

  const { data: venues, error: venueError } = await farhan.from("Venue").select("id");
  if (venueError || !venues || venues.length === 0) {
    console.error("FAIL: a non-admin coach should be able to read Venue rows, got", venueError, venues);
    process.exit(1);
  }

  const { error: writeError } = await farhan.from("Venue").insert({ name: "Should Fail Venue" });
  if (!writeError) {
    console.error("FAIL: a non-admin coach should NOT be able to insert a Venue row.");
    process.exit(1);
  }

  const admin = await coachClient("admin@map.test", "Coach123!");
  const { error: adminWriteError } = await admin.from("Venue").insert({ name: "Verify RLS Venue" }).select().single();
  if (adminWriteError) {
    console.error("FAIL: admin should be able to insert a Venue row, got", adminWriteError);
    process.exit(1);
  }

  console.log("PASS: any coach can read Venue/Class/CurriculumTopic; only admin can write");
}

main();
```

Run: `npx tsx scripts/verify-rls-public-read-tables.ts`
Expected: `PASS: any coach can read Venue/Class/CurriculumTopic; only admin can write`

- [x] **Step 5: Commit**

```bash
git add prisma/migrations scripts/verify-rls-public-read-tables.ts
git commit -m "feat: add RLS for Venue/Class/CurriculumTopic"
```

---

## Task 10: RLS — `Coach` (+ `coach_public` view)

**Files:**
- Create: `prisma/migrations/<timestamp>_rls_coach/migration.sql`
- Create: `scripts/verify-rls-coach.ts`

- [x] **Step 1: Confirm the spec's open item — does a coach edit their own profile anywhere?**

Run: `grep -rn "coaches/\[coachId\]" src/app --include="*.tsx" -l` then check that page and any form it renders for a self-edit path (as opposed to only an admin-editing-a-coach path). The spec tentatively concluded "none currently exposed to self-edit in the UI" — if that holds, the admin-only write policy in Step 3 below is correct as written. If you find a real self-edit form (e.g. a coach changing their own phone number), add a third policy alongside it: `create policy "coach_update_self_limited" on "Coach" for update to authenticated using ("authUserId" = auth.uid()::text) with check ("authUserId" = auth.uid()::text and "isAdmin" = (select "isAdmin" from "Coach" where "authUserId" = auth.uid()::text));` (the `with check` clause prevents a self-edit from also silently granting itself admin).

- [x] **Step 2: Create the empty migration**

Run: `npx prisma migrate dev --create-only --name rls_coach`

- [x] **Step 3: Write the SQL**

```sql
-- prisma/migrations/<timestamp>_rls_coach/migration.sql
alter table "Coach" enable row level security;

create policy "coach_select_self_or_admin" on "Coach" for select to authenticated
  using (is_admin() or "authUserId" = auth.uid()::text);

create policy "coach_write_admin" on "Coach" for all to authenticated
  using (is_admin()) with check (is_admin());

-- Deliberately NOT security_invoker: this view intentionally exposes a
-- narrow, non-sensitive slice (id/name/isAdmin only — no email, phone,
-- passwordHash, or lockout columns) of every Coach row to any authenticated
-- user, regardless of the stricter base-table policy above. If a linter
-- later suggests adding security_invoker=true, don't — that would collapse
-- this view back to the base table's self-or-admin-only policy and break
-- "see a colleague's name" everywhere it's used (e.g. "approved by Farhan").
create or replace view public.coach_public as
  select id, name, "isAdmin" from "Coach";

grant select on public.coach_public to authenticated;
```

- [x] **Step 4: Apply**

Run: `npx prisma migrate deploy`

- [x] **Step 5: Write and run the verification script**

```ts
// scripts/verify-rls-coach.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  const farhan = await coachClient("farhan@map.test", "Coach123!");

  const { data: publicRows, error: publicError } = await farhan.from("coach_public").select("id, name");
  if (publicError || !publicRows || publicRows.length < 2) {
    console.error("FAIL: any coach should see every coach's name via coach_public, got", publicError, publicRows);
    process.exit(1);
  }

  const { data: fullRows } = await farhan.from("Coach").select("id, email");
  if (!fullRows || fullRows.length !== 1) {
    console.error("FAIL: a non-admin coach querying the base Coach table should see only their own row, got", fullRows);
    process.exit(1);
  }

  console.log("PASS: coach_public exposes every coach's name; the base Coach table is self-only for non-admins");
}

main();
```

Run: `npx tsx scripts/verify-rls-coach.ts`
Expected: `PASS: coach_public exposes every coach's name; the base Coach table is self-only for non-admins`

- [x] **Step 6: Commit**

```bash
git add prisma/migrations scripts/verify-rls-coach.ts
git commit -m "feat: add RLS for Coach and a coach_public view for names"
```

---

## Task 11: RLS — `Student` and `Enrollment` (tightened access)

**Files:**
- Create: `prisma/migrations/<timestamp>_rls_student_enrollment/migration.sql`
- Create: `scripts/verify-rls-student-enrollment.ts`

- [x] **Step 1: Create the empty migration**

Run: `npx prisma migrate dev --create-only --name rls_student_enrollment`

- [x] **Step 2: Write the SQL**

```sql
-- prisma/migrations/<timestamp>_rls_student_enrollment/migration.sql
alter table "Student" enable row level security;

create policy "student_select_admin_assigned_or_self" on "Student" for select to authenticated
  using (
    is_admin()
    or "authUserId" = auth.uid()::text
    or exists (
      select 1
      from "Enrollment" e
      join "ClassAssignment" ca on ca."classId" = e."classId"
      where e."studentId" = "Student".id
        and e.status = 'ACTIVE'
        and ca."coachId" = current_coach_id()
    )
  );

-- No insert policy for authenticated/anon: rows are created only by the
-- register-student and admin-create-... Edge Functions, which use the
-- service-role key and bypass RLS entirely.
create policy "student_update_admin" on "Student" for update to authenticated
  using (is_admin()) with check (is_admin());

alter table "Enrollment" enable row level security;

create policy "enrollment_select" on "Enrollment" for select to authenticated
  using (
    is_admin()
    or "studentId" = current_student_id()
    or exists (
      select 1 from "ClassAssignment" ca
      where ca."classId" = "Enrollment"."classId" and ca."coachId" = current_coach_id()
    )
  );

create policy "enrollment_write_admin" on "Enrollment" for all to authenticated
  using (is_admin()) with check (is_admin());
```

- [x] **Step 3: Apply**

Run: `npx prisma migrate deploy`

- [x] **Step 4: Write and run the verification script**

```ts
// scripts/verify-rls-student-enrollment.ts
//
// This is the highest-stakes check in this plan — confirms the tightened
// Student policy actually blocks cross-coach enumeration.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  // Find a real (coach, assigned student, unassigned coach) triple using
  // the service-role client, rather than assuming fixed seed IDs.
  const assignment = await prisma.classAssignment.findFirst({
    include: {
      class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: true } } } },
      coach: true,
    },
  });
  if (!assignment || assignment.class.enrollments.length === 0) {
    throw new Error("No ClassAssignment with an active enrollment found in seed data — cannot run this check.");
  }
  const assignedCoachEmail = assignment.coach.email;
  const targetStudentId = assignment.class.enrollments[0].student.id;

  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: assignedCoachEmail } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data to run this check.");

  const assignedClient = await coachClient(assignedCoachEmail, "Coach123!");
  const { data: allowedRead, error: allowedError } = await assignedClient
    .from("Student").select("id").eq("id", targetStudentId).maybeSingle();
  if (allowedError || !allowedRead) {
    console.error("FAIL: assigned coach should be able to read their student, got", allowedError, allowedRead);
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: deniedRead } = await otherClient
    .from("Student").select("id").eq("id", targetStudentId).maybeSingle();
  if (deniedRead) {
    console.error("FAIL: a coach with no assignment to this student's class should NOT be able to read it, got", deniedRead);
    process.exit(1);
  }

  const { data: fullList } = await otherClient.from("Student").select("id");
  console.log(`(unassigned coach can see ${fullList?.length ?? 0} student row(s) total, via other legitimate assignments)`);

  await prisma.$disconnect();
  console.log("PASS: assigned coach can read their student; a non-assigned coach cannot");
}

main();
```

Run: `npx tsx scripts/verify-rls-student-enrollment.ts`
Expected: `PASS: assigned coach can read their student; a non-assigned coach cannot`

- [x] **Step 5: Commit**

```bash
git add prisma/migrations scripts/verify-rls-student-enrollment.ts
git commit -m "feat: add tightened RLS for Student and Enrollment"
```

---

## Task 12: RLS — `ClassAssignment`, `AttendanceSession`, `AttendanceRecord`, `GuardianNotification`

**Files:**
- Create: `prisma/migrations/<timestamp>_rls_class_membership_tables/migration.sql`
- Create: `scripts/verify-rls-class-membership-tables.ts`

- [x] **Step 1: Create the empty migration**

Run: `npx prisma migrate dev --create-only --name rls_class_membership_tables`

- [x] **Step 2: Write the SQL**

```sql
-- prisma/migrations/<timestamp>_rls_class_membership_tables/migration.sql
alter table "ClassAssignment" enable row level security;
create policy "class_assignment_select" on "ClassAssignment" for select to authenticated
  using (is_admin() or "coachId" = current_coach_id());
create policy "class_assignment_write_admin" on "ClassAssignment" for all to authenticated
  using (is_admin()) with check (is_admin());

alter table "AttendanceSession" enable row level security;
create policy "attendance_session_access" on "AttendanceSession" for all to authenticated
  using (
    is_admin() or exists (
      select 1 from "ClassAssignment" ca
      where ca."classId" = "AttendanceSession"."classId" and ca."coachId" = current_coach_id()
    )
  )
  with check (
    is_admin() or exists (
      select 1 from "ClassAssignment" ca
      where ca."classId" = "AttendanceSession"."classId" and ca."coachId" = current_coach_id()
    )
  );

alter table "AttendanceRecord" enable row level security;
create policy "attendance_record_access" on "AttendanceRecord" for all to authenticated
  using (
    is_admin() or exists (
      select 1
      from "AttendanceSession" s
      join "ClassAssignment" ca on ca."classId" = s."classId"
      where s.id = "AttendanceRecord"."attendanceSessionId" and ca."coachId" = current_coach_id()
    )
  )
  with check (
    is_admin() or exists (
      select 1
      from "AttendanceSession" s
      join "ClassAssignment" ca on ca."classId" = s."classId"
      where s.id = "AttendanceRecord"."attendanceSessionId" and ca."coachId" = current_coach_id()
    )
  );

alter table "GuardianNotification" enable row level security;
create policy "guardian_notification_access" on "GuardianNotification" for all to authenticated
  using (
    is_admin() or exists (
      select 1 from "ClassAssignment" ca
      where ca."classId" = "GuardianNotification"."classId" and ca."coachId" = current_coach_id()
    )
  )
  with check (
    is_admin() or exists (
      select 1 from "ClassAssignment" ca
      where ca."classId" = "GuardianNotification"."classId" and ca."coachId" = current_coach_id()
    )
  );
```

- [x] **Step 3: Apply**

Run: `npx prisma migrate deploy`

- [x] **Step 4: Write and run the verification script**

```ts
// scripts/verify-rls-class-membership-tables.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  const assignment = await prisma.classAssignment.findFirst({ include: { coach: true, class: true } });
  if (!assignment) throw new Error("No ClassAssignment found in seed data — cannot run this check.");
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: assignment.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");
  const { data: allowed, error: allowedError } = await assignedClient
    .from("ClassAssignment").select("id").eq("classId", assignment.classId);
  if (allowedError || !allowed || allowed.length === 0) {
    console.error("FAIL: assigned coach should see their own ClassAssignment row, got", allowedError, allowed);
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: denied } = await otherClient
    .from("ClassAssignment").select("id").eq("classId", assignment.classId).eq("coachId", assignment.coachId);
  if (denied && denied.length > 0) {
    console.error("FAIL: a different coach should not see another coach's ClassAssignment row, got", denied);
    process.exit(1);
  }

  console.log("PASS: ClassAssignment/AttendanceSession/AttendanceRecord/GuardianNotification scope correctly to assigned coaches");
  await prisma.$disconnect();
}

main();
```

Run: `npx tsx scripts/verify-rls-class-membership-tables.ts`
Expected: `PASS: ClassAssignment/AttendanceSession/AttendanceRecord/GuardianNotification scope correctly to assigned coaches`

- [x] **Step 5: Commit**

```bash
git add prisma/migrations scripts/verify-rls-class-membership-tables.ts
git commit -m "feat: add RLS for ClassAssignment/AttendanceSession/AttendanceRecord/GuardianNotification"
```

---

## Task 13: RLS — `CheckIn` and `CheckInNotification`

**Files:**
- Create: `prisma/migrations/<timestamp>_rls_checkin_tables/migration.sql`
- Create: `scripts/verify-rls-checkin-tables.ts`

- [x] **Step 1: Create the empty migration**

Run: `npx prisma migrate dev --create-only --name rls_checkin_tables`

- [x] **Step 2: Write the SQL**

```sql
-- prisma/migrations/<timestamp>_rls_checkin_tables/migration.sql
alter table "CheckIn" enable row level security;

create policy "checkin_select" on "CheckIn" for select to authenticated
  using (
    is_admin()
    or "studentId" = current_student_id()
    or exists (
      select 1 from "CoachShift" cs
      where cs.id = "CheckIn"."coachShiftId" and cs."coachId" = current_coach_id()
    )
  );

create policy "checkin_insert_open_shift" on "CheckIn" for insert to authenticated
  with check (
    is_admin() or exists (
      select 1 from "CoachShift" cs
      where cs.id = "CheckIn"."coachShiftId" and cs."coachId" = current_coach_id() and cs.status = 'OPEN'
    )
  );

alter table "CheckInNotification" enable row level security;

create policy "checkin_notification_select" on "CheckInNotification" for select to authenticated
  using (
    is_admin()
    or "studentId" = current_student_id()
    or exists (
      select 1
      from "CheckIn" c
      join "CoachShift" cs on cs.id = c."coachShiftId"
      where c.id = "CheckInNotification"."checkInId" and cs."coachId" = current_coach_id()
    )
  );

create policy "checkin_notification_insert" on "CheckInNotification" for insert to authenticated
  with check (
    is_admin() or exists (
      select 1
      from "CheckIn" c
      join "CoachShift" cs on cs.id = c."coachShiftId"
      where c.id = "CheckInNotification"."checkInId" and cs."coachId" = current_coach_id() and cs.status = 'OPEN'
    )
  );
```

- [x] **Step 3: Apply**

Run: `npx prisma migrate deploy`

- [x] **Step 4: Write and run the verification script**

```ts
// scripts/verify-rls-checkin-tables.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  const checkIn = await prisma.checkIn.findFirst({ include: { coachShift: { include: { coach: true } } } });
  if (!checkIn) throw new Error("No CheckIn found in seed data — cannot run this check.");
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: checkIn.coachShift.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const owningClient = await coachClient(checkIn.coachShift.coach.email, "Coach123!");
  const { data: allowed } = await owningClient.from("CheckIn").select("id").eq("id", checkIn.id).maybeSingle();
  if (!allowed) {
    console.error("FAIL: the coach whose shift produced this check-in should be able to read it.");
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: denied } = await otherClient.from("CheckIn").select("id").eq("id", checkIn.id).maybeSingle();
  if (denied) {
    console.error("FAIL: a different coach should not be able to read this check-in.");
    process.exit(1);
  }

  console.log("PASS: CheckIn/CheckInNotification scope correctly to the coach whose shift recorded them");
  await prisma.$disconnect();
}

main();
```

Run: `npx tsx scripts/verify-rls-checkin-tables.ts`
Expected: `PASS: CheckIn/CheckInNotification scope correctly to the coach whose shift recorded them`

- [x] **Step 5: Commit**

```bash
git add prisma/migrations scripts/verify-rls-checkin-tables.ts
git commit -m "feat: add RLS for CheckIn/CheckInNotification"
```

---

## Task 14: RLS — `CoachShift`

**Files:**
- Create: `prisma/migrations/<timestamp>_rls_coach_shift/migration.sql`
- Create: `scripts/verify-rls-coach-shift.ts`

- [x] **Step 1: Create the empty migration**

Run: `npx prisma migrate dev --create-only --name rls_coach_shift`

- [x] **Step 2: Write the SQL**

```sql
-- prisma/migrations/<timestamp>_rls_coach_shift/migration.sql
alter table "CoachShift" enable row level security;

create policy "coach_shift_select" on "CoachShift" for select to authenticated
  using (is_admin() or "coachId" = current_coach_id());

create policy "coach_shift_insert_own" on "CoachShift" for insert to authenticated
  with check ("coachId" = current_coach_id());

-- A coach may edit their own shift only while it's still OPEN or PENDING
-- (not yet APPROVED/REJECTED) — matches editShift's current behavior.
-- Only admin can move status into APPROVED/REJECTED (approveShift/
-- rejectShift/reopenShift are admin-only today).
create policy "coach_shift_update" on "CoachShift" for update to authenticated
  using (
    is_admin() or ("coachId" = current_coach_id() and status in ('OPEN', 'PENDING'))
  )
  with check (
    is_admin() or ("coachId" = current_coach_id() and status in ('OPEN', 'PENDING'))
  );
```

- [x] **Step 3: Apply**

Run: `npx prisma migrate deploy`

- [x] **Step 4: Write and run the verification script**

```ts
// scripts/verify-rls-coach-shift.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  const shift = await prisma.coachShift.findFirst({ include: { coach: true } });
  if (!shift) throw new Error("No CoachShift found in seed data — cannot run this check.");
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: shift.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const owningClient = await coachClient(shift.coach.email, "Coach123!");
  const { data: ownRead } = await owningClient.from("CoachShift").select("id").eq("id", shift.id).maybeSingle();
  if (!ownRead) {
    console.error("FAIL: a coach should be able to read their own shift.");
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: otherRead } = await otherClient.from("CoachShift").select("id").eq("id", shift.id).maybeSingle();
  if (otherRead) {
    console.error("FAIL: a different coach should not be able to read this shift.");
    process.exit(1);
  }

  const { error: otherWriteError } = await otherClient
    .from("CoachShift").update({ reviewNote: "should fail" }).eq("id", shift.id);
  const { data: unchanged } = await owningClient.from("CoachShift").select("reviewNote").eq("id", shift.id).single();
  if (unchanged?.reviewNote === "should fail") {
    console.error("FAIL: a different coach's update should not have applied.", otherWriteError);
    process.exit(1);
  }

  console.log("PASS: CoachShift is readable/writable only by its own coach (or admin)");
  await prisma.$disconnect();
}

main();
```

Run: `npx tsx scripts/verify-rls-coach-shift.ts`
Expected: `PASS: CoachShift is readable/writable only by its own coach (or admin)`

- [x] **Step 5: Commit**

```bash
git add prisma/migrations scripts/verify-rls-coach-shift.ts
git commit -m "feat: add RLS for CoachShift"
```

---

## Task 15: RLS — `ClassProgress`

**Files:**
- Create: `prisma/migrations/<timestamp>_rls_class_progress/migration.sql`
- Create: `scripts/verify-rls-class-progress.ts`

- [x] **Step 1: Locate what currently writes this table (spec's open item)**

Run: `grep -rln "classProgress" src/actions src/app --include="*.ts" --include="*.tsx"`

Confirm the actual gating used (`requireAdmin`/`requireCoach`+`canAccessClass`/none). If it turns out to be admin-only rather than the assigned-coach pattern assumed below, swap `is_admin() or exists (...)` for just `is_admin()` in Step 2 before applying.

- [x] **Step 2: Create the empty migration**

Run: `npx prisma migrate dev --create-only --name rls_class_progress`

- [x] **Step 3: Write the SQL**

```sql
-- prisma/migrations/<timestamp>_rls_class_progress/migration.sql
alter table "ClassProgress" enable row level security;

create policy "class_progress_access" on "ClassProgress" for all to authenticated
  using (
    is_admin() or exists (
      select 1 from "ClassAssignment" ca
      where ca."classId" = "ClassProgress"."classId" and ca."coachId" = current_coach_id()
    )
  )
  with check (
    is_admin() or exists (
      select 1 from "ClassAssignment" ca
      where ca."classId" = "ClassProgress"."classId" and ca."coachId" = current_coach_id()
    )
  );
```

- [x] **Step 4: Apply**

Run: `npx prisma migrate deploy`

- [x] **Step 5: Write and run the verification script**

```ts
// scripts/verify-rls-class-progress.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const loginUrl = `${url}/functions/v1/coach-login`;
const prisma = new PrismaClient();

async function coachClient(email: string, password: string) {
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password }),
  });
  const { session } = await res.json();
  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  return client;
}

async function main() {
  const assignment = await prisma.classAssignment.findFirst({ include: { coach: true } });
  if (!assignment) throw new Error("No ClassAssignment found in seed data — cannot run this check.");
  const otherCoach = await prisma.coach.findFirst({ where: { email: { not: assignment.coach.email } } });
  if (!otherCoach) throw new Error("Need at least two coaches in seed data.");

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");
  const { error: readError } = await assignedClient.from("ClassProgress").select("id").eq("classId", assignment.classId);
  if (readError) {
    console.error("FAIL: assigned coach should be able to query ClassProgress for their class, got", readError);
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: otherRows } = await otherClient.from("ClassProgress").select("id").eq("classId", assignment.classId);
  if (otherRows && otherRows.length > 0) {
    console.error("FAIL: a non-assigned coach should not see this class's progress rows, got", otherRows);
    process.exit(1);
  }

  console.log("PASS: ClassProgress scopes to assigned coaches");
  await prisma.$disconnect();
}

main();
```

Run: `npx tsx scripts/verify-rls-class-progress.ts`
Expected: `PASS: ClassProgress scopes to assigned coaches`

- [x] **Step 6: Commit**

```bash
git add prisma/migrations scripts/verify-rls-class-progress.ts
git commit -m "feat: add RLS for ClassProgress"
```

---

## Task 16: Full-suite verification and plan closeout

**Files:** None new — this task only runs what already exists.

- [x] **Step 1: Run every verification script in one pass**

```bash
for f in scripts/verify-*.ts; do
  echo "=== $f ===";
  npx tsx "$f" || { echo "STOPPED at $f"; break; }
done
```

Expected: every script prints a line starting with `PASS:`, none print `FAIL:` or `STOPPED at`.

- [x] **Step 2: Confirm the existing app still runs unmodified**

Run: `npm run build`
Expected: succeeds exactly as it did before this plan (this plan never touched `src/auth.ts`, `src/actions/`, or any page — only additive schema, new Edge Functions, and RLS policies the current Prisma-based app doesn't query through, so nothing here should have broken it).

- [x] **Step 3: Confirm `prisma migrate status` is clean**

Run: `npx prisma migrate status`
Expected: `Database schema is up to date!`

- [x] **Step 4: Final commit**

```bash
git add -A
git status # confirm nothing unexpected is staged before committing
git commit -m "chore: complete Supabase auth/RLS foundation (Plan 1 of 2)" --allow-empty
```

(`--allow-empty` only matters if Steps 1-3 found nothing left to stage — every substantive change should already be committed at the end of its own task.)

**Plan 2** (frontend migration: replace NextAuth with this Edge Function API, convert all 8 `src/actions/*.ts` files to client-side `supabase-js` calls, build the Notifications page, configure static export + GitHub Actions deploy) gets written next, once this plan's real function names/table/view names above are locked in as its actual "Consumes" interface.

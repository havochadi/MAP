# Supabase Client-Side Data & Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the client-side data-access and auth foundation — a Supabase browser client, a React session layer replacing NextAuth, and `supabase-js` ports of every function across the app's 8 data/action domains — that Plan 2b (page-by-page conversion) will consume. Independently testable against the live, already-RLS-protected Supabase backend (Plan 1). The current NextAuth/Prisma app is left running completely unmodified: this plan creates only new files under `src/lib/api/` and `src/lib/supabase/`, and touches no existing page, action, or data file.

**Architecture:** One Supabase browser client singleton (typed against a generated `Database` type, replacing `@prisma/client`'s generated types, which cannot ship to a browser bundle). A React context (`SessionProvider`) tracks the current Supabase Auth session and resolves it to a `CurrentCoach`/`CurrentStudent` row (mirroring today's `getCurrentCoach`/`getCurrentStudent`), exposed via hooks — `useSession()`, `useRequireCoach()`, `useRequireAdmin()`, `useRequireStudent()` — that redirect client-side when the required session is missing (cosmetic UX only; RLS remains the real security boundary, per the spec). Eight new per-domain modules under `src/lib/api/` merge each old `src/data/<domain>.ts` + `src/actions/<domain>.ts` pair into one file of plain async functions calling `supabase.from(...)`/`supabase.rpc(...)`/`supabase.functions.invoke(...)` — there's no more server/client boundary forcing data (read) and actions (write) into separate files, so this plan intentionally merges them. `createCoach` and `registerStudent` are **not** reimplemented client-side — they call Plan 1's existing, already-verified `admin-create-coach` and `register-student` Edge Functions directly, since those already do byte-for-byte the same validation/hashing/login-code work (confirmed with the user rather than re-deriving duplicate logic). Two new `SECURITY DEFINER` Postgres RPC functions handle the two operations RLS can't: `scan_check_in` (a coach checking in a walk-up student they aren't necessarily assigned to — Student RLS deliberately restricts reads to assigned coaches, so this needs elevated, narrowly-validated access, not a plain query) and `register_and_checkin_student` (replaces `registerAndCheckInStudent`'s 3-insert sequence; the spec suggests `SECURITY INVOKER` here, but Plan 1's own `Student` RLS has no `authenticated` INSERT policy at all, so only a definer function can actually create the row — see Task 11's correction note).

**Important sequencing note, not a task in this plan:** this plan does **not** touch `src/app/(auth)/login/page.tsx` or `src/middleware.ts`, even though it builds the login logic those files will eventually use. Converting the real login page requires simultaneously neutralizing `middleware.ts` (which currently gates every other route on a NextAuth cookie a Supabase-Auth-based login would never produce) — that's an atomic cutover with nowhere to land safely inside an "additive only" plan, so it's Plan 2b's Task 1 instead. This plan verifies its login logic with a standalone script, the same way Plan 1 verified `coach-login`/`student-login` before any page consumed them.

**Tech Stack:** `@supabase/supabase-js` (already installed, client-side), React Context + hooks, `tsx` verification scripts (this repo still has no test runner — matches Plan 1's pattern).

**Spec:** `docs/superpowers/specs/2026-09-13-static-github-pages-supabase-migration-design.md`

**Plan 1 recap (what this plan consumes as fact, not to be re-derived):** `docs/superpowers/plans/2026-09-13-supabase-auth-and-rls-foundation.md`, fully complete. Key interfaces this plan calls directly:
- Edge Functions (all deployed): `coach-login` (`{email,password}` → `{session}`/`{error}`), `student-login` (`{code}` → `{session}`/`{error}`), `register-student` (registration payload, unauthenticated → `{studentId,loginCode}`/`{error}`), `admin-create-coach` (`{name,email,password,phone,isAdmin}`, needs an admin session → `{coachId}`/`{error}`).
- JWT custom claims: `isAdmin: boolean` and **`app_role: "coach" | "student"`** — not `role`, which is reserved by PostgREST for `SET ROLE` and must stay `"authenticated"`. Getting this wrong silently breaks every table query for that session with `role "coach" does not exist`.
- RLS is already live and verified (positive + negative) on all 15 tables — this plan's new functions ride on it; no client-side authorization checks need reimplementing (e.g. `canAccessClass` becomes redundant — Postgres enforces it on every query now).
- `Coach.authUserId`/`Student.authUserId` link to `auth.users.id`. `Coach.passwordHash` is still `NOT NULL` in the DB (Plan 2d drops it later) but nothing in this plan writes to it — only `admin-create-coach` (Edge Function, already handles it) creates Coach rows.

## Global Constraints

- No new test framework — verification uses plain `tsx` scripts under `scripts/` that assert and `process.exit(1)` on failure, matching Plan 1 and the existing `db:seed` pattern.
- Every new function is verified against the **real** Supabase backend signed in as a **real** coach/student session (via the actual `coach-login`/`student-login` Edge Functions, exactly like Plan 1's RLS verification scripts) — never mocked, and never using the service-role key to bypass RLS unless a task explicitly says so.
- Demo accounts (from Plan 1): password `Coach123!` for all coaches — `admin@map.test` (admin), `farhan@map.test`, `aishah@map.test`, `danial@map.test`, `ain@map.test`, `haziq@map.test`, `nabila@map.test`, plus a `Verify Test Coach` created during Plan 1's own verification. Known student login codes include `GHW7UD` and `VSKQR6`. Verification scripts look up fixtures dynamically (via Prisma, which still has full DB access for setup/assertions in these `tsx` scripts) rather than hardcoding assumed relationships.
- This plan creates **only** new files under `src/lib/api/`, `src/lib/supabase/`, `scripts/`, and one migration under `prisma/migrations/` — it must not modify any file under `src/app/`, `src/actions/`, `src/data/`, `src/auth*.ts`, or `src/middleware.ts`. If a task seems to need one of those changed, stop — that task belongs in Plan 2b, not here.
- `prisma migrate dev`/`--create-only` cannot be used on this project (confirmed in Plan 1: shadow-database diffing fails on every migration from Plan 1's Task 4 onward, since it references Supabase's `auth` schema). Create the one migration this plan needs by hand (`prisma/migrations/<UTC timestamp YYYYMMDDHHMMSS>_<name>/migration.sql`) and apply with `npx prisma migrate deploy`.
- Any direct `.insert()` via `supabase-js` into a Prisma-defined table needs an explicit `id: crypto.randomUUID()` — Prisma's `@default(cuid())` is a Prisma-Client-side-only default, confirmed repo-wide in Plan 1. This plan's new `src/lib/api/*.ts` insert calls must all include it.
- Table names in `.from(...)` calls are exact Prisma model names (`"Coach"`, `"CoachShift"`, etc.) — case-sensitive, matching Plan 1's SQL.
- **An RLS-blocked `.update()`/`.delete()`/`.select()` is NOT an error — confirmed empirically against this project on both a write and a read, not assumed.** When RLS's `USING` clause excludes every row a filter matches, PostgREST runs the query against zero rows and returns `error: null` — for writes, `data: null`, HTTP 204; for reads, `data: []`, HTTP 200 — indistinguishable from "nothing matched" unless you check further. Tested directly twice: a non-admin updating a Venue row returns `error: null` with and without `.select()` chained (row provably unchanged); an anonymous, unauthenticated read of Venue (SELECT policy is `to authenticated` only) returns `error: null, data: []`, not a denial error. **Every `.update()`/`.delete()` call in this plan chains `.select()` and treats an empty/null result as a failure; every verification script asserting an RLS denial checks the returned `data` for emptiness, never `error` alone** — `if (error || !data)` (single-row `.maybeSingle()`) or `if (error || data.length === 0)` (multi-row/list). `.insert()` doesn't have this problem — a `WITH CHECK` violation on insert is a real Postgres error and surfaces normally.

## File Structure

- Create: `src/lib/supabase/database.types.ts` (generated, not hand-written)
- Create: `src/lib/supabase/client.ts` — the browser client singleton
- Create: `src/lib/supabase/session.tsx` — `SessionProvider`, `useSession`, `useRequireCoach`, `useRequireAdmin`, `useRequireStudent`, `signOut`
- Create: `src/lib/api/auth.ts` — `loginAction`, `studentLoginAction`, `quickLoginAction` (logic only; no page wiring)
- Create: `src/lib/api/types.ts` — shared `ActionResult<T>`
- Create: `src/lib/api/venues.ts` — `getAllVenues`, `createVenue`
- Create: `src/lib/api/curriculum.ts` — `getSubjectLevelCombos`, `getTopics`
- Create: `src/lib/api/classes.ts` — `getClassesForCoach`, `getClassById`, `getClassDetail`, `getAllClassesForSelect`, `getAllVenuesWithClassCounts`, `getVenueWithClasses`, `createClass`
- Create: `src/lib/api/coaches.ts` — `getCoachProfile`, `getAllCoachesForSelect`, `createCoach` (Edge Function wrapper), `assignCoachToClass`, `unassignCoachFromClass`
- Create: `src/lib/api/students.ts` — `getStudentProfile`, `getStudentsForCoach`, `regenerateLoginCode`, `enrollStudentInClass`, `dropEnrollment`, `updateStudentStatus`
- Create: `src/lib/api/coach-shifts.ts` — `getOpenShiftForCoach`, `getShiftHistoryForCoach`, `getPendingShifts`, `getPaySummary`, `clockIn`, `clockOut`, `editShift`, `reopenShift`, `approveShift`, `rejectShift`
- Create: `src/lib/api/checkins.ts` — `getCheckInCountForShift`, `scanCheckIn`
- Create: `src/lib/api/attendance.ts` — `getRosterWithSession`, `getRecentSessionsForClass`, `markAttendanceRecord`, `submitAttendanceSession`, `reopenAttendanceSession`, `sendGuardianAttendanceNotification`
- Create: `src/lib/api/registration.ts` — `registerStudent` (Edge Function wrapper), `registerAndCheckInStudent` (RPC wrapper)
- Create: `prisma/migrations/<timestamp>_scan_check_in_rpc/migration.sql`
- Create: `prisma/migrations/<timestamp>_register_and_checkin_rpc/migration.sql`
- Modify: `.env` (2 new `NEXT_PUBLIC_` entries)

No `package.json` changes — `@supabase/supabase-js` is already a dependency from Plan 1, and this plan adds no others.

---

## Task 1: Supabase browser client + generated types

**Files:**
- Create: `src/lib/supabase/database.types.ts`, `src/lib/supabase/client.ts`
- Modify: `.env`

**Interfaces:**
- Produces: `supabase` (typed `SupabaseClient<Database>`) — every later task imports this.

- [ ] **Step 1: Generate the database types**

Run: `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`

Expected: a `Database` type covering every table/view/function in the `public` schema (`Coach`, `Student`, `coach_public`, etc.), confirmed working (tested directly against this project during planning).

- [ ] **Step 2 (manual — you do this): Add the two public client env vars**

Add to `.env` (these are safe to expose to the browser — they're literally duplicates of the existing `SUPABASE_URL`/`SUPABASE_ANON_KEY` values, just under Next.js's required `NEXT_PUBLIC_` prefix so they get inlined into the client bundle; do not add the service-role key here, it must never reach the browser):

```
NEXT_PUBLIC_SUPABASE_URL="<same value as SUPABASE_URL>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<same value as SUPABASE_ANON_KEY>"
```

- [ ] **Step 3: Write the client singleton**

```ts
// src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

- [ ] **Step 4: Write and run a connectivity smoke test**

```ts
// scripts/verify-browser-client.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

// Uses the same NEXT_PUBLIC_ vars the real browser client will use, to
// prove Step 2's .env values are correct — not process.env.SUPABASE_URL.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function main() {
  const { data, error } = await supabase.from("Venue").select("id").limit(1);
  // anon, unauthenticated: RLS requires `to authenticated` on Venue's
  // SELECT policy, so this must return zero rows. An RLS-blocked SELECT
  // is NOT a Postgres/PostgREST error (same gotcha as the UPDATE/DELETE
  // case elsewhere in this plan's Global Constraints, just on the read
  // side) — check `data`, not `error`, or this assertion never fires.
  if (error) {
    console.error("FAIL: expected a clean (if empty) response, got a real error — check the env vars:", error);
    process.exit(1);
  }
  if (!data || data.length > 0) {
    console.error("FAIL: expected an anonymous, unauthenticated read to be denied (empty) by RLS, got", data);
    process.exit(1);
  }
  console.log("PASS: browser client env vars are correct (anonymous read denied by RLS as expected)");
}

main();
```

Run: `npx tsx scripts/verify-browser-client.ts`
Expected: `PASS: browser client env vars are correct ...`

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/database.types.ts src/lib/supabase/client.ts scripts/verify-browser-client.ts
git commit -m "feat: add typed Supabase browser client and generated database types"
```

(`.env` is gitignored — nothing to add there.)

---

## Task 2: Client-side session/auth layer

**Files:**
- Create: `src/lib/supabase/session.tsx`
- Create: `scripts/verify-session-resolution.ts`

**Interfaces:**
- Consumes: `supabase` (Task 1).
- Produces: `SessionProvider` (React component — Plan 2b wraps the app root with this), `useSession(): { loading: boolean; coach: CurrentCoach | null; student: CurrentStudent | null }`, `useRequireCoach(): CurrentCoach | null`, `useRequireAdmin(): CurrentCoach | null`, `useRequireStudent(): CurrentStudent | null`, `signOut(): Promise<void>`, types `CurrentCoach = { id: string; isAdmin: boolean; name: string; email: string }`, `CurrentStudent = { id: string; name: string }` — every page in Plan 2b uses these in place of today's `requireCoach()`/`requireAdmin()`/`requireStudent()` from `src/lib/session.ts`.

This mirrors `src/lib/session.ts`'s shape deliberately (same field names on `CurrentCoach`/`CurrentStudent`) so Plan 2b's page conversions are mechanical: `const coach = await requireCoach()` at the top of a Server Component becomes `const coach = useRequireCoach()` at the top of a Client Component, same shape back. The redirect behavior is new (there was no client-side redirect before — middleware did it), and is cosmetic UX only, not a security boundary — RLS is what actually protects the data if a redirect is somehow bypassed.

- [ ] **Step 1: Write the session context and hooks**

```tsx
// src/lib/supabase/session.tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

export type CurrentCoach = { id: string; isAdmin: boolean; name: string; email: string };
export type CurrentStudent = { id: string; name: string };

type SessionState = {
  loading: boolean;
  coach: CurrentCoach | null;
  student: CurrentStudent | null;
};

const initialState: SessionState = { loading: true, coach: null, student: null };
const SessionContext = createContext<SessionState>(initialState);

// The JWT's custom claims tell us which table to look the session up in —
// app_role, NOT role (role is PostgREST's reserved claim, always
// "authenticated" for a signed-in session; see Plan 1's Task 4 hook fix).
function decodeAppRole(session: Session): "coach" | "student" | null {
  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1])) as { app_role?: string };
    return payload.app_role === "coach" || payload.app_role === "student" ? payload.app_role : null;
  } catch {
    return null;
  }
}

async function resolveSession(session: Session | null): Promise<SessionState> {
  if (!session) return { loading: false, coach: null, student: null };

  const appRole = decodeAppRole(session);

  if (appRole === "coach") {
    const { data } = await supabase
      .from("Coach")
      .select("id, name, email, isAdmin")
      .eq("authUserId", session.user.id)
      .maybeSingle();
    return { loading: false, coach: data, student: null };
  }

  if (appRole === "student") {
    const { data } = await supabase.from("Student").select("id, name").eq("authUserId", session.user.id).maybeSingle();
    return { loading: false, coach: null, student: data };
  }

  return { loading: false, coach: null, student: null };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => resolveSession(data.session).then((s) => !cancelled && setState(s)));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session).then((s) => !cancelled && setState(s));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}

// Every page that touches a specific class/student must call one of these
// (or useRequireAdmin) — RLS is the real boundary, but a signed-out user
// should never even see a loading skeleton for a page they can't use.
export function useRequireCoach(): CurrentCoach | null {
  const { loading, coach } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !coach) router.replace("/login");
  }, [loading, coach, router]);
  return coach;
}

export function useRequireAdmin(): CurrentCoach | null {
  const coach = useRequireCoach();
  const router = useRouter();
  useEffect(() => {
    if (coach && !coach.isAdmin) router.replace("/");
  }, [coach, router]);
  return coach?.isAdmin ? coach : null;
}

export function useRequireStudent(): CurrentStudent | null {
  const { loading, student } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !student) router.replace("/login");
  }, [loading, student, router]);
  return student;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
```

- [ ] **Step 2: Write and run a verification script proving session resolution (no React needed — tests the same claim-decode + table-lookup logic the hooks use)**

```ts
// scripts/verify-session-resolution.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

function decodeAppRole(accessToken: string): string | undefined {
  const payload = JSON.parse(atob(accessToken.split(".")[1])) as { app_role?: string };
  return payload.app_role;
}

async function main() {
  const loginRes = await fetch(`${url}/functions/v1/coach-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email: "farhan@map.test", password: "Coach123!" }),
  });
  const { session } = await loginRes.json();
  if (decodeAppRole(session.access_token) !== "coach") {
    console.error("FAIL: expected app_role=coach in the session used for lookup");
    process.exit(1);
  }

  const client = createClient(url, anonKey);
  await client.auth.setSession(session);
  const { data: coach, error } = await client
    .from("Coach")
    .select("id, name, email, isAdmin")
    .eq("authUserId", session.user.id)
    .maybeSingle();

  if (error || !coach || coach.email !== "farhan@map.test" || coach.isAdmin !== false) {
    console.error("FAIL: session-based Coach lookup didn't resolve to the expected row, got", error, coach);
    process.exit(1);
  }
  console.log("PASS: a coach session resolves to the correct CurrentCoach shape via app_role + authUserId lookup:", coach);

  // The coach and student branches of resolveSession() are symmetric but
  // independent code paths — testing only one leaves the other (equally
  // required — useRequireStudent/CurrentStudent) unverified against a real
  // backend, contrary to this plan's own Global Constraint naming both
  // coach-login and student-login explicitly.
  const studentLoginRes = await fetch(`${url}/functions/v1/student-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ code: "GHW7UD" }),
  });
  const { session: studentSession } = await studentLoginRes.json();
  if (decodeAppRole(studentSession.access_token) !== "student") {
    console.error("FAIL: expected app_role=student in the session used for lookup");
    process.exit(1);
  }

  const studentClient = createClient(url, anonKey);
  await studentClient.auth.setSession(studentSession);
  const { data: student, error: studentError } = await studentClient
    .from("Student")
    .select("id, name")
    .eq("authUserId", studentSession.user.id)
    .maybeSingle();

  if (studentError || !student || !student.name) {
    console.error("FAIL: session-based Student lookup didn't resolve to the expected row, got", studentError, student);
    process.exit(1);
  }
  console.log("PASS: a student session resolves to the correct CurrentStudent shape via app_role + authUserId lookup:", student);
}

main();
```

Run: `npx tsx scripts/verify-session-resolution.ts`
Expected: `PASS: a coach session resolves to the correct CurrentCoach shape ...` followed by `PASS: a student session resolves to the correct CurrentStudent shape ...`

(If `GHW7UD` no longer exists in your seed data, substitute any current student's `loginCode` — same convention as Plan 1's `verify-student-login.ts`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/session.tsx scripts/verify-session-resolution.ts
git commit -m "feat: add client-side session/auth context and require* hooks"
```

---

## Task 3: Login logic (`src/lib/api/auth.ts`)

**Files:**
- Create: `src/lib/api/auth.ts`
- Create: `scripts/verify-login-logic.ts`

**Interfaces:**
- Consumes: `supabase` (Task 1); Edge Functions `coach-login`/`student-login` (Plan 1).
- Produces: `LoginState = { error?: string; success?: true } | undefined`, `QuickLoginRole = "coach" | "admin" | "student"`, `loginAction(prevState, formData): Promise<LoginState>`, `studentLoginAction(prevState, formData): Promise<LoginState>`, `quickLoginAction(role): Promise<LoginState>` — Plan 2b's Task 1 imports these directly into the real login page.

Today's `loginAction`/`studentLoginAction`/`quickLoginAction` (in `src/actions/coaches.ts`) call NextAuth's `signIn()`, which performs the redirect itself by throwing a special error the framework catches. There's no server to do that anymore, so these versions do the sign-in (Edge Function call + `supabase.auth.setSession(...)`) and return `{ success: true }` instead of redirecting — Plan 2b's login page does the actual `router.push(...)` in a `useEffect` keyed on that flag. Everything else about the calling convention (`useActionState(loginAction, undefined)`, `quickLoginAction.bind(null, "coach")`) is unchanged, so the page's `"use client"` JSX barely needs to change in Plan 2b — only what these functions do internally changed, not their shape.

- [ ] **Step 1: Write the login functions**

```ts
// src/lib/api/auth.ts
import { supabase } from "@/lib/supabase/client";

export type LoginState = { error?: string; success?: true } | undefined;
export type QuickLoginRole = "coach" | "admin" | "student";

// Same demo accounts as src/actions/coaches.ts's quickLoginAction — see
// that file's comment for why these are deliberately not gated to
// non-production (already published in the README).
const QUICK_LOGIN_COACH_ACCOUNTS: Record<"coach" | "admin", { email: string; password: string }> = {
  coach: { email: "farhan@map.test", password: "Coach123!" },
  admin: { email: "admin@map.test", password: "Coach123!" },
};
const QUICK_LOGIN_STUDENT_CODE = "GHW7UD";

async function signInCoach(email: string, password: string): Promise<LoginState> {
  const { data, error } = await supabase.functions.invoke<{ session?: import("@supabase/supabase-js").Session; error?: string }>(
    "coach-login",
    { body: { email, password } },
  );
  if (error || !data?.session) return { error: "Invalid email or password." };
  await supabase.auth.setSession(data.session);
  return { success: true };
}

async function signInStudent(code: string): Promise<LoginState> {
  const { data, error } = await supabase.functions.invoke<{ session?: import("@supabase/supabase-js").Session; error?: string }>(
    "student-login",
    { body: { code } },
  );
  if (error || !data?.session) return { error: "That code wasn't recognised. Check with your coach and try again." };
  await supabase.auth.setSession(data.session);
  return { success: true };
}

export async function quickLoginAction(role: QuickLoginRole): Promise<LoginState> {
  if (role === "student") return signInStudent(QUICK_LOGIN_STUDENT_CODE);
  const { email, password } = QUICK_LOGIN_COACH_ACCOUNTS[role];
  return signInCoach(email, password);
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  return signInCoach(email, password);
}

export async function studentLoginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const code = String(formData.get("code") ?? "");
  return signInStudent(code);
}
```

- [ ] **Step 2: Write and run a verification script**

```ts
// scripts/verify-login-logic.ts
//
// Calls the exported functions exactly as the login page will, including
// a FormData object (jsdom isn't available here, but FormData itself is a
// standard Node global — no DOM needed to construct one).
import "dotenv/config";
import { loginAction, studentLoginAction, quickLoginAction } from "../src/lib/api/auth";
import { supabase } from "../src/lib/supabase/client";

async function main() {
  const coachForm = new FormData();
  coachForm.set("email", "farhan@map.test");
  coachForm.set("password", "Coach123!");
  const coachResult = await loginAction(undefined, coachForm);
  if (!coachResult?.success) {
    console.error("FAIL: loginAction should succeed with valid coach credentials, got", coachResult);
    process.exit(1);
  }
  await supabase.auth.signOut();

  const badForm = new FormData();
  badForm.set("email", "farhan@map.test");
  badForm.set("password", "wrong-password");
  const badResult = await loginAction(undefined, badForm);
  if (!badResult?.error) {
    console.error("FAIL: loginAction should return an error for a wrong password, got", badResult);
    process.exit(1);
  }

  const studentForm = new FormData();
  studentForm.set("code", "GHW7UD");
  const studentResult = await studentLoginAction(undefined, studentForm);
  if (!studentResult?.success) {
    console.error("FAIL: studentLoginAction should succeed with a valid code, got", studentResult);
    process.exit(1);
  }
  await supabase.auth.signOut();

  // Mirrors the coach wrong-password check above — studentLoginAction has
  // two distinct branches (valid code -> success, invalid -> error) and
  // only testing the success one leaves the error branch unverified
  // against the real backend (same gap class as Task 2's coach/student
  // asymmetry, recurring here between success/failure instead).
  const badStudentForm = new FormData();
  badStudentForm.set("code", "ZZZZZZ");
  const badStudentResult = await studentLoginAction(undefined, badStudentForm);
  if (!badStudentResult?.error) {
    console.error("FAIL: studentLoginAction should return an error for an invalid code, got", badStudentResult);
    process.exit(1);
  }

  const quickResult = await quickLoginAction("admin");
  if (!quickResult?.success) {
    console.error("FAIL: quickLoginAction('admin') should succeed, got", quickResult);
    process.exit(1);
  }
  await supabase.auth.signOut();

  console.log("PASS: loginAction/studentLoginAction/quickLoginAction all sign in correctly and reject bad credentials");
}

main();
```

Run: `npx tsx scripts/verify-login-logic.ts`
Expected: `PASS: loginAction/studentLoginAction/quickLoginAction all sign in correctly and reject bad credentials`

(If `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` aren't set when running under plain `tsx` — they're real env vars either way, `NEXT_PUBLIC_` is only a Next.js build-time inlining convention, not a runtime restriction — this still works via `dotenv/config` loading `.env` normally.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/auth.ts scripts/verify-login-logic.ts
git commit -m "feat: add client-side login logic for coach/student/quick login"
```

---

## Task 4: Shared `ActionResult` type + Venues and Curriculum modules

**Files:**
- Create: `src/lib/api/types.ts`, `src/lib/api/venues.ts`, `src/lib/api/curriculum.ts`
- Create: `scripts/verify-venues-curriculum.ts`

**Interfaces:**
- Produces: `ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string }` (every write-action module below imports this — today each `"use server"` file redefined it locally; centralized now since there's no longer a server-boundary reason to duplicate it). `getAllVenues(): Promise<{id: string; name: string}[]>`, `createVenue(input: unknown): Promise<ActionResult<{venueId: string}>>`, `getSubjectLevelCombos(): Promise<{subject: Subject; level: Level}[]>`, `getTopics(subject: Subject, level: Level): Promise<CurriculumTopic[]>`.

- [ ] **Step 1: Write the shared type**

```ts
// src/lib/api/types.ts
export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };
```

- [ ] **Step 2: Write the Venues module**

```ts
// src/lib/api/venues.ts
import { supabase } from "@/lib/supabase/client";
import { createVenueSchema } from "@/validations/class";
import type { ActionResult } from "./types";

export async function getAllVenues() {
  const { data, error } = await supabase.from("Venue").select("id, name").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createVenue(input: unknown): Promise<ActionResult<{ venueId: string }>> {
  const parsed = createVenueSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  // id: Venue's Prisma @default(cuid()) is Prisma-Client-side only — a
  // direct PostgREST insert must supply its own id (Plan 1, Tasks 7/8/9).
  const { data, error } = await supabase
    .from("Venue")
    .insert({ id: crypto.randomUUID(), ...parsed.data })
    .select("id")
    .single();
  // RLS (Plan 1, Task 9) rejects a non-admin's insert outright — no
  // separate requireAdmin() check needed; the database enforces it.
  if (error || !data) return { success: false, error: "Could not create venue." };
  return { success: true, data: { venueId: data.id } };
}
```

- [ ] **Step 3: Write the Curriculum module**

```ts
// src/lib/api/curriculum.ts
import { supabase } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";

type Subject = Enums<"Subject">;
type Level = Enums<"Level">;

export async function getSubjectLevelCombos() {
  const { data, error } = await supabase
    .from("CurriculumTopic")
    .select("subject, level")
    .order("subject", { ascending: true })
    .order("level", { ascending: true });
  if (error) throw error;
  // Postgres has no client-side DISTINCT equivalent in supabase-js — dedupe
  // in JS instead of the DB, matching Prisma's `distinct: ["subject", "level"]`.
  const seen = new Set<string>();
  return data.filter((row) => {
    const key = `${row.subject}:${row.level}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getTopics(subject: Subject, level: Level) {
  const { data, error } = await supabase
    .from("CurriculumTopic")
    .select("*")
    .eq("subject", subject)
    .eq("level", level)
    .order("order", { ascending: true });
  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Write and run a verification script**

```ts
// scripts/verify-venues-curriculum.ts
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

  const { data: venues, error: venuesError } = await farhan.from("Venue").select("id, name").order("name", { ascending: true });
  if (venuesError || !venues || venues.length === 0) {
    console.error("FAIL: getAllVenues-equivalent should return rows for a signed-in coach, got", venuesError, venues);
    process.exit(1);
  }

  const { error: writeError } = await farhan.from("Venue").insert({ id: crypto.randomUUID(), name: "Should Fail Venue" });
  if (!writeError) {
    console.error("FAIL: createVenue-equivalent should be rejected by RLS for a non-admin.");
    process.exit(1);
  }

  // The rejection case above only proves half of createVenue's two
  // outcomes (ActionResult is success|failure) — the allowed path,
  // including the .insert().select() interaction (a separate SELECT
  // policy is needed for the inserted row to come back even when the
  // INSERT itself is permitted), is unverified without this.
  const admin = await coachClient("admin@map.test", "Coach123!");
  const { data: createdVenue, error: adminWriteError } = await admin
    .from("Venue")
    .insert({ id: crypto.randomUUID(), name: "Verify RLS Venue" })
    .select("id")
    .single();
  if (adminWriteError || !createdVenue) {
    console.error("FAIL: createVenue-equivalent should succeed for an admin, got", adminWriteError, createdVenue);
    process.exit(1);
  }

  const { data: combos, error: combosError } = await farhan
    .from("CurriculumTopic")
    .select("subject, level")
    .order("subject", { ascending: true });
  if (combosError || !combos || combos.length === 0) {
    console.error("FAIL: getSubjectLevelCombos-equivalent should return rows, got", combosError, combos);
    process.exit(1);
  }
  const first = combos[0];
  const { data: topics, error: topicsError } = await farhan
    .from("CurriculumTopic")
    .select("*")
    .eq("subject", first.subject)
    .eq("level", first.level);
  if (topicsError || !topics || topics.length === 0) {
    console.error("FAIL: getTopics-equivalent should return rows for a real subject/level, got", topicsError, topics);
    process.exit(1);
  }

  console.log("PASS: Venues and Curriculum queries work correctly for a signed-in coach; venue insert succeeds for admin and is rejected for a non-admin");
}

main();
```

Run: `npx tsx scripts/verify-venues-curriculum.ts`
Expected: `PASS: Venues and Curriculum queries work correctly ...`

- [ ] **Step 5: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors (these are new, unused-by-the-app-yet files — this just confirms they type-check against the generated `Database` type).

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/venues.ts src/lib/api/curriculum.ts scripts/verify-venues-curriculum.ts
git commit -m "feat: add client-side Venues and Curriculum modules"
```

---

## Task 5: Classes module

**Files:**
- Create: `src/lib/api/classes.ts`
- Create: `scripts/verify-classes.ts`

**Interfaces:**
- Consumes: `ActionResult` (Task 4).
- Produces: `getClassesForCoach(coachId, isAdmin)`, `getClassById(classId)`, `getClassDetail(classId)`, `getAllClassesForSelect()`, `getAllVenuesWithClassCounts()`, `getVenueWithClasses(venueId)`, `createClass(input): Promise<ActionResult<{classId: string}>>`.

**Design note carried into this task:** `Class` RLS (Plan 1, Task 9) is "any authenticated user can read" — unlike Prisma's old `getClassesForCoach`, which filtered to the coach's own assigned classes as an *application-level* convenience (not a security boundary; RLS never narrowed this). That filter has to be reimplemented here explicitly, or a non-admin coach would see every class on their dashboard. Similarly, `coach_public` (Plan 1, Task 10) is a **view**, not a table — it has no foreign key Supabase's schema cache can use for `supabase-js`'s automatic nested-select embedding (`.select("*, coach:Coach(...)")` only works through real FK-backed tables), so assignment coach-name lookups here are done as a second query + JS-side merge rather than one nested select.

- [ ] **Step 1: Write the Classes module**

```ts
// src/lib/api/classes.ts
import { supabase } from "@/lib/supabase/client";
import { getSingaporeTodayString } from "@/lib/dates";
import { createClassSchema } from "@/validations/class";
import type { ActionResult } from "./types";

export async function getClassesForCoach(coachId: string, isAdmin: boolean) {
  let classIds: string[] | null = null;
  if (!isAdmin) {
    const { data: assignments, error } = await supabase.from("ClassAssignment").select("classId").eq("coachId", coachId);
    if (error) throw error;
    classIds = assignments.map((a) => a.classId);
    if (classIds.length === 0) return [];
  }

  let query = supabase
    .from("Class")
    .select("*, venue:Venue(*)")
    .order("level", { ascending: true });
  if (classIds) query = query.in("id", classIds);
  const { data: classes, error: classesError } = await query;
  if (classesError) throw classesError;
  if (classes.length === 0) return [];

  const ids = classes.map((c) => c.id);
  const today = getSingaporeTodayString();

  const [{ data: sessions, error: sessionsError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
    supabase.from("AttendanceSession").select("*").in("classId", ids).eq("sessionDate", today),
    supabase.from("Enrollment").select("classId").in("classId", ids).eq("status", "ACTIVE"),
  ]);
  if (sessionsError) throw sessionsError;
  if (enrollmentsError) throw enrollmentsError;

  const sessionByClass = new Map(sessions.map((s) => [s.classId, s]));
  const countByClass = new Map<string, number>();
  for (const e of enrollments) countByClass.set(e.classId, (countByClass.get(e.classId) ?? 0) + 1);

  return classes
    .sort((a, b) => a.venue.name.localeCompare(b.venue.name) || a.level.localeCompare(b.level))
    .map((cls) => ({
      ...cls,
      studentCount: countByClass.get(cls.id) ?? 0,
      todaySession: sessionByClass.get(cls.id) ?? null,
    }));
}

export async function getClassById(classId: string) {
  const { data, error } = await supabase.from("Class").select("*, venue:Venue(*)").eq("id", classId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getClassDetail(classId: string) {
  const { data: cls, error: classError } = await supabase
    .from("Class")
    .select("*, venue:Venue(*), enrollments:Enrollment(*, student:Student(*))")
    .eq("id", classId)
    .eq("enrollments.status", "ACTIVE")
    .maybeSingle();
  if (classError) throw classError;
  if (!cls) return null;

  const { data: assignments, error: assignmentsError } = await supabase
    .from("ClassAssignment")
    .select("*")
    .eq("classId", classId);
  if (assignmentsError) throw assignmentsError;

  const coachIds = assignments.map((a) => a.coachId);
  const { data: coaches, error: coachesError } =
    coachIds.length === 0
      ? { data: [], error: null }
      : await supabase.from("coach_public").select("id, name, isAdmin").in("id", coachIds);
  if (coachesError) throw coachesError;
  const coachById = new Map(coaches.map((c) => [c.id, c]));

  return {
    ...cls,
    enrollments: cls.enrollments.sort((a, b) => a.student.name.localeCompare(b.student.name)),
    assignments: assignments
      .map((a) => ({ ...a, coach: coachById.get(a.coachId) ?? null }))
      .sort((a, b) => (a.coach?.name ?? "").localeCompare(b.coach?.name ?? "")),
  };
}

export async function getAllClassesForSelect() {
  const { data: classes, error } = await supabase
    .from("Class")
    .select("*, venue:Venue(*)")
    .order("level", { ascending: true });
  if (error) throw error;
  return classes.sort((a, b) => a.venue.name.localeCompare(b.venue.name) || a.level.localeCompare(b.level));
}

export async function getAllVenuesWithClassCounts() {
  const { data: venues, error: venuesError } = await supabase.from("Venue").select("*").order("name", { ascending: true });
  if (venuesError) throw venuesError;
  if (venues.length === 0) return [];

  const venueIds = venues.map((v) => v.id);
  const [{ data: classes, error: classesError }, { data: checkIns, error: checkInsError }] = await Promise.all([
    supabase.from("Class").select("venueId").in("venueId", venueIds),
    supabase.from("CheckIn").select("venueId").in("venueId", venueIds),
  ]);
  if (classesError) throw classesError;
  if (checkInsError) throw checkInsError;

  const classCount = new Map<string, number>();
  for (const c of classes) classCount.set(c.venueId, (classCount.get(c.venueId) ?? 0) + 1);
  const checkInCount = new Map<string, number>();
  for (const c of checkIns) checkInCount.set(c.venueId, (checkInCount.get(c.venueId) ?? 0) + 1);

  return venues.map((v) => ({
    ...v,
    _count: { classes: classCount.get(v.id) ?? 0, checkIns: checkInCount.get(v.id) ?? 0 },
  }));
}

export async function getVenueWithClasses(venueId: string) {
  const { data: venue, error: venueError } = await supabase.from("Venue").select("*").eq("id", venueId).maybeSingle();
  if (venueError) throw venueError;
  if (!venue) return null;

  const { data: classes, error: classesError } = await supabase
    .from("Class")
    .select("*, enrollments:Enrollment(*)")
    .eq("venueId", venueId)
    .eq("enrollments.status", "ACTIVE");
  if (classesError) throw classesError;

  return {
    ...venue,
    classes: classes
      .map((c) => ({ ...c, _count: { enrollments: c.enrollments.length } }))
      .sort((a, b) => a.level.localeCompare(b.level) || a.subject.localeCompare(b.subject)),
  };
}

export async function createClass(input: unknown): Promise<ActionResult<{ classId: string }>> {
  const parsed = createClassSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("Class")
    .insert({ id: crypto.randomUUID(), ...parsed.data })
    .select("id")
    .single();
  if (error || !data) return { success: false, error: "Could not create class." };
  return { success: true, data: { classId: data.id } };
}
```

- [ ] **Step 2: Write and run a verification script**

```ts
// scripts/verify-classes.ts
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

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");

  const { data: myAssignments } = await assignedClient.from("ClassAssignment").select("classId").eq("coachId", assignment.coachId);
  if (!myAssignments || !myAssignments.some((a) => a.classId === assignment.classId)) {
    console.error("FAIL: getClassesForCoach-equivalent's assignment lookup didn't find the expected class.");
    process.exit(1);
  }

  // getAllClassesForSelect-equivalent: the full, unfiltered class list —
  // also gives us a class outside this coach's assignments, needed to
  // actually prove getClassesForCoach's narrowing filter below (checking
  // that the assignment lookup *found* the right class, above, is not the
  // same as checking that the follow-up Class query *excludes* everything
  // else — Class RLS is fully open (`using (true)`), so nothing else would
  // catch a regression if that filter were ever silently dropped).
  const { data: allClasses, error: allClassesError } = await assignedClient
    .from("Class")
    .select("*, venue:Venue(*)")
    .order("level", { ascending: true });
  if (allClassesError || !allClasses || allClasses.length === 0) {
    console.error("FAIL: getAllClassesForSelect-equivalent should return rows, got", allClassesError, allClasses);
    process.exit(1);
  }

  const classIds = myAssignments.map((a) => a.classId);
  const unassignedClass = allClasses.find((c) => !classIds.includes(c.id));
  if (!unassignedClass) {
    throw new Error("Seed data has this coach assigned to every class — cannot prove getClassesForCoach's narrowing filter excludes anything. Pick a different coach or add more classes to seed data.");
  }

  // getClassesForCoach-equivalent's actual narrowing step (the module's
  // .in("id", classIds) call): proving it returns exactly the coach's
  // assigned classes, and none of the (known-to-exist) unassigned ones.
  const { data: narrowedClasses, error: narrowedError } = await assignedClient.from("Class").select("id").in("id", classIds);
  if (narrowedError || !narrowedClasses || narrowedClasses.length !== classIds.length) {
    console.error("FAIL: getClassesForCoach-equivalent's narrowing query should return exactly the coach's assigned classes, got", narrowedError, narrowedClasses);
    process.exit(1);
  }
  if (narrowedClasses.some((c) => c.id === unassignedClass.id)) {
    console.error("FAIL: getClassesForCoach-equivalent's narrowing query leaked a class this coach isn't assigned to:", unassignedClass.id);
    process.exit(1);
  }

  const { data: detail, error: detailError } = await assignedClient
    .from("Class")
    .select("*, venue:Venue(*), enrollments:Enrollment(*, student:Student(*))")
    .eq("id", assignment.classId)
    .eq("enrollments.status", "ACTIVE")
    .maybeSingle();
  if (detailError || !detail || !detail.venue) {
    console.error("FAIL: getClassDetail-equivalent should return the class with its venue joined, got", detailError, detail);
    process.exit(1);
  }

  const { data: coachRows, error: coachRowsError } = await assignedClient
    .from("coach_public")
    .select("id, name, isAdmin")
    .eq("id", assignment.coachId);
  if (coachRowsError || !coachRows || coachRows.length !== 1) {
    console.error("FAIL: coach_public lookup for the assignment's coach should return exactly one row, got", coachRowsError, coachRows);
    process.exit(1);
  }

  // getAllVenuesWithClassCounts-equivalent
  const { data: venues, error: venuesError } = await assignedClient.from("Venue").select("*").order("name", { ascending: true });
  if (venuesError || !venues || venues.length === 0) {
    console.error("FAIL: getAllVenuesWithClassCounts-equivalent should return venue rows, got", venuesError, venues);
    process.exit(1);
  }
  const venueIds = venues.map((v) => v.id);
  const { data: venueClasses, error: venueClassesError } = await assignedClient.from("Class").select("venueId").in("venueId", venueIds);
  const { data: venueCheckIns, error: venueCheckInsError } = await assignedClient.from("CheckIn").select("venueId").in("venueId", venueIds);
  // CheckIn is coach-shift-scoped by RLS, so a non-admin's result here may
  // legitimately be narrower than the true venue-wide count (empty is not
  // a failure) — only a real error is.
  if (venueClassesError || venueCheckInsError || !venueClasses || !venueCheckIns) {
    console.error("FAIL: getAllVenuesWithClassCounts-equivalent's class/check-in count queries should succeed, got", venueClassesError, venueCheckInsError);
    process.exit(1);
  }

  // getVenueWithClasses-equivalent
  const { data: venueRow, error: venueRowError } = await assignedClient
    .from("Venue")
    .select("*")
    .eq("id", assignment.class.venueId)
    .maybeSingle();
  if (venueRowError || !venueRow) {
    console.error("FAIL: getVenueWithClasses-equivalent's venue lookup should return a row, got", venueRowError, venueRow);
    process.exit(1);
  }
  const { data: venueClassRows, error: venueClassRowsError } = await assignedClient
    .from("Class")
    .select("*, enrollments:Enrollment(*)")
    .eq("venueId", assignment.class.venueId)
    .eq("enrollments.status", "ACTIVE");
  if (venueClassRowsError || !venueClassRows || venueClassRows.length === 0) {
    console.error("FAIL: getVenueWithClasses-equivalent's class lookup should return rows for the venue, got", venueClassRowsError, venueClassRows);
    process.exit(1);
  }

  const { error: writeError } = await assignedClient.from("Class").insert({
    id: crypto.randomUUID(),
    venueId: assignment.class.venueId,
    subject: "MATH",
    level: "P3",
    dayOfWeek: "MON",
    startTime: "16:00",
    durationMinutes: 60,
  });
  if (!writeError) {
    console.error("FAIL: createClass-equivalent should be rejected by RLS for a non-admin coach.");
    process.exit(1);
  }

  // The rejection case above only proves half of createClass's two
  // outcomes (ActionResult is success|failure) — the allowed path,
  // including the .insert().select() interaction, is unverified without
  // this (same gap class already found and fixed in Tasks 2/3/4's verify
  // scripts — the rejected insert above never created a row, so reusing
  // its exact field values here can't collide).
  const admin = await coachClient("admin@map.test", "Coach123!");
  const { data: createdClass, error: adminWriteError } = await admin
    .from("Class")
    .insert({
      id: crypto.randomUUID(),
      venueId: assignment.class.venueId,
      subject: "MATH",
      level: "P3",
      dayOfWeek: "MON",
      startTime: "16:00",
      durationMinutes: 60,
    })
    .select("id")
    .single();
  if (adminWriteError || !createdClass) {
    console.error("FAIL: createClass-equivalent should succeed for an admin, got", adminWriteError, createdClass);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("PASS: Classes module queries (list, narrowing, detail with venue+enrollments+student, coach_public lookup, venue counts, venue-with-classes) all work; class insert succeeds for admin and is rejected for a non-admin");
}

main();
```

Run: `npx tsx scripts/verify-classes.ts`
Expected: `PASS: Classes module queries ...`

- [ ] **Step 3: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/classes.ts scripts/verify-classes.ts
git commit -m "feat: add client-side Classes module"
```

---

## Task 6: Coaches module

**Files:**
- Create: `src/lib/api/coaches.ts`
- Create: `scripts/verify-coaches-module.ts`

**Interfaces:**
- Consumes: `ActionResult` (Task 4); `admin-create-coach` Edge Function (Plan 1).
- Produces: `getCoachProfile(coachId)`, `getAllCoachesForSelect()`, `createCoach(input): Promise<ActionResult<{coachId: string}>>`, `assignCoachToClass(input): Promise<ActionResult>`, `unassignCoachFromClass(input): Promise<ActionResult>`.

**Behavior change to flag for Plan 2b, not resolved here:** `getAllCoachesForSelect` selects `id, name, email` from the base `Coach` table. Under RLS (Plan 1, Task 10) that table is self-row-or-admin-only — a **non-admin** coach calling this now gets back only their own row, not the full roster, since there's no view exposing email publicly (`coach_public` deliberately omits it — Plan 1's design, email is sensitive). The old Prisma version had no such restriction. `/classes/[classId]/page.tsx` (guarded by `requireCoach`, not `requireAdmin`) calls this today — Plan 2b must check whether the coach-assignment UI that consumes it is admin-gated in the JSX; if a non-admin genuinely needs to see other coaches' *names* (not email) here, swap this call for `coach_public` in that one call site instead of changing this function.

`createCoach` calls Plan 1's `admin-create-coach` Edge Function directly rather than reimplementing bcrypt hashing/uniqueness-checking client-side — `supabase.functions.invoke` automatically attaches the caller's current session as the `Authorization` header, so the function's own admin check (Plan 1) is what actually gates this, not anything in this file.

- [ ] **Step 1: Write the Coaches module**

```ts
// src/lib/api/coaches.ts
import { supabase } from "@/lib/supabase/client";
import { createCoachSchema } from "@/validations/coach";
import { classAssignmentSchema } from "@/validations/class";
import type { ActionResult } from "./types";

export async function getCoachProfile(coachId: string) {
  const { data: coachRow, error: coachError } = await supabase.from("Coach").select("*").eq("id", coachId).maybeSingle();
  if (coachError) throw coachError;
  if (!coachRow) return null;

  const { data: assignments, error: assignmentsError } = await supabase
    .from("ClassAssignment")
    .select("*, class:Class(*, venue:Venue(*), enrollments:Enrollment(*))")
    .eq("coachId", coachId)
    .eq("class.enrollments.status", "ACTIVE");
  if (assignmentsError) throw assignmentsError;

  const assignmentsWithCounts = assignments
    .map((a) => ({ ...a, class: { ...a.class, _count: { enrollments: a.class.enrollments.length } } }))
    .sort((a, b) => a.class.venue.name.localeCompare(b.class.venue.name));

  const coach = { ...coachRow, assignments: assignmentsWithCounts };
  const classIds = assignmentsWithCounts.map((a) => a.classId);
  if (classIds.length === 0) return { coach, sessionsCount: 0, studentCount: 0 };

  const [{ count: sessionsCount, error: sessionsError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
    supabase.from("AttendanceSession").select("id", { count: "exact", head: true }).in("classId", classIds).eq("markedByCoachId", coachId),
    supabase.from("Enrollment").select("studentId").in("classId", classIds).eq("status", "ACTIVE"),
  ]);
  if (sessionsError) throw sessionsError;
  if (enrollmentsError) throw enrollmentsError;

  return { coach, sessionsCount: sessionsCount ?? 0, studentCount: new Set(enrollments.map((e) => e.studentId)).size };
}

export async function getAllCoachesForSelect() {
  const { data, error } = await supabase.from("Coach").select("id, name, email").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

// supabase-js's functions.invoke() never populates `data` on a non-2xx
// response — it throws internally and returns { data: null, error } before
// the body is ever parsed as JSON (confirmed against
// @supabase/functions-js's FunctionsClient: the catch block always returns
// data: null). The Edge Function's actual { error: "..." } body only
// exists inside error.context, a raw, single-read Response — so `data?.error`
// is permanently unreachable dead code, and every failure (a taken email,
// "Admin access required.", bad input) would otherwise surface as the same
// generic fallback message instead of admin-create-coach's specific one.
async function edgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const body = await context.clone().json();
        if (typeof body?.error === "string") return body.error;
      } catch {
        // Response body wasn't JSON (e.g. a network-level FunctionsFetchError
        // with no HTTP response at all) — fall through to the fallback.
      }
    }
  }
  return fallback;
}

export async function createCoach(input: unknown): Promise<ActionResult<{ coachId: string }>> {
  const parsed = createCoachSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase.functions.invoke<{ coachId?: string; error?: string }>("admin-create-coach", {
    body: parsed.data,
  });
  if (error || !data?.coachId) {
    return { success: false, error: await edgeFunctionErrorMessage(error, "Could not create coach.") };
  }
  return { success: true, data: { coachId: data.coachId } };
}

export async function assignCoachToClass(input: unknown): Promise<ActionResult> {
  const parsed = classAssignmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { coachId, classId } = parsed.data;

  const { data: existing } = await supabase
    .from("ClassAssignment")
    .select("id")
    .eq("coachId", coachId)
    .eq("classId", classId)
    .maybeSingle();
  if (existing) return { success: false, error: "Coach is already assigned to this class." };

  const { error } = await supabase.from("ClassAssignment").insert({ id: crypto.randomUUID(), coachId, classId });
  if (error) return { success: false, error: "Could not assign coach." };
  return { success: true, data: undefined };
}

export async function unassignCoachFromClass(input: unknown): Promise<ActionResult> {
  const parsed = classAssignmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { coachId, classId } = parsed.data;

  // .select() + emptiness check, not just `error` — an RLS-blocked delete
  // reports no error at all (see Global Constraints).
  const { data, error } = await supabase
    .from("ClassAssignment")
    .delete()
    .eq("coachId", coachId)
    .eq("classId", classId)
    .select("id");
  if (error || !data || data.length === 0) return { success: false, error: "Could not unassign coach." };
  return { success: true, data: undefined };
}
```

- [ ] **Step 2: Write and run a verification script**

```ts
// scripts/verify-coaches-module.ts
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
  const admin = await coachClient("admin@map.test", "Coach123!");
  const farhan = await coachClient("farhan@map.test", "Coach123!");
  const farhanRow = await prisma.coach.findUniqueOrThrow({ where: { email: "farhan@map.test" } });

  const { data: profile, error: profileError } = await admin.from("Coach").select("*").eq("id", farhanRow.id).maybeSingle();
  if (profileError || !profile || profile.email !== "farhan@map.test") {
    console.error("FAIL: getCoachProfile-equivalent (admin viewing another coach) should return the full row, got", profileError, profile);
    process.exit(1);
  }

  // The check above only exercises a plain Coach row fetch — getCoachProfile's
  // actual complexity is this nested ClassAssignment->Class->Venue/Enrollment
  // embed plus the sessionsCount/studentCount follow-up queries, none of
  // which were tested at all. A wrong relationship name or embed path here
  // fails loudly (a real Postgrest error), which is exactly what this proves.
  const assignmentForProfile = await prisma.classAssignment.findFirst({
    include: { class: { include: { enrollments: { where: { status: "ACTIVE" } } } } },
  });
  if (!assignmentForProfile) {
    throw new Error("No ClassAssignment found in seed data — cannot test getCoachProfile's nested query.");
  }

  const { data: profileAssignments, error: profileAssignmentsError } = await admin
    .from("ClassAssignment")
    .select("*, class:Class(*, venue:Venue(*), enrollments:Enrollment(*))")
    .eq("coachId", assignmentForProfile.coachId)
    .eq("class.enrollments.status", "ACTIVE");
  if (profileAssignmentsError || !profileAssignments || profileAssignments.length === 0) {
    console.error(
      "FAIL: getCoachProfile-equivalent's nested ClassAssignment->Class->Venue/Enrollment query should return rows, got",
      profileAssignmentsError,
      profileAssignments,
    );
    process.exit(1);
  }
  const firstProfileAssignment = profileAssignments[0];
  if (!firstProfileAssignment.class?.venue?.name || !Array.isArray(firstProfileAssignment.class?.enrollments)) {
    console.error("FAIL: getCoachProfile-equivalent's nested query should embed class.venue and class.enrollments, got", firstProfileAssignment);
    process.exit(1);
  }

  const profileClassIds = profileAssignments.map((a) => a.classId);
  const [{ error: profileSessionsError }, { data: profileEnrollments, error: profileEnrollmentsError }] = await Promise.all([
    admin.from("AttendanceSession").select("id", { count: "exact", head: true }).in("classId", profileClassIds).eq("markedByCoachId", assignmentForProfile.coachId),
    admin.from("Enrollment").select("studentId").in("classId", profileClassIds).eq("status", "ACTIVE"),
  ]);
  if (profileSessionsError || profileEnrollmentsError || !profileEnrollments) {
    console.error("FAIL: getCoachProfile-equivalent's sessionsCount/studentCount queries should succeed, got", profileSessionsError, profileEnrollmentsError);
    process.exit(1);
  }

  const { data: selfRows } = await farhan.from("Coach").select("id, name, email").order("name", { ascending: true });
  if (!selfRows || selfRows.length !== 1) {
    console.error("FAIL: getAllCoachesForSelect-equivalent for a non-admin should return exactly their own row under RLS, got", selfRows);
    process.exit(1);
  }

  const newEmail = `verify-coaches-module-${Date.now()}@map.test`;
  const { data: fnData, error: fnError } = await admin.functions.invoke("admin-create-coach", {
    body: { name: "Verify Coaches Module", email: newEmail, password: "TempPass123!", isAdmin: false },
  });
  if (fnError || !fnData?.coachId) {
    console.error("FAIL: createCoach-equivalent (admin-create-coach invoke) should succeed for an admin, got", fnError, fnData);
    process.exit(1);
  }

  // createCoach wraps Plan 1's already-verified admin-create-coach Edge
  // Function rather than reimplementing the admin check client-side — but
  // per this plan's own precedent (Task 3's Edge-Function-wrapping login
  // actions), wrapping an already-verified function doesn't exempt this
  // task's own script from proving both of createCoach's outcomes.
  const { error: nonAdminCreateError } = await farhan.functions.invoke("admin-create-coach", {
    body: { name: "Should Fail Coach", email: `verify-coaches-module-reject-${Date.now()}@map.test`, password: "TempPass123!", isAdmin: false },
  });
  if (!nonAdminCreateError) {
    console.error("FAIL: createCoach-equivalent should be rejected for a non-admin caller.");
    process.exit(1);
  }

  // The raw invoke rejection above only proves the Edge Function itself
  // rejects a non-admin — it says nothing about createCoach's own
  // error-message extraction (a real defect class: functions.invoke()
  // never populates `data` on a non-2xx response, so a naive
  // `data?.error ?? fallback` is dead code that always returns the
  // fallback). This calls the real, exported createCoach directly (same
  // pattern as Task 3's verify-login-logic.ts) to prove it surfaces the
  // Edge Function's actual message, not just a generic fallback.
  const { createCoach } = await import("../src/lib/api/coaches");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");
  const farhanLoginRes = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ email: "farhan@map.test", password: "Coach123!" }),
  });
  const { session: farhanSession } = await farhanLoginRes.json();
  await sharedSupabase.auth.setSession(farhanSession);

  const createCoachResult = await createCoach({
    name: "Should Fail Coach",
    email: `verify-coaches-module-direct-reject-${Date.now()}@map.test`,
    password: "TempPass123!",
    isAdmin: false,
  });
  if (createCoachResult.success) {
    console.error("FAIL: createCoach should fail for a non-admin caller, got success.");
    process.exit(1);
  }
  if (createCoachResult.error !== "Admin access required.") {
    console.error(
      "FAIL: createCoach should surface admin-create-coach's exact rejection message, not a generic fallback, got:",
      createCoachResult.error,
    );
    process.exit(1);
  }
  await sharedSupabase.auth.signOut();

  const testClass = await prisma.class.findFirstOrThrow();

  const { error: assignError } = await farhan
    .from("ClassAssignment")
    .insert({ id: crypto.randomUUID(), coachId: fnData.coachId, classId: testClass.id });
  if (!assignError) {
    console.error("FAIL: assignCoachToClass-equivalent should be rejected by RLS for a non-admin coach.");
    process.exit(1);
  }

  // The rejection case above only proves half of assignCoachToClass's two
  // outcomes — the allowed (admin) path is unverified without this, and
  // the resulting row is what unassignCoachFromClass's checks below need.
  const assignmentId = crypto.randomUUID();
  const { error: adminAssignError } = await admin
    .from("ClassAssignment")
    .insert({ id: assignmentId, coachId: fnData.coachId, classId: testClass.id });
  if (adminAssignError) {
    console.error("FAIL: assignCoachToClass-equivalent should succeed for an admin, got", adminAssignError);
    process.exit(1);
  }

  // assignCoachToClass's own duplicate-assignment check (an existing-row
  // lookup before inserting) isn't exercised the same way its RLS gating
  // is by a raw query — but ClassAssignment's DB-level unique index on
  // (coachId, classId) independently guarantees no duplicate row can ever
  // be created either way, so this proves the practical outcome (no
  // duplicate) even without exercising the app's nicer error message.
  const { error: duplicateAssignError } = await admin
    .from("ClassAssignment")
    .insert({ id: crypto.randomUUID(), coachId: fnData.coachId, classId: testClass.id });
  if (!duplicateAssignError) {
    console.error("FAIL: a second ClassAssignment for the same coach+class pair should be rejected as a duplicate.");
    process.exit(1);
  }

  // unassignCoachFromClass-equivalent had zero coverage — rejection first
  // (non-admin), then success (admin). .delete().select() so an
  // RLS-blocked delete (error: null, not a real error) is caught via
  // empty data, never `error` alone, per this plan's Global Constraints.
  const { data: nonAdminUnassignData } = await farhan.from("ClassAssignment").delete().eq("id", assignmentId).select("id");
  if (nonAdminUnassignData && nonAdminUnassignData.length > 0) {
    console.error("FAIL: unassignCoachFromClass-equivalent should be rejected (no rows deleted) for a non-admin coach, got", nonAdminUnassignData);
    process.exit(1);
  }

  const { data: adminUnassignData, error: adminUnassignError } = await admin
    .from("ClassAssignment")
    .delete()
    .eq("id", assignmentId)
    .select("id");
  if (adminUnassignError || !adminUnassignData || adminUnassignData.length === 0) {
    console.error("FAIL: unassignCoachFromClass-equivalent should succeed for an admin, got", adminUnassignError, adminUnassignData);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("PASS: Coaches module queries/writes behave correctly under RLS, including the admin-create-coach Edge Function call (both outcomes) and assign/unassign (both outcomes each)");
}

main();
```

Run: `npx tsx scripts/verify-coaches-module.ts`
Expected: `PASS: Coaches module queries/writes behave correctly under RLS ...`

- [ ] **Step 3: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/coaches.ts scripts/verify-coaches-module.ts
git commit -m "feat: add client-side Coaches module"
```

---

## Task 7: Students module

**Files:**
- Create: `src/lib/api/students.ts`
- Create: `scripts/verify-students-module.ts`

**Interfaces:**
- Consumes: `ActionResult` (Task 4); `generateUniqueLoginCode` (existing, unchanged — see Step 1 note).
- Produces: `getStudentProfile(studentId)`, `getStudentsForCoach()` — **note: no longer takes `coachId`/`isAdmin` params, see below**, `regenerateLoginCode(studentId): Promise<ActionResult<{loginCode: string}>>`, `enrollStudentInClass(input): Promise<ActionResult>`, `dropEnrollment(input): Promise<ActionResult>`, `updateStudentStatus(input): Promise<ActionResult>`.

**Interface simplification, deliberate:** `getStudentsForCoach(coachId, isAdmin)` took both params so the old Prisma query could build the right `where` clause itself. Student RLS (Plan 1, Task 11 — "admin; a coach assigned to a class the student is enrolled in; the student's own row") already implements *exactly* that same scoping automatically, keyed off the caller's own session — there is no way to ask it for a different coach's view anyway. So this port drops both parameters: `getStudentsForCoach()` just queries the base table with no filter, and RLS does 100% of the scoping for every caller (admin included, via `is_admin()`'s bypass). Plan 2b's `/students/page.tsx` conversion calls it with no arguments.

**Two behavior changes to flag for Plan 2b, not resolved here (both are RLS doing exactly what Plan 1/the spec designed, but change what a page visibly shows):**
1. `getStudentProfile` returns `null` for a student the caller can't see under RLS (non-assigned coach) instead of the old app-level "any signed-in coach can view any student" behavior — this is the spec's explicitly-intended tightening (already verified in Plan 1, Task 11), not new here, but the `/students/[studentId]` page must handle a `null` result as "not found/not authorized" rather than assuming the ID being in the URL guarantees data.
2. The nested check-in history inside `getStudentProfile` now only includes `CheckIn` rows the caller can see under `CheckIn` RLS (Plan 1, Task 13: admin, or the coach whose own shift recorded it, or the student themself) — a coach who can view a student's profile (via class assignment) but didn't personally run the shift that recorded a given check-in won't see that check-in row. The old Prisma version showed full history regardless of who recorded it. If `/students/[studentId]` needs full cross-coach history, that's a real product decision to make in Plan 2b, not something to route around here.

- [ ] **Step 1: Write the Students module**

`generateUniqueLoginCode` (in `src/lib/login-code.ts`) is pure logic with a `prisma.student.findUnique` uniqueness check inside it — it needs its own small port. Add this export to the **same** `src/lib/api/students.ts` file rather than a separate module (it's only ever used alongside student actions):

```ts
// src/lib/api/students.ts
import { supabase } from "@/lib/supabase/client";
import { enrollStudentSchema, dropEnrollmentSchema, updateStudentStatusSchema } from "@/validations/student";
import type { ActionResult } from "./types";

const MAX_ACTIVE_ENROLLMENTS = 3;
const LOGIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // matches src/lib/login-code.ts exactly

function randomLoginCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += LOGIN_CODE_ALPHABET[Math.floor(Math.random() * LOGIN_CODE_ALPHABET.length)];
  return code;
}

async function generateUniqueLoginCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomLoginCode();
    const { data } = await supabase.from("Student").select("id").eq("loginCode", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique login code after 10 attempts.");
}

export async function getStudentProfile(studentId: string) {
  const { data: student, error: studentError } = await supabase.from("Student").select("*").eq("id", studentId).maybeSingle();
  if (studentError) throw studentError;
  if (!student) return null;

  const { data: checkIns, error: checkInsError } = await supabase
    .from("CheckIn")
    .select("*, venue:Venue(*)")
    .eq("studentId", studentId)
    .order("checkInDate", { ascending: false });
  if (checkInsError) throw checkInsError;

  return { student, checkIns };
}

export async function getStudentsForCoach() {
  const { data, error } = await supabase.from("Student").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function regenerateLoginCode(studentId: string): Promise<ActionResult<{ loginCode: string }>> {
  const loginCode = await generateUniqueLoginCode();
  // .select() + emptiness check, not just `error` — see Global Constraints.
  const { data, error } = await supabase.from("Student").update({ loginCode }).eq("id", studentId).select("id").maybeSingle();
  if (error || !data) return { success: false, error: "Could not regenerate login code." };
  return { success: true, data: { loginCode } };
}

export async function enrollStudentInClass(input: unknown): Promise<ActionResult> {
  const parsed = enrollStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { studentId, classId } = parsed.data;

  const { count: activeCount } = await supabase
    .from("Enrollment")
    .select("id", { count: "exact", head: true })
    .eq("studentId", studentId)
    .eq("status", "ACTIVE");
  if ((activeCount ?? 0) >= MAX_ACTIVE_ENROLLMENTS) {
    return { success: false, error: `Students can be enrolled in at most ${MAX_ACTIVE_ENROLLMENTS} classes.` };
  }

  const { data: existing } = await supabase
    .from("Enrollment")
    .select("*")
    .eq("studentId", studentId)
    .eq("classId", classId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "ACTIVE") return { success: false, error: "Already enrolled in this class." };
    const { data, error } = await supabase
      .from("Enrollment")
      .update({ status: "ACTIVE" })
      .eq("id", existing.id)
      .select("id")
      .maybeSingle();
    if (error || !data) return { success: false, error: "Could not re-activate enrollment." };
  } else {
    const { error } = await supabase.from("Enrollment").insert({ id: crypto.randomUUID(), studentId, classId });
    if (error) return { success: false, error: "Could not enroll student." };
  }

  return { success: true, data: undefined };
}

export async function dropEnrollment(input: unknown): Promise<ActionResult> {
  const parsed = dropEnrollmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("Enrollment")
    .update({ status: "DROPPED" })
    .eq("id", parsed.data.enrollmentId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Could not drop enrollment." };
  return { success: true, data: undefined };
}

export async function updateStudentStatus(input: unknown): Promise<ActionResult> {
  const parsed = updateStudentStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { studentId, status } = parsed.data;

  const { data, error } = await supabase.from("Student").update({ status }).eq("id", studentId).select("id").maybeSingle();
  if (error || !data) return { success: false, error: "Could not update student status." };
  return { success: true, data: undefined };
}
```

- [ ] **Step 2: Write and run a verification script**

```ts
// scripts/verify-students-module.ts
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
  const assignment = await prisma.classAssignment.findFirst({
    include: { class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: true } } } }, coach: true },
  });
  if (!assignment || assignment.class.enrollments.length === 0) {
    throw new Error("No ClassAssignment with an active enrollment found — cannot run this check.");
  }
  const targetStudentId = assignment.class.enrollments[0].student.id;
  const otherCoach = await prisma.coach.findFirstOrThrow({ where: { email: { not: assignment.coach.email } } });

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");
  const { data: profile } = await assignedClient
    .from("Student")
    .select("*")
    .eq("id", targetStudentId)
    .maybeSingle();
  if (!profile) {
    console.error("FAIL: getStudentProfile-equivalent should return data for a student the assigned coach can see.");
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: deniedProfile } = await otherClient.from("Student").select("*").eq("id", targetStudentId).maybeSingle();
  if (deniedProfile) {
    console.error("FAIL: getStudentProfile-equivalent should return null for a non-assigned coach, got a row.");
    process.exit(1);
  }

  const { data: allStudentsForAssigned } = await assignedClient.from("Student").select("id").order("name", { ascending: true });
  if (!allStudentsForAssigned || !allStudentsForAssigned.some((s) => s.id === targetStudentId)) {
    console.error("FAIL: getStudentsForCoach-equivalent for the assigned coach should include the target student.");
    process.exit(1);
  }

  // An RLS-blocked update returns error: null, not an error — must check
  // .select()'s returned data for emptiness instead (see Global Constraints).
  const { data: statusUpdateResult } = await otherClient
    .from("Student")
    .update({ status: "GRADUATED" })
    .eq("id", targetStudentId)
    .select("id");
  if (statusUpdateResult && statusUpdateResult.length > 0) {
    console.error("FAIL: updateStudentStatus-equivalent should be rejected by RLS for a non-admin coach, got", statusUpdateResult);
    process.exit(1);
  }

  // The rejection case above only proves half of updateStudentStatus's two
  // outcomes — the allowed (admin) path is unverified without this.
  // Student's UPDATE policy (prisma/migrations/20260914110204_.../
  // migration.sql) is admin-only for every column, not just status — even
  // the assigned coach above can't write here, only read.
  const admin = await coachClient("admin@map.test", "Coach123!");
  const { data: adminStatusResult, error: adminStatusError } = await admin
    .from("Student")
    .update({ status: "ACTIVE" })
    .eq("id", targetStudentId)
    .select("id");
  if (adminStatusError || !adminStatusResult || adminStatusResult.length === 0) {
    console.error("FAIL: updateStudentStatus-equivalent should succeed for an admin, got", adminStatusError, adminStatusResult);
    process.exit(1);
  }

  // regenerateLoginCode-equivalent had zero coverage — rejection then
  // success, same admin-only policy as above. Saves and restores the
  // original code afterward so this doesn't disturb any other script that
  // depends on a known student's login code staying stable (e.g. the
  // hardcoded GHW7UD/VSKQR6 codes Tasks 2/3's scripts use) — targetStudentId
  // is picked dynamically and could be either of those students.
  const { data: studentBeforeCodeChange } = await admin.from("Student").select("loginCode").eq("id", targetStudentId).maybeSingle();
  if (!studentBeforeCodeChange) {
    throw new Error("Could not read the target student's current loginCode before testing regenerateLoginCode.");
  }

  const { data: nonAdminCodeResult } = await otherClient
    .from("Student")
    .update({ loginCode: "ZZZZZZ" })
    .eq("id", targetStudentId)
    .select("id");
  if (nonAdminCodeResult && nonAdminCodeResult.length > 0) {
    console.error("FAIL: regenerateLoginCode-equivalent should be rejected by RLS for a non-admin coach, got", nonAdminCodeResult);
    process.exit(1);
  }

  const tempLoginCode = `V${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const { data: adminCodeResult, error: adminCodeError } = await admin
    .from("Student")
    .update({ loginCode: tempLoginCode })
    .eq("id", targetStudentId)
    .select("id");
  if (adminCodeError || !adminCodeResult || adminCodeResult.length === 0) {
    console.error("FAIL: regenerateLoginCode-equivalent should succeed for an admin, got", adminCodeError, adminCodeResult);
    process.exit(1);
  }

  const { error: restoreCodeError } = await admin
    .from("Student")
    .update({ loginCode: studentBeforeCodeChange.loginCode })
    .eq("id", targetStudentId);
  if (restoreCodeError) {
    throw new Error(
      `Restoring the original loginCode after the regenerateLoginCode check failed: ${JSON.stringify(restoreCodeError)}. ` +
        `The target student's loginCode may now be "${tempLoginCode}" instead of its original value — fix manually.`,
    );
  }

  // enrollStudentInClass/dropEnrollment-equivalent had zero coverage —
  // both operate on Enrollment, which is admin-write-only under RLS for
  // insert/update/delete alike (same migration as above). Rejection then
  // success for both the insert path (enrollStudentInClass) and the
  // update-to-DROPPED path (dropEnrollment). Picks a class with NO
  // existing Enrollment row for this student (any status) — Enrollment
  // has a DB-level unique index on (studentId, classId), so reusing
  // assignment.classId (already enrolled) would violate it.
  const existingEnrollments = await prisma.enrollment.findMany({ where: { studentId: targetStudentId }, select: { classId: true } });
  const enrolledClassIds = new Set(existingEnrollments.map((e) => e.classId));
  const enrollTargetClass = await prisma.class.findFirst({ where: { id: { notIn: [...enrolledClassIds] } } });
  if (!enrollTargetClass) {
    throw new Error("Target student is already enrolled (in any status) in every seeded Class — cannot find a fresh class to test enrollment writes against.");
  }

  const { error: nonAdminEnrollError } = await otherClient
    .from("Enrollment")
    .insert({ id: crypto.randomUUID(), studentId: targetStudentId, classId: enrollTargetClass.id });
  if (!nonAdminEnrollError) {
    console.error("FAIL: enrollStudentInClass-equivalent should be rejected by RLS for a non-admin coach.");
    process.exit(1);
  }

  const enrollmentId = crypto.randomUUID();
  const { error: adminEnrollError } = await admin
    .from("Enrollment")
    .insert({ id: enrollmentId, studentId: targetStudentId, classId: enrollTargetClass.id });
  if (adminEnrollError) {
    console.error("FAIL: enrollStudentInClass-equivalent should succeed for an admin, got", adminEnrollError);
    process.exit(1);
  }

  const { data: nonAdminDropResult } = await otherClient.from("Enrollment").update({ status: "DROPPED" }).eq("id", enrollmentId).select("id");
  if (nonAdminDropResult && nonAdminDropResult.length > 0) {
    console.error("FAIL: dropEnrollment-equivalent should be rejected by RLS for a non-admin coach, got", nonAdminDropResult);
    process.exit(1);
  }

  const { data: adminDropResult, error: adminDropError } = await admin
    .from("Enrollment")
    .update({ status: "DROPPED" })
    .eq("id", enrollmentId)
    .select("id");
  if (adminDropError || !adminDropResult || adminDropResult.length === 0) {
    console.error("FAIL: dropEnrollment-equivalent should succeed for an admin, got", adminDropError, adminDropResult);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log(
    "PASS: Students module scopes profile/list visibility correctly under RLS; regenerateLoginCode/enrollStudentInClass/dropEnrollment/updateStudentStatus are all admin-gated (both outcomes each)",
  );
}

main();
```

Run: `npx tsx scripts/verify-students-module.ts`
Expected: `PASS: Students module scopes profile/list visibility correctly under RLS ...`

- [ ] **Step 3: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/students.ts scripts/verify-students-module.ts
git commit -m "feat: add client-side Students module"
```

---

## Task 8: Coach-shifts module

**Files:**
- Create: `src/lib/api/coach-shifts.ts`
- Create: `scripts/verify-coach-shifts-module.ts`

**Interfaces:**
- Consumes: `ActionResult` (Task 4).
- Produces: `getOpenShiftForCoach(coachId)`, `getShiftHistoryForCoach(coachId)`, `getPendingShifts()`, `getPaySummary(from, to)`, `clockIn(coachId, input): Promise<ActionResult<{shiftId: string}>>`, `clockOut(input): Promise<ActionResult>`, `editShift(input): Promise<ActionResult>`, `reopenShift(input): Promise<ActionResult>`, `approveShift(adminId, input): Promise<ActionResult>`, `rejectShift(adminId, input): Promise<ActionResult>`.

**Signature change, deliberate:** `clockIn`/`approveShift`/`rejectShift` now take the caller's own id as an explicit first parameter. The old versions got it from `requireCoach()`/`requireAdmin()` inside the action itself; there's no server session to pull it from anymore, and these three specifically need to *write* that id (as `coachId` on the new shift, or `approvedByCoachId`) — RLS can verify permission, but it can't invent the value. Plan 2b's callers pass `useSession()`'s `coach.id` in directly. `clockOut`/`editShift`/`reopenShift` don't need this — they look up an existing shift by `shiftId`, and RLS's own ownership check (Plan 1, Task 14) is sufficient.

**A real discrepancy found between Plan 1's already-shipped RLS and the old app's exact business rule — resolved by keeping the app-level check, not touching Plan 1:** the old `editShift` blocks editing an `APPROVED`/`REJECTED` shift **unconditionally, including for admins** ("reopen this shift before editing it"). Plan 1's `coach_shift_update` RLS policy (`is_admin() or (self AND status in OPEN,PENDING)`) is slightly more permissive than that — an admin's `is_admin()` bypasses the status check entirely, so RLS alone *would* let an admin edit a reviewed shift directly. Since Plan 1 is already shipped and this plan doesn't touch RLS policies, `editShift` below adds its own explicit `.in("status", ["OPEN","PENDING"])` filter on top of RLS to preserve the exact old behavior for everyone, admin included — RLS remains the security floor, this is a stricter business rule layered on top of it, same pattern as `approveShift`/`rejectShift` needing their own `PENDING`-only filter below (RLS's admin bypass doesn't know "already approved" is invalid to re-approve; only the app layer enforces that).

**Every `.update()` below chains `.select().maybeSingle()` and checks the result, not just `error`** — see Global Constraints for why (RLS-blocked updates return no error).

- [ ] **Step 1: Write the Coach-shifts module**

```ts
// src/lib/api/coach-shifts.ts
import { supabase } from "@/lib/supabase/client";
import { getSingaporeTodayString, getDayOfWeek } from "@/lib/dates";
import { blocksForDay } from "@/lib/shift-blocks";
import { clockInSchema, clockOutSchema, editShiftSchema, rejectShiftSchema } from "@/validations/coach-shift";
import type { ActionResult } from "./types";

export async function getOpenShiftForCoach(coachId: string) {
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, venue:Venue(*)")
    .eq("coachId", coachId)
    .eq("status", "OPEN")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getShiftHistoryForCoach(coachId: string) {
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, venue:Venue(*)")
    .eq("coachId", coachId)
    .order("clockInAt", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPendingShifts() {
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, coach:Coach(*), venue:Venue(*)")
    .eq("status", "PENDING")
    .order("clockInAt", { ascending: true });
  if (error) throw error;
  return data;
}

// from/to are "YYYY-MM-DD" strings — lexicographic comparison is correct
// for this format, same convention as everywhere else (src/lib/dates.ts).
export async function getPaySummary(from: string, to: string) {
  const { data, error } = await supabase
    .from("CoachShift")
    .select("*, coach:Coach(*), venue:Venue(*)")
    .eq("status", "APPROVED")
    .gte("shiftDate", from)
    .lte("shiftDate", to);
  if (error) throw error;
  return data.sort((a, b) => a.coach.name.localeCompare(b.coach.name) || a.shiftDate.localeCompare(b.shiftDate));
}

export async function clockIn(coachId: string, input: unknown): Promise<ActionResult<{ shiftId: string }>> {
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Pick a venue and session first." };

  const { data: existingOpen } = await supabase
    .from("CoachShift")
    .select("id")
    .eq("coachId", coachId)
    .eq("status", "OPEN")
    .maybeSingle();
  if (existingOpen) return { success: false, error: "You're already clocked in." };

  const today = getSingaporeTodayString();
  if (!blocksForDay(getDayOfWeek(today)).includes(parsed.data.shiftBlock)) {
    return { success: false, error: "That session isn't scheduled today." };
  }

  const { data, error } = await supabase
    .from("CoachShift")
    .insert({
      id: crypto.randomUUID(),
      coachId,
      venueId: parsed.data.venueId,
      shiftBlock: parsed.data.shiftBlock,
      shiftDate: today,
      clockInAt: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) return { success: false, error: "Could not clock in." };
  return { success: true, data: { shiftId: data.id } };
}

export async function clockOut(input: unknown): Promise<ActionResult> {
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid request." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ clockOutAt: new Date().toISOString(), status: "PENDING" })
    .eq("id", parsed.data.shiftId)
    .eq("status", "OPEN")
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "This shift isn't open, or isn't yours." };
  return { success: true, data: undefined };
}

export async function editShift(input: unknown): Promise<ActionResult> {
  const parsed = editShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const clockInAt = new Date(parsed.data.clockInAt);
  const clockOutAt = parsed.data.clockOutAt ? new Date(parsed.data.clockOutAt) : null;
  if (clockOutAt && clockOutAt <= clockInAt) {
    return { success: false, error: "Clock out must be after clock in." };
  }

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ clockInAt: clockInAt.toISOString(), clockOutAt: clockOutAt?.toISOString() ?? null })
    .eq("id", parsed.data.shiftId)
    // Matches the old app-level rule that even an admin must reopen an
    // APPROVED/REJECTED shift before editing — stricter than RLS's own
    // admin bypass, deliberately (see this task's discrepancy note above).
    .in("status", ["OPEN", "PENDING"])
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Not your shift, or it's already been reviewed — reopen it first." };
  return { success: true, data: undefined };
}

export async function reopenShift(input: unknown): Promise<ActionResult> {
  const parsed = clockOutSchema.safeParse(input); // same { shiftId } shape
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ status: "PENDING", approvedAt: null, approvedByCoachId: null })
    .eq("id", parsed.data.shiftId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Could not reopen shift." };
  return { success: true, data: undefined };
}

export async function approveShift(adminId: string, input: unknown): Promise<ActionResult> {
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({ status: "APPROVED", approvedByCoachId: adminId, approvedAt: new Date().toISOString() })
    .eq("id", parsed.data.shiftId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Only pending shifts can be approved." };
  return { success: true, data: undefined };
}

export async function rejectShift(adminId: string, input: unknown): Promise<ActionResult> {
  const parsed = rejectShiftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "A reason is required." };

  const { data, error } = await supabase
    .from("CoachShift")
    .update({
      status: "REJECTED",
      approvedByCoachId: adminId,
      approvedAt: new Date().toISOString(),
      reviewNote: parsed.data.reviewNote,
    })
    .eq("id", parsed.data.shiftId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Only pending shifts can be rejected." };
  return { success: true, data: undefined };
}
```

- [ ] **Step 2: Write and run a verification script**

```ts
// scripts/verify-coach-shifts-module.ts
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
  const shift = await prisma.coachShift.findFirstOrThrow({ include: { coach: true } });
  const otherCoach = await prisma.coach.findFirstOrThrow({ where: { email: { not: shift.coach.email } } });

  const owningClient = await coachClient(shift.coach.email, "Coach123!");
  const { data: ownRead } = await owningClient.from("CoachShift").select("id").eq("id", shift.id).maybeSingle();
  if (!ownRead) {
    console.error("FAIL: getShiftHistoryForCoach-equivalent should be able to read a coach's own shift.");
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  // An RLS-blocked update returns error: null — check the returned data,
  // not the error (see Global Constraints).
  const { data: blockedUpdate } = await otherClient
    .from("CoachShift")
    .update({ reviewNote: "should not apply" })
    .eq("id", shift.id)
    .select("id");
  if (blockedUpdate && blockedUpdate.length > 0) {
    console.error("FAIL: editShift-equivalent by a different coach should be rejected by RLS, got", blockedUpdate);
    process.exit(1);
  }

  const admin = await coachClient("admin@map.test", "Coach123!");
  const pendingShift = await prisma.coachShift.findFirst({ where: { status: "PENDING" } });
  if (pendingShift) {
    const adminRow = await prisma.coach.findUniqueOrThrow({ where: { email: "admin@map.test" } });
    const { data: approved, error: approveError } = await admin
      .from("CoachShift")
      .update({ status: "APPROVED", approvedByCoachId: adminRow.id, approvedAt: new Date().toISOString() })
      .eq("id", pendingShift.id)
      .eq("status", "PENDING")
      .select("id")
      .maybeSingle();
    if (approveError || !approved) {
      console.error("FAIL: approveShift-equivalent should succeed for admin on a PENDING shift, got", approveError, approved);
      process.exit(1);
    }
  } else {
    console.log("(no PENDING shift in seed data to test approveShift-equivalent against — skipped that assertion)");
  }

  await prisma.$disconnect();
  console.log("PASS: Coach-shifts module scopes reads/writes correctly under RLS, with the admin-approve path working");
}

main();
```

Run: `npx tsx scripts/verify-coach-shifts-module.ts`
Expected: `PASS: Coach-shifts module scopes reads/writes correctly under RLS ...`

- [ ] **Step 3: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/coach-shifts.ts scripts/verify-coach-shifts-module.ts
git commit -m "feat: add client-side Coach-shifts module"
```

---

## Task 9: Check-in scanning RPC + Checkins module

**Files:**
- Create: `prisma/migrations/<timestamp>_scan_check_in_rpc/migration.sql`
- Create: `src/lib/api/checkins.ts`
- Create: `scripts/verify-checkins-module.ts`

**Interfaces:**
- Produces: Postgres function `public.scan_check_in(p_code text) returns jsonb` (`SECURITY DEFINER`); `getCheckInCountForShift(coachShiftId): Promise<number>`, `scanCheckIn(input): Promise<ScanResult>` (client wrapper around the RPC).

**A gap in the spec, found while porting this function, not something the spec called out:** the spec only asked for one new RPC function (`registerAndCheckInStudent`, for insert-sequence atomicity — that's Task 12). But `scanCheckIn` has a sharper problem: it must look up **any** student by `loginCode` (a coach scanning a code at check-in isn't necessarily assigned to that student's class — that's the entire point of walk-up scanning), while Student RLS (Plan 1, Task 11 — deliberately, per the spec's own tightening) only lets a coach read students they're assigned to. A plain client-side `.from("Student").select(...).eq("loginCode", code)` would return nothing for the common case and silently break check-in scanning for any student outside the scanning coach's own assigned classes. This needs a `SECURITY DEFINER` function — one that runs with the elevated privileges of its owner, bypassing the caller's own RLS restrictions, but only exposes a narrow, fully-validated operation (open-shift check, code lookup, dedup check, insert) rather than a general "read any student" escape hatch. `gen_random_uuid()` is available on this project (confirmed directly) for the function's own id generation, since Prisma's `cuid()` default doesn't exist at the SQL level either (same underlying reason as the `crypto.randomUUID()` pattern used everywhere else in this plan).

**The same gap also breaks the old `sendGuardianCheckInNotification` (`src/lib/notifications.ts`) for exactly this scan flow, so its logic is folded into this RPC rather than ported as a separate client function.** That function re-reads the `CheckIn` row it was just told about, joined to `student`/`venue`, to build and store the guardian message — but the scanning coach has the same no-RLS-visibility problem into an unrelated walk-up student, so that nested read would silently come back empty in the same case that matters most. Since `scan_check_in` already has unrestricted access to the student/venue rows inside its own `SECURITY DEFINER` context, it builds the message and inserts `CheckInNotification` itself when the student is a MAP student, atomically with the `CheckIn` insert — mirroring the spec's own rationale for wrapping `registerAndCheckInStudent` in a function (no client round-trip that could see a `CheckIn` created with no matching notification, or fail because it can't see the data it would need to create one). The stored message text is built with a plain `YYYY-MM-DD` date in SQL rather than replicating `formatDateForDisplay`'s exact human-readable formatting — low-stakes, since it's simulated audit-log content (no real SMS/email provider exists, per the spec's Non-goals) and Task 2c (the new Notifications page) controls its own display formatting regardless of the stored string.

`sendGuardianCheckInNotification`/`buildGuardianCheckInMessage` are **not** ported to `src/lib/api/` at all, then — there is no case where a client calls them directly anymore. (`sendGuardianAttendanceNotification`, Task 10, is a different situation — a coach marking attendance for their own assigned class already has full RLS visibility into that student, so no RPC is needed there.)

- [ ] **Step 1: Write the RPC migration**

```sql
-- prisma/migrations/20260914113715_scan_check_in_rpc/migration.sql
--
-- SECURITY DEFINER: deliberately bypasses the caller's own Student RLS
-- restriction (assigned-coach-only) for this one narrow, validated
-- operation — a coach with a currently-OPEN shift may look up and check in
-- ANY student by loginCode, matching the app's walk-up-scanning design.
-- This is not a general read-any-student escape hatch: the function only
-- ever returns a minimal, safe subset (name, whether they're a MAP
-- student) plus the outcome, never the full Student row.
create or replace function public.scan_check_in(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id text;
  v_shift "CoachShift"%rowtype;
  v_student "Student"%rowtype;
  v_venue "Venue"%rowtype;
  v_checkin_date text;
  v_existing_id text;
  v_checkin_id text;
  v_message text;
begin
  v_coach_id := current_coach_id();
  if v_coach_id is null then
    return jsonb_build_object('outcome', 'error', 'error', 'Not signed in as a coach.');
  end if;

  select * into v_shift from "CoachShift" where "coachId" = v_coach_id and status = 'OPEN' limit 1;
  if not found then
    return jsonb_build_object('outcome', 'error', 'error', 'Clock in before scanning.');
  end if;

  select * into v_student from "Student" where "loginCode" = upper(p_code);
  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  v_checkin_date := to_char(now() at time zone 'Asia/Singapore', 'YYYY-MM-DD');

  select id into v_existing_id from "CheckIn"
    where "studentId" = v_student.id and "venueId" = v_shift."venueId" and "checkInDate" = v_checkin_date;
  if found then
    return jsonb_build_object('outcome', 'already_checked_in', 'studentName', v_student.name);
  end if;

  select * into v_venue from "Venue" where id = v_shift."venueId";

  v_checkin_id := gen_random_uuid()::text;
  insert into "CheckIn" (id, "studentId", "venueId", "checkInDate", "coachShiftId")
    values (v_checkin_id, v_student.id, v_shift."venueId", v_checkin_date, v_shift.id);

  -- Guardian notification, atomically with the CheckIn insert — see this
  -- task's note on why sendGuardianCheckInNotification is folded in here
  -- rather than called separately from client code afterward.
  if v_student."isMapStudent" then
    v_message := v_student.name || ' has checked in at ' || v_venue.name || ' on ' || v_checkin_date || '.';
    insert into "CheckInNotification" (id, "studentId", "checkInId", "recipientPhone", delivered, message)
      values (gen_random_uuid()::text, v_student.id, v_checkin_id, v_student."emergencyContactPhone", true, v_message);
    raise notice '[guardian-notify] SMS to %: %', v_student."emergencyContactPhone", v_message;
  end if;

  return jsonb_build_object('outcome', 'checked_in', 'studentName', v_student.name);
end;
$$;

grant execute on function public.scan_check_in(text) to authenticated;
revoke execute on function public.scan_check_in(text) from anon, public;
```

- [ ] **Step 2: Apply the migration**

Run: `npx prisma migrate deploy`
Expected: `1 migration found... applied.`

- [ ] **Step 3: Write the Checkins module**

```ts
// src/lib/api/checkins.ts
import { supabase } from "@/lib/supabase/client";
import { scanCheckInSchema } from "@/validations/checkin";

export type ScanResult =
  | { outcome: "checked_in"; studentName: string }
  | { outcome: "already_checked_in"; studentName: string }
  | { outcome: "not_found" }
  | { outcome: "error"; error: string };

export async function getCheckInCountForShift(coachShiftId: string): Promise<number> {
  const { count, error } = await supabase
    .from("CheckIn")
    .select("id", { count: "exact", head: true })
    .eq("coachShiftId", coachShiftId);
  if (error) throw error;
  return count ?? 0;
}

export async function scanCheckIn(input: unknown): Promise<ScanResult> {
  const parsed = scanCheckInSchema.safeParse(input);
  if (!parsed.success) return { outcome: "error", error: "Invalid code." };

  // The RPC handles the guardian notification internally too (when the
  // student is a MAP student) — see this task's note on why.
  const { data, error } = await supabase.rpc("scan_check_in", { p_code: parsed.data.code });
  if (error || !data) return { outcome: "error", error: "Could not check in." };

  const result = data as { outcome: string; studentName?: string; error?: string };
  if (result.outcome === "checked_in" || result.outcome === "already_checked_in") {
    return { outcome: result.outcome, studentName: result.studentName! };
  }
  if (result.outcome === "not_found") return { outcome: "not_found" };
  return { outcome: "error", error: result.error ?? "Could not check in." };
}
```

- [ ] **Step 4: Write and run a verification script**

```ts
// scripts/verify-checkins-module.ts
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
  // Prove the RLS gap this RPC exists to solve: a student NOT enrolled in
  // any class this coach is assigned to still can't be read directly.
  const shiftWithCoach = await prisma.coachShift.findFirstOrThrow({ where: { status: "OPEN" }, include: { coach: true } });
  const unrelatedStudent = await prisma.student.findFirstOrThrow({
    where: { enrollments: { none: { class: { assignments: { some: { coachId: shiftWithCoach.coachId } } } } } },
  });

  const client = await coachClient(shiftWithCoach.coach.email, "Coach123!");
  const { data: directRead } = await client.from("Student").select("id").eq("id", unrelatedStudent.id).maybeSingle();
  if (directRead) {
    console.error("FAIL (test setup wrong): expected this student to be unreadable directly by this coach under RLS.");
    process.exit(1);
  }

  const { data: rpcResult, error: rpcError } = await client.rpc("scan_check_in", { p_code: unrelatedStudent.loginCode });
  if (rpcError || !rpcResult || (rpcResult as { outcome: string }).outcome === "error") {
    console.error(
      "FAIL: scan_check_in RPC should succeed for a student outside this coach's assignments, given an open shift, got",
      rpcError,
      rpcResult,
    );
    process.exit(1);
  }

  if (unrelatedStudent.isMapStudent) {
    const notification = await prisma.checkInNotification.findFirst({
      where: { studentId: unrelatedStudent.id },
      orderBy: { sentAt: "desc" },
    });
    if (!notification) {
      console.error("FAIL: scan_check_in should have created a CheckInNotification row for a MAP student, found none.");
      process.exit(1);
    }
  }

  const noShiftCoach = await prisma.coach.findFirstOrThrow({
    where: { email: { not: shiftWithCoach.coach.email }, shifts: { none: { status: "OPEN" } } },
  });
  const noShiftClient = await coachClient(noShiftCoach.email, "Coach123!");
  const { data: noShiftResult } = await noShiftClient.rpc("scan_check_in", { p_code: unrelatedStudent.loginCode });
  if ((noShiftResult as { outcome: string })?.outcome !== "error") {
    console.error("FAIL: scan_check_in should return an error outcome for a coach with no open shift, got", noShiftResult);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("PASS: scan_check_in RPC bypasses the Student RLS gap correctly (only for a coach with an open shift) and rejects otherwise");
}

main();
```

Run: `npx tsx scripts/verify-checkins-module.ts`
Expected: `PASS: scan_check_in RPC bypasses the Student RLS gap correctly ...`

- [ ] **Step 5: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations scripts/verify-checkins-module.ts src/lib/api/checkins.ts
git commit -m "feat: add scan_check_in RPC and client-side Checkins module"
```

---

## Task 10: Attendance module

**Files:**
- Create: `src/lib/api/attendance.ts`
- Create: `scripts/verify-attendance-module.ts`

**Interfaces:**
- Consumes: `ActionResult` (Task 4); `formatClassLabel` (existing, unchanged — pure formatting logic, safe to reuse as-is, same as `src/lib/dates.ts`/`src/lib/shift-blocks.ts` elsewhere in this plan).
- Produces: `getRosterWithSession(classId, sessionDate)`, `getRecentSessionsForClass(classId, limit?)`, `markAttendanceRecord(coachId, input): Promise<ActionResult<{status: string; sessionId: string}>>`, `submitAttendanceSession(input): Promise<ActionResult<{notified: number; skipped: number}>>`, `reopenAttendanceSession(input): Promise<ActionResult>`, `sendGuardianAttendanceNotification(input): Promise<{delivered: boolean}>`, `buildGuardianMessage(input): string`.

**Unlike Task 9's `scanCheckIn`, no RPC is needed here for RLS reasons:** a coach marking attendance for a session is, by definition, assigned to that class (`AttendanceSession`/`AttendanceRecord` RLS, Plan 1 Task 12, already requires it) — and every student on the roster is enrolled in that same class, so `sendGuardianAttendanceNotification`'s `Student` read is always within the calling coach's RLS-visible set. This function stays a plain client function, not folded into a Postgres function.

**Same `coach_public`-view-can't-be-nested-joined limitation as Task 5/6 (`getClassDetail`/`getCoachProfile`):** `AttendanceSession.markedByCoach` and `getRecentSessionsForClass`'s per-session `markedByCoach` are resolved as a second query into `coach_public` + JS merge, not a nested select — the coach who marked a session isn't necessarily the coach currently viewing it (an admin or a co-assigned coach might view a session someone else marked), so the base `Coach` table's self-or-admin RLS can't be relied on here.

**`canAccessClass` (`src/lib/authorization.ts`) is not ported.** Every check it performed is now enforced automatically by `AttendanceSession`/`AttendanceRecord` RLS (Plan 1, Task 12) on every read and write — there's nothing left for a client-side equivalent to do.

- [ ] **Step 1: Write the Attendance module**

```ts
// src/lib/api/attendance.ts
import { supabase } from "@/lib/supabase/client";
import { formatClassLabel } from "@/lib/format";
import { formatDateForDisplay } from "@/lib/dates";
import { markAttendanceSchema, submitSessionSchema, reopenSessionSchema } from "@/validations/attendance";
import type { ActionResult } from "./types";

export async function getRosterWithSession(classId: string, sessionDate: string) {
  const [{ data: cls, error: clsError }, { data: enrollments, error: enrollmentsError }, { data: session, error: sessionError }] =
    await Promise.all([
      supabase.from("Class").select("*, venue:Venue(*)").eq("id", classId).maybeSingle(),
      supabase.from("Enrollment").select("*, student:Student(*)").eq("classId", classId).eq("status", "ACTIVE"),
      supabase
        .from("AttendanceSession")
        .select("*, records:AttendanceRecord(*)")
        .eq("classId", classId)
        .eq("sessionDate", sessionDate)
        .maybeSingle(),
    ]);
  if (clsError) throw clsError;
  if (enrollmentsError) throw enrollmentsError;
  if (sessionError) throw sessionError;
  if (!cls) return null;

  let sessionWithCoach: (typeof session & { markedByCoach: { id: string; name: string; isAdmin: boolean } | null }) | null = null;
  if (session) {
    const { data: coach } = session.markedByCoachId
      ? await supabase.from("coach_public").select("id, name, isAdmin").eq("id", session.markedByCoachId).maybeSingle()
      : { data: null };
    sessionWithCoach = { ...session, markedByCoach: coach };
  }

  const recordByStudent = new Map((session?.records ?? []).map((r) => [r.studentId, r]));
  const roster = enrollments
    .sort((a, b) => a.student.name.localeCompare(b.student.name))
    .map((e) => ({ student: e.student, record: recordByStudent.get(e.studentId) ?? null }));

  return { class: cls, session: sessionWithCoach, roster };
}

export async function getRecentSessionsForClass(classId: string, limit = 8) {
  const { data: sessions, error } = await supabase
    .from("AttendanceSession")
    .select("*, records:AttendanceRecord(id)")
    .eq("classId", classId)
    .order("sessionDate", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (sessions.length === 0) return [];

  const coachIds = [...new Set(sessions.map((s) => s.markedByCoachId).filter((id): id is string => !!id))];
  const { data: coaches } =
    coachIds.length === 0 ? { data: [] as { id: string; name: string; isAdmin: boolean }[] } : await supabase.from("coach_public").select("id, name, isAdmin").in("id", coachIds);
  const coachById = new Map((coaches ?? []).map((c) => [c.id, c]));

  return sessions.map((s) => ({
    ...s,
    markedByCoach: s.markedByCoachId ? (coachById.get(s.markedByCoachId) ?? null) : null,
    _count: { records: s.records.length },
  }));
}

export function buildGuardianMessage(input: {
  studentName: string;
  classLabel: string;
  status: "PRESENT" | "LATE";
  sessionDate: string;
}): string {
  const statusLabel = input.status === "PRESENT" ? "present" : "late";
  return `${input.studentName} has arrived and was marked ${statusLabel} for ${input.classLabel} on ${formatDateForDisplay(input.sessionDate)}.`;
}

export async function sendGuardianAttendanceNotification(input: {
  studentId: string;
  classId: string;
  sessionDate: string;
  status: "PRESENT" | "LATE";
}): Promise<{ delivered: boolean }> {
  const [{ data: student, error: studentError }, { data: cls, error: classError }] = await Promise.all([
    supabase.from("Student").select("*").eq("id", input.studentId).maybeSingle(),
    supabase.from("Class").select("*").eq("id", input.classId).maybeSingle(),
  ]);
  if (studentError) throw studentError;
  if (classError) throw classError;
  if (!student) throw new Error("Student not found.");
  if (!cls) throw new Error("Class not found.");

  const delivered = student.emergencyContactPhone != null;
  const message = buildGuardianMessage({
    studentName: student.name,
    classLabel: formatClassLabel(cls),
    status: input.status,
    sessionDate: input.sessionDate,
  });

  if (delivered) {
    console.log(`[guardian-notify] SMS to ${student.emergencyContactPhone}: ${message}`);
  }

  const { data: existing } = await supabase
    .from("GuardianNotification")
    .select("id")
    .eq("studentId", input.studentId)
    .eq("classId", input.classId)
    .eq("sessionDate", input.sessionDate)
    .maybeSingle();

  const row = {
    studentId: input.studentId,
    classId: input.classId,
    sessionDate: input.sessionDate,
    status: input.status,
    recipientPhone: student.emergencyContactPhone,
    delivered,
    message,
    sentAt: new Date().toISOString(),
  };
  const { error: writeError } = existing
    ? await supabase.from("GuardianNotification").update(row).eq("id", existing.id)
    : await supabase.from("GuardianNotification").insert({ id: crypto.randomUUID(), ...row });
  if (writeError) throw writeError;

  return { delivered };
}

export async function markAttendanceRecord(
  coachId: string,
  input: unknown,
): Promise<ActionResult<{ status: string; sessionId: string }>> {
  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, sessionDate, studentId, status, excused, remarks } = parsed.data;

  // Upsert on (classId, sessionDate) so double-tapping/double-submitting
  // is safe — same reasoning as the old Prisma version.
  const { data: session, error: sessionError } = await supabase
    .from("AttendanceSession")
    .upsert({ classId, sessionDate, markedByCoachId: coachId }, { onConflict: "classId,sessionDate" })
    .select("*")
    .maybeSingle();
  if (sessionError || !session) return { success: false, error: "You don't have access to this class." };

  if (session.submittedAt) {
    return { success: false, error: "This session is locked — reopen it to make changes." };
  }

  const { error: recordError } = await supabase
    .from("AttendanceRecord")
    .upsert(
      { attendanceSessionId: session.id, studentId, status, excused: excused ?? false, remarks },
      { onConflict: "attendanceSessionId,studentId" },
    );
  if (recordError) return { success: false, error: "Could not save attendance." };

  return { success: true, data: { status, sessionId: session.id } };
}

export async function submitAttendanceSession(input: unknown): Promise<ActionResult<{ notified: number; skipped: number }>> {
  const parsed = submitSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const { classId, sessionDate } = parsed.data;

  const { data: session, error: sessionError } = await supabase
    .from("AttendanceSession")
    .select("*, records:AttendanceRecord(*)")
    .eq("classId", classId)
    .eq("sessionDate", sessionDate)
    .maybeSingle();
  if (sessionError) return { success: false, error: "You don't have access to this class." };
  if (!session) return { success: false, error: "No attendance has been taken for this session yet." };

  const { count: activeCount } = await supabase
    .from("Enrollment")
    .select("id", { count: "exact", head: true })
    .eq("classId", classId)
    .eq("status", "ACTIVE");
  if (session.records.length < (activeCount ?? 0)) {
    return { success: false, error: "Mark every student before saving." };
  }

  const { data: updated, error: updateError } = await supabase
    .from("AttendanceSession")
    .update({ submittedAt: new Date().toISOString() })
    .eq("id", session.id)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) return { success: false, error: "Could not submit this session." };

  // Guardians of anyone who showed up (Present/Late) get notified — Absent
  // never fires one. Best-effort: a notification failure doesn't undo the
  // already-saved attendance, it just doesn't count toward `notified`.
  const arrivals = session.records.filter(
    (r: { status: string }): r is { studentId: string; status: "PRESENT" | "LATE" } => r.status === "PRESENT" || r.status === "LATE",
  );
  let notified = 0;
  let skipped = 0;
  for (const record of arrivals) {
    try {
      const result = await sendGuardianAttendanceNotification({
        studentId: record.studentId,
        classId,
        sessionDate,
        status: record.status,
      });
      if (result.delivered) notified++;
      else skipped++;
    } catch {
      skipped++;
    }
  }

  return { success: true, data: { notified, skipped } };
}

export async function reopenAttendanceSession(input: unknown): Promise<ActionResult> {
  const parsed = reopenSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { data, error } = await supabase
    .from("AttendanceSession")
    .update({ submittedAt: null })
    .eq("id", parsed.data.sessionId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Session not found, or you don't have access to it." };
  return { success: true, data: undefined };
}
```

- [ ] **Step 2: Write and run a verification script**

```ts
// scripts/verify-attendance-module.ts
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
  const assignment = await prisma.classAssignment.findFirstOrThrow({ include: { coach: true } });
  const otherCoach = await prisma.coach.findFirstOrThrow({ where: { email: { not: assignment.coach.email } } });
  const sessionDate = "2020-01-01"; // arbitrary, unused-so-far date — avoids clashing with real seed sessions

  const assignedClient = await coachClient(assignment.coach.email, "Coach123!");
  const { data: session, error: upsertError } = await assignedClient
    .from("AttendanceSession")
    .upsert({ classId: assignment.classId, sessionDate, markedByCoachId: assignment.coachId }, { onConflict: "classId,sessionDate" })
    .select("*")
    .maybeSingle();
  if (upsertError || !session) {
    console.error("FAIL: markAttendanceRecord-equivalent's session upsert should succeed for the assigned coach, got", upsertError);
    process.exit(1);
  }

  const otherClient = await coachClient(otherCoach.email, "Coach123!");
  const { data: blockedUpsert } = await otherClient
    .from("AttendanceSession")
    .upsert({ classId: assignment.classId, sessionDate, markedByCoachId: otherCoach.id }, { onConflict: "classId,sessionDate" })
    .select("id");
  // Either an error, or (since upsert on a visible-to-nobody-else row can
  // itself be blocked at the INSERT-vs-UPDATE branch differently) empty data.
  if (blockedUpsert && blockedUpsert.length > 0) {
    const { data: reread } = await assignedClient.from("AttendanceSession").select("markedByCoachId").eq("id", session.id).single();
    if (reread?.markedByCoachId === otherCoach.id) {
      console.error("FAIL: a non-assigned coach's session upsert should not have applied, got", blockedUpsert, reread);
      process.exit(1);
    }
  }

  await prisma.attendanceSession.delete({ where: { id: session.id } }); // clean up the test fixture
  await prisma.$disconnect();
  console.log("PASS: Attendance module scopes session marking correctly to assigned coaches under RLS");
}

main();
```

Run: `npx tsx scripts/verify-attendance-module.ts`
Expected: `PASS: Attendance module scopes session marking correctly to assigned coaches under RLS`

- [ ] **Step 3: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/attendance.ts scripts/verify-attendance-module.ts
git commit -m "feat: add client-side Attendance module"
```

---

## Task 11: Registration RPC + module

**Files:**
- Create: `prisma/migrations/<timestamp>_register_and_checkin_rpc/migration.sql`
- Create: `src/lib/api/registration.ts`
- Create: `scripts/verify-registration-module.ts`

**Interfaces:**
- Consumes: `register-student` Edge Function (Plan 1).
- Produces: Postgres function `public.register_and_checkin_student(p_student jsonb) returns jsonb` (`SECURITY DEFINER` — see correction below); `registerStudent(input): Promise<ActionResult<{studentId: string; loginCode: string}>>` (Edge Function wrapper), `registerAndCheckInStudent(input): Promise<ActionResult<{studentId: string; loginCode: string}>>` (RPC wrapper).

**A correction to the spec, found while implementing it, not a judgment call:** the spec says this RPC should be `SECURITY INVOKER` ("so a mid-sequence failure can't leave a Student row with no matching CheckIn"). But the spec's *own* RLS table, already shipped in Plan 1 (Task 11), gives `Student` **no INSERT policy for `authenticated` at all** — the migration's own comment says so explicitly: "rows are created only by the register-student and admin-create-... Edge Functions, which use the service-role key and bypass RLS entirely." A `SECURITY INVOKER` function runs *as the calling coach*, still fully subject to their RLS — it would hit the exact same "no insert policy = denied" wall a plain client `.insert()` would, and not solve anything. Only `SECURITY DEFINER` (running with the function owner's privileges, bypassing the caller's RLS) can actually insert a `Student` row here. This function uses `SECURITY DEFINER`, validating identity and business rules explicitly inside the function body instead of relying on RLS to gate it — same pattern as Task 9's `scan_check_in`, and for the same underlying reason (`Student` intentionally has no open write path).

**`registerStudent` is a thin wrapper around Plan 1's `register-student` Edge Function** (per the earlier decision to reuse it rather than re-derive), not a new RPC — it's already unauthenticated-callable and already does everything the spec asks. **Note for Plan 2b:** `registerStudentSchema` (`src/validations/registration.ts`, unchanged — not in this plan's Files list) validates `isMapStudent` as the *string* `"true"`/`"false"` (a FormData-submission convention) and transforms it to a real boolean before this module ever sees it — whichever form component Plan 2b builds for `/register` and `/checkin/register` must keep submitting it that way (or the schema needs a matching, deliberate update alongside the form, not a silent mismatch).

- [ ] **Step 1: Write the RPC migration**

```sql
-- prisma/migrations/20260914114125_register_and_checkin_rpc/migration.sql
--
-- SECURITY DEFINER, not SECURITY INVOKER as the spec suggested — see this
-- task's note above. Student has no authenticated INSERT policy at all
-- (Plan 1, Task 11), so only a definer function can create this row; the
-- function itself is the authorization boundary, validated explicitly
-- below (open-shift check) rather than delegated to RLS.
create or replace function public.register_and_checkin_student(p_student jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id text;
  v_shift "CoachShift"%rowtype;
  v_login_code text;
  v_student_id text;
  v_checkin_id text;
  v_checkin_date text;
  v_is_map_student boolean;
  v_venue "Venue"%rowtype;
  v_message text;
  v_attempt int;
begin
  v_coach_id := current_coach_id();
  if v_coach_id is null then
    return jsonb_build_object('error', 'Not signed in as a coach.');
  end if;

  select * into v_shift from "CoachShift" where "coachId" = v_coach_id and status = 'OPEN' limit 1;
  if not found then
    return jsonb_build_object('error', 'Clock in before registering a visitor.');
  end if;

  -- Unique login code: same alphabet and collision-retry shape as
  -- Plan 1's register-student Edge Function and src/lib/login-code.ts.
  for v_attempt in 1..10 loop
    v_login_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 33) + 1)::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from "Student" where "loginCode" = v_login_code);
  end loop;

  v_student_id := gen_random_uuid()::text;
  v_is_map_student := coalesce((p_student->>'isMapStudent')::boolean, true);

  insert into "Student" (
    id, name, level, "contactNumber", "schoolName", email, "isMapStudent",
    "emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone",
    "referralSource", "loginCode"
  ) values (
    v_student_id,
    p_student->>'name',
    (p_student->>'level')::"Level",
    p_student->>'contactNumber',
    p_student->>'schoolName',
    p_student->>'email',
    v_is_map_student,
    p_student->>'emergencyContactName',
    (p_student->>'emergencyContactRelationship')::"EmergencyContactRelationship",
    p_student->>'emergencyContactPhone',
    nullif(p_student->>'referralSource', '')::"ReferralSource",
    v_login_code
  );

  v_checkin_date := to_char(now() at time zone 'Asia/Singapore', 'YYYY-MM-DD');
  v_checkin_id := gen_random_uuid()::text;
  insert into "CheckIn" (id, "studentId", "venueId", "checkInDate", "coachShiftId")
    values (v_checkin_id, v_student_id, v_shift."venueId", v_checkin_date, v_shift.id);

  -- Same atomic-notification reasoning as scan_check_in (Task 9).
  if v_is_map_student then
    select * into v_venue from "Venue" where id = v_shift."venueId";
    v_message := (p_student->>'name') || ' has checked in at ' || v_venue.name || ' on ' || v_checkin_date || '.';
    insert into "CheckInNotification" (id, "studentId", "checkInId", "recipientPhone", delivered, message)
      values (gen_random_uuid()::text, v_student_id, v_checkin_id, p_student->>'emergencyContactPhone', true, v_message);
    raise notice '[guardian-notify] SMS to %: %', p_student->>'emergencyContactPhone', v_message;
  end if;

  return jsonb_build_object('studentId', v_student_id, 'loginCode', v_login_code);
end;
$$;

grant execute on function public.register_and_checkin_student(jsonb) to authenticated;
revoke execute on function public.register_and_checkin_student(jsonb) from anon, public;
```

- [ ] **Step 2: Apply the migration**

Run: `npx prisma migrate deploy`
Expected: `1 migration found... applied.`

- [ ] **Step 3: Write the Registration module**

```ts
// src/lib/api/registration.ts
import { supabase } from "@/lib/supabase/client";
import { registerStudentSchema } from "@/validations/registration";
import type { ActionResult } from "./types";

export async function registerStudent(input: unknown): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const { data, error } = await supabase.functions.invoke<{ studentId?: string; loginCode?: string; error?: string }>(
    "register-student",
    { body: parsed.data },
  );
  if (error || !data?.studentId || !data.loginCode) {
    return { success: false, error: data?.error ?? "Please check the form — something wasn't filled in correctly." };
  }
  return { success: true, data: { studentId: data.studentId, loginCode: data.loginCode } };
}

export async function registerAndCheckInStudent(
  input: unknown,
): Promise<ActionResult<{ studentId: string; loginCode: string }>> {
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check the form — something wasn't filled in correctly." };

  const { data, error } = await supabase.rpc("register_and_checkin_student", { p_student: parsed.data });
  const result = data as { studentId?: string; loginCode?: string; error?: string } | null;
  if (error || !result?.studentId || !result.loginCode) {
    return { success: false, error: result?.error ?? "Could not register and check in." };
  }
  return { success: true, data: { studentId: result.studentId, loginCode: result.loginCode } };
}
```

- [ ] **Step 4: Write and run a verification script**

```ts
// scripts/verify-registration-module.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const prisma = new PrismaClient();

const SAMPLE_STUDENT = {
  name: "Verify Registration Module",
  level: "P4",
  contactNumber: "91234567",
  schoolName: "Test Primary School",
  email: `verify-registration-${Date.now()}@example.com`,
  isMapStudent: true,
  emergencyContactName: "Test Guardian",
  emergencyContactRelationship: "MOTHER",
  emergencyContactPhone: "91234567",
};

async function coachClient(email: string, password: string) {
  const res = await fetch(`${url}/functions/v1/coach-login`, {
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
  const anon = createClient(url, anonKey);
  const { data: fnData, error: fnError } = await anon.functions.invoke("register-student", { body: SAMPLE_STUDENT });
  if (fnError || !fnData?.studentId) {
    console.error("FAIL: registerStudent-equivalent (unauthenticated) should succeed, got", fnError, fnData);
    process.exit(1);
  }

  const openShiftCoach = await prisma.coach.findFirst({ where: { shifts: { some: { status: "OPEN" } } } });
  if (!openShiftCoach) {
    console.log("(no coach with an OPEN shift in seed data — skipping registerAndCheckInStudent-equivalent's success path)");
  } else {
    const client = await coachClient(openShiftCoach.email, "Coach123!");
    const { data: rpcData, error: rpcError } = await client.rpc("register_and_checkin_student", {
      p_student: { ...SAMPLE_STUDENT, email: `verify-registration-checkin-${Date.now()}@example.com` },
    });
    const rpcResult = rpcData as { studentId?: string; loginCode?: string; error?: string } | null;
    if (rpcError || !rpcResult?.studentId) {
      console.error("FAIL: register_and_checkin_student should succeed for a coach with an open shift, got", rpcError, rpcResult);
      process.exit(1);
    }
    const notification = await prisma.checkInNotification.findFirst({ where: { studentId: rpcResult.studentId } });
    if (!notification) {
      console.error("FAIL: register_and_checkin_student should have created a CheckInNotification for a MAP student.");
      process.exit(1);
    }
  }

  const noShiftCoach = await prisma.coach.findFirstOrThrow({ where: { shifts: { none: { status: "OPEN" } } } });
  const noShiftClient = await coachClient(noShiftCoach.email, "Coach123!");
  const { data: deniedData } = await noShiftClient.rpc("register_and_checkin_student", {
    p_student: { ...SAMPLE_STUDENT, email: `verify-registration-denied-${Date.now()}@example.com` },
  });
  if ((deniedData as { studentId?: string } | null)?.studentId) {
    console.error("FAIL: register_and_checkin_student should be rejected for a coach with no open shift, got", deniedData);
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("PASS: registerStudent (public) and register_and_checkin_student (open-shift-gated) both work correctly");
}

main();
```

Run: `npx tsx scripts/verify-registration-module.ts`
Expected: `PASS: registerStudent (public) and register_and_checkin_student (open-shift-gated) both work correctly`

- [ ] **Step 5: Confirm the app still builds**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations scripts/verify-registration-module.ts src/lib/api/registration.ts
git commit -m "feat: add register_and_checkin_student RPC and client-side Registration module"
```

---

## Task 12: Full-suite verification and plan closeout

**Files:** None new — this task only runs what already exists.

- [ ] **Step 1: Run every new verification script in one pass**

```bash
for f in scripts/verify-browser-client.ts scripts/verify-session-resolution.ts scripts/verify-login-logic.ts \
         scripts/verify-venues-curriculum.ts scripts/verify-classes.ts scripts/verify-coaches-module.ts \
         scripts/verify-students-module.ts scripts/verify-coach-shifts-module.ts scripts/verify-checkins-module.ts \
         scripts/verify-attendance-module.ts scripts/verify-registration-module.ts; do
  echo "=== $f ===";
  npx tsx "$f" || { echo "STOPPED at $f"; break; }
done
```

Expected: every script prints a line starting with `PASS:`, none print `FAIL:` or `STOPPED at`.

- [ ] **Step 2: Confirm the old app is genuinely untouched**

Run: `git diff --stat a5c574a..HEAD -- src/app src/actions src/data src/auth.ts src/auth.config.ts src/middleware.ts` (substitute the actual commit this plan branched from if different)
Expected: empty output — zero changes to any file this plan promised not to touch (Global Constraints).

- [ ] **Step 3: Confirm the app still builds**

Run: `npm run build`
Expected: succeeds exactly as before this plan (new, currently-unused `src/lib/api/`/`src/lib/supabase/` files don't change anything the existing pages import).

- [ ] **Step 4: Confirm `prisma migrate status` is clean**

Run: `npx prisma migrate status`
Expected: `Database schema is up to date!`

- [ ] **Step 5: Final commit**

```bash
git add -A
git status # confirm nothing unexpected is staged before committing
git commit -m "chore: complete Supabase client-side data and auth foundation (Plan 2a)" --allow-empty
```

**Plan 2b** (page-by-page conversion of all 18 Server Component pages + 9 form components to Client Components on top of this plan's `src/lib/api/`/`src/lib/supabase/session.tsx`) gets written next. Its first task must be the login-page-and-middleware cutover this plan deliberately deferred (see this plan's header) — everything else in this plan is ready for it to consume as-is.

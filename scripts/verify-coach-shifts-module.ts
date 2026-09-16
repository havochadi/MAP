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
  return { client, session };
}

async function main() {
  const shift = await prisma.coachShift.findFirstOrThrow({ include: { coach: true } });
  // Same residue-poisoning risk the fixture predicate below was hardened
  // against (final-review finding I2's re-review flagged this site too,
  // out of scope for that fix round but trivial to close alongside it): a
  // throwaway verify-* coach could otherwise be picked here, and this
  // script's coachClient() call always logs in with the hardcoded
  // "Coach123!", not that residue coach's real password.
  const otherCoach = await prisma.coach.findFirstOrThrow({
    where: { AND: [{ email: { not: shift.coach.email } }, { email: { not: { startsWith: "verify-" } } }] },
  });

  const { client: owningClient } = await coachClient(shift.coach.email, "Coach123!");
  const { data: ownRead } = await owningClient.from("CoachShift").select("id").eq("id", shift.id).maybeSingle();
  if (!ownRead) {
    console.error("FAIL: getShiftHistoryForCoach-equivalent should be able to read a coach's own shift.");
    process.exit(1);
  }

  const { client: otherClient } = await coachClient(otherCoach.email, "Coach123!");
  // An RLS-blocked update returns error: null — check the returned data,
  // not the error (see Global Constraints).
  const { data: blockedUpdate } = await otherClient
    .from("CoachShift")
    .update({ reviewNote: "should not apply" })
    .eq("id", shift.id)
    .select("id");
  if (blockedUpdate && blockedUpdate.length > 0) {
    console.error("FAIL: a different coach editing someone else's shift should be rejected by RLS, got", blockedUpdate);
    process.exit(1);
  }

  // Everything above only covers getShiftHistoryForCoach/editShift's raw
  // RLS-ownership surface — 8 of this task's 10 functions (getOpenShiftForCoach,
  // getPendingShifts, getPaySummary, clockIn, clockOut, editShift's own
  // success path, reopenShift, approveShift, rejectShift) had zero coverage.
  // This drives a full, realistic lifecycle through the real, exported
  // functions (not raw queries) — clockIn/approveShift/rejectShift/
  // reopenShift all have app-level business logic (existingOpen check,
  // day/block validation, admin-only PENDING-only filters, the
  // reopen-before-edit rule) a raw query wouldn't naturally exercise, the
  // same reasoning already applied to enrollStudentInClass in Task 7.
  //
  // Uses a FRESH shift created via clockIn (crypto.randomUUID(), unlimited
  // capacity) rather than searching for pre-existing seed data in a
  // particular status — unlike Task 7's Enrollment/Class scarcity, this
  // needs no teardown and is safe to run repeatedly (the test coach always
  // ends in a terminal REJECTED state, never OPEN, so a later run's
  // "no open shift" precondition still holds).
  const {
    getOpenShiftForCoach,
    getShiftHistoryForCoach,
    getPendingShifts,
    getPaySummary,
    clockIn,
    clockOut,
    editShift,
    reopenShift,
    approveShift,
    rejectShift,
  } = await import("../src/lib/api/coach-shifts");
  const { supabase: sharedSupabase } = await import("../src/lib/supabase/client");
  const { getSingaporeTodayString, getDayOfWeek } = await import("../src/lib/dates");
  const { blocksForDay } = await import("../src/lib/shift-blocks");

  async function signInShared(email: string) {
    const { session } = await coachClient(email, "Coach123!");
    await sharedSupabase.auth.setSession(session);
  }

  const today = getSingaporeTodayString();
  const todaysBlocks = blocksForDay(getDayOfWeek(today));

  if (todaysBlocks.length === 0) {
    // clockIn only accepts a shiftBlock scheduled for today's real
    // day-of-week (TUE/THU/SAT/SUN) — a genuine, inherent constraint of
    // its own business design, not something this test can route around
    // without faking the clock. Skipping gracefully (not failing) matches
    // this file's own existing precedent for the "no PENDING shift in seed
    // data" case below.
    console.log(`(today, ${today}, has no scheduled shift blocks — skipping the clockIn-dependent lifecycle assertions)`);
  } else {
    const clockInTestCoach = await prisma.coach.findFirst({
      where: { isAdmin: false, email: { not: { startsWith: "verify-" } }, shifts: { none: { status: "OPEN" } } },
    });
    if (!clockInTestCoach) {
      throw new Error("No non-admin coach without an OPEN shift found — cannot test clockIn's lifecycle.");
    }
    // Deliberately excludes clockInTestCoach.id, not just shift.coach's
    // email (the outer otherCoach) — those two aren't guaranteed distinct
    // from clockInTestCoach, and reusing outer `otherCoach` here silently
    // turned every "non-owner should be rejected" assertion below into a
    // same-person self-access test that trivially "passed" for the wrong
    // reason (confirmed empirically: they resolved to the same coach in
    // this project's actual seed data on the run that caught this).
    const nonOwningCoach = await prisma.coach.findFirstOrThrow({ where: { isAdmin: false, id: { not: clockInTestCoach.id } } });
    const testVenue = await prisma.venue.findFirstOrThrow();
    const testShiftBlock = todaysBlocks[0];

    await signInShared(clockInTestCoach.email);

    const clockInResult = await clockIn(clockInTestCoach.id, { venueId: testVenue.id, shiftBlock: testShiftBlock });
    if (!clockInResult.success) {
      console.error("FAIL: clockIn should succeed for a coach with no open shift, got", clockInResult);
      process.exit(1);
    }
    const testShiftId = clockInResult.data.shiftId;

    const secondClockInResult = await clockIn(clockInTestCoach.id, { venueId: testVenue.id, shiftBlock: testShiftBlock });
    if (secondClockInResult.success || secondClockInResult.error !== "You're already clocked in.") {
      console.error("FAIL: clockIn should reject a second clock-in with its specific message, got", secondClockInResult);
      process.exit(1);
    }

    const openShift = await getOpenShiftForCoach(clockInTestCoach.id);
    if (!openShift || openShift.id !== testShiftId || !openShift.venue?.name) {
      console.error("FAIL: getOpenShiftForCoach should return the just-created open shift with venue joined, got", openShift);
      process.exit(1);
    }

    await signInShared(nonOwningCoach.email);
    const nonOwnerClockOutResult = await clockOut({ shiftId: testShiftId });
    if (nonOwnerClockOutResult.success) {
      console.error("FAIL: clockOut should be rejected for a coach who doesn't own the shift, got", nonOwnerClockOutResult);
      process.exit(1);
    }

    await signInShared(clockInTestCoach.email);
    const clockOutResult = await clockOut({ shiftId: testShiftId });
    if (!clockOutResult.success) {
      console.error("FAIL: clockOut should succeed for the owning coach on their own OPEN shift, got", clockOutResult);
      process.exit(1);
    }

    const history = await getShiftHistoryForCoach(clockInTestCoach.id);
    if (!history.some((s) => s.id === testShiftId)) {
      console.error("FAIL: getShiftHistoryForCoach should include the just-clocked-out shift.");
      process.exit(1);
    }

    const editResult = await editShift({
      shiftId: testShiftId,
      clockInAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      clockOutAt: new Date().toISOString(),
    });
    if (!editResult.success) {
      console.error("FAIL: editShift should succeed on a PENDING shift, got", editResult);
      process.exit(1);
    }

    await signInShared("admin@map.test");
    const adminRow = await prisma.coach.findUniqueOrThrow({ where: { email: "admin@map.test" } });
    const pending = await getPendingShifts();
    if (!pending.some((s) => s.id === testShiftId)) {
      console.error("FAIL: getPendingShifts should include the test shift.");
      process.exit(1);
    }

    await signInShared(nonOwningCoach.email);
    const nonAdminApproveResult = await approveShift(nonOwningCoach.id, { shiftId: testShiftId });
    if (nonAdminApproveResult.success) {
      console.error("FAIL: approveShift should be rejected for a non-admin, got", nonAdminApproveResult);
      process.exit(1);
    }

    await signInShared("admin@map.test");
    const approveResult = await approveShift(adminRow.id, { shiftId: testShiftId });
    if (!approveResult.success) {
      console.error("FAIL: approveShift should succeed for an admin on a PENDING shift, got", approveResult);
      process.exit(1);
    }

    // approveShift's own .eq("status","PENDING") filter exists specifically
    // because RLS's admin `is_admin()` bypass has no status restriction —
    // without this app-level filter, an admin could re-approve an already-
    // APPROVED (or REJECTED) shift. Testing only a non-admin's rejection
    // (above) doesn't prove this filter does anything, since RLS alone
    // already blocks non-admins regardless of it. This re-approve attempt,
    // by an admin, on the now-APPROVED shift, is the one case that actually
    // exercises it.
    const adminReapproveResult = await approveShift(adminRow.id, { shiftId: testShiftId });
    if (adminReapproveResult.success) {
      console.error("FAIL: approveShift should reject an admin re-approving an already-APPROVED shift (app-level PENDING-only filter), got", adminReapproveResult);
      process.exit(1);
    }

    const paySummary = await getPaySummary(today, today);
    if (!paySummary.some((s) => s.id === testShiftId)) {
      console.error("FAIL: getPaySummary should include the just-approved shift for today's date range.");
      process.exit(1);
    }

    // editShift's app-level "reopen first" rule (stricter than RLS's own
    // admin-bypass-driven `using` clause — see this task's discrepancy
    // note) — the owning coach can't edit an APPROVED shift directly.
    await signInShared(clockInTestCoach.email);
    const editApprovedResult = await editShift({ shiftId: testShiftId, clockInAt: new Date().toISOString(), clockOutAt: null });
    if (editApprovedResult.success) {
      console.error("FAIL: editShift should be rejected on an APPROVED shift until it's reopened, got", editApprovedResult);
      process.exit(1);
    }

    // The check above (owning coach, non-admin) is already blocked by RLS's
    // own self-branch `using`/`with check` (status must be in OPEN,PENDING)
    // regardless of editShift's app-level filter — it doesn't prove the
    // filter itself does anything. An admin attempting the same edit is the
    // scenario the filter exists for: RLS's is_admin() bypass has no status
    // restriction, so only editShift's own .in("status", ["OPEN","PENDING"])
    // stops an admin from editing an already-reviewed shift directly.
    await signInShared("admin@map.test");
    const adminEditApprovedResult = await editShift({ shiftId: testShiftId, clockInAt: new Date().toISOString(), clockOutAt: null });
    if (adminEditApprovedResult.success) {
      console.error("FAIL: editShift should reject an admin editing an APPROVED shift directly (app-level reopen-first filter), got", adminEditApprovedResult);
      process.exit(1);
    }

    // RLS's coach_shift_update policy is "is_admin() or (self AND status in
    // OPEN,PENDING)" on BOTH using and with check — an APPROVED shift fails
    // the self branch's using clause outright (current status isn't
    // OPEN/PENDING), so only an admin can ever reopen one.
    await signInShared(clockInTestCoach.email);
    const selfReopenResult = await reopenShift({ shiftId: testShiftId });
    if (selfReopenResult.success) {
      console.error("FAIL: reopenShift should be rejected for the owning coach on an APPROVED shift (RLS requires admin here), got", selfReopenResult);
      process.exit(1);
    }

    await signInShared("admin@map.test");
    const reopenResult = await reopenShift({ shiftId: testShiftId });
    if (!reopenResult.success) {
      console.error("FAIL: reopenShift should succeed for an admin on an APPROVED shift, got", reopenResult);
      process.exit(1);
    }

    await signInShared(nonOwningCoach.email);
    const nonAdminRejectResult = await rejectShift(nonOwningCoach.id, { shiftId: testShiftId, reviewNote: "test" });
    if (nonAdminRejectResult.success) {
      console.error("FAIL: rejectShift should be rejected for a non-admin, got", nonAdminRejectResult);
      process.exit(1);
    }

    await signInShared("admin@map.test");
    const rejectResult = await rejectShift(adminRow.id, { shiftId: testShiftId, reviewNote: "verify-coach-shifts-module test" });
    if (!rejectResult.success) {
      console.error("FAIL: rejectShift should succeed for an admin on a PENDING shift, got", rejectResult);
      process.exit(1);
    }

    // Same reasoning as approveShift/editShift above: rejectShift's own
    // .eq("status","PENDING") filter is what stops an admin from
    // re-rejecting an already-REJECTED shift — RLS's is_admin() bypass
    // alone wouldn't. Only exercised by an admin attempting it again here.
    const adminRerejectResult = await rejectShift(adminRow.id, { shiftId: testShiftId, reviewNote: "second attempt" });
    if (adminRerejectResult.success) {
      console.error("FAIL: rejectShift should reject an admin re-rejecting an already-REJECTED shift (app-level PENDING-only filter), got", adminRerejectResult);
      process.exit(1);
    }

    await sharedSupabase.auth.signOut();
  }

  await prisma.$disconnect();
  console.log(
    "PASS: Coach-shifts module's RLS-ownership surface is correct, and (when today has scheduled shift blocks) the full " +
      "clockIn/clockOut/editShift/reopenShift/approveShift/rejectShift lifecycle plus getOpenShiftForCoach/getShiftHistoryForCoach/" +
      "getPendingShifts/getPaySummary all behave correctly, including every write's rejection path",
  );
}

main();

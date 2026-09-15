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

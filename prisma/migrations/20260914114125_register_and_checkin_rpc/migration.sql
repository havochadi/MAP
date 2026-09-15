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

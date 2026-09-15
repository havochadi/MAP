-- prisma/migrations/20260915162056_fix_register_login_code_range/migration.sql
--
-- register_and_checkin_student's own migration (20260914114125) is
-- already applied and checksummed, so it can't be edited in place — this
-- follow-up carries the same CREATE OR REPLACE fix pattern already
-- established for the JWT role/app_role bug in Plan 1.
--
-- Bug: the login-code alphabet is 32 characters, but the original
-- generator used floor(random()*33)+1, yielding {1..33} — position 33 is
-- out of range, and Postgres substr() silently returns '' (not an error)
-- when start exceeds the string's length, so ~1 in 6 generated codes
-- (1 - (32/33)^6) came out shorter than 6 characters instead of failing
-- loudly. Fixed to floor(random()*32)+1, yielding the correct {1..32}.
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
  -- The alphabet is 32 characters; floor(random()*32)+1 yields {1..32},
  -- the exact valid 1-indexed range for substr() on a 32-char string.
  for v_attempt in 1..10 loop
    v_login_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1), '')
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

-- grant/revoke already applied by the original migration and are
-- unaffected by CREATE OR REPLACE — not repeated here.

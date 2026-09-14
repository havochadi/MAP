-- prisma/migrations/20260914110527_rls_checkin_tables/migration.sql
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

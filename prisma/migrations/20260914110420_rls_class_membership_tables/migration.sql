-- prisma/migrations/20260914110420_rls_class_membership_tables/migration.sql
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

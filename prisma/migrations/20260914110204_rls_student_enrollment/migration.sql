-- prisma/migrations/20260914110204_rls_student_enrollment/migration.sql
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

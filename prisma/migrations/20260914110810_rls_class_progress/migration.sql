-- prisma/migrations/20260914110810_rls_class_progress/migration.sql
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

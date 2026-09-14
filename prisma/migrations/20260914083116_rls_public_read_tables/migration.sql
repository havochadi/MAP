-- prisma/migrations/20260914083116_rls_public_read_tables/migration.sql
alter table "Venue" enable row level security;
create policy "venue_select_authenticated" on "Venue" for select to authenticated using (true);
create policy "venue_write_admin" on "Venue" for all to authenticated using (is_admin()) with check (is_admin());

alter table "Class" enable row level security;
create policy "class_select_authenticated" on "Class" for select to authenticated using (true);
create policy "class_write_admin" on "Class" for all to authenticated using (is_admin()) with check (is_admin());

alter table "CurriculumTopic" enable row level security;
create policy "curriculum_select_authenticated" on "CurriculumTopic" for select to authenticated using (true);
create policy "curriculum_write_admin" on "CurriculumTopic" for all to authenticated using (is_admin()) with check (is_admin());

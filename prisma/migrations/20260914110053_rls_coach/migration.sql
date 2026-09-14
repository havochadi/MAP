-- prisma/migrations/20260914110053_rls_coach/migration.sql
alter table "Coach" enable row level security;

create policy "coach_select_self_or_admin" on "Coach" for select to authenticated
  using (is_admin() or "authUserId" = auth.uid()::text);

create policy "coach_write_admin" on "Coach" for all to authenticated
  using (is_admin()) with check (is_admin());

-- Deliberately NOT security_invoker: this view intentionally exposes a
-- narrow, non-sensitive slice (id/name/isAdmin only — no email, phone,
-- passwordHash, or lockout columns) of every Coach row to any authenticated
-- user, regardless of the stricter base-table policy above. If a linter
-- later suggests adding security_invoker=true, don't — that would collapse
-- this view back to the base table's self-or-admin-only policy and break
-- "see a colleague's name" everywhere it's used (e.g. "approved by Farhan").
create or replace view public.coach_public as
  select id, name, "isAdmin" from "Coach";

grant select on public.coach_public to authenticated;

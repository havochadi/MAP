-- prisma/migrations/20260914083253_fix_auth_claims_hook_role_collision/migration.sql
--
-- Fixes a bug in 20260914080730_auth_claims_hook: the top-level `role`
-- claim in a Supabase Auth JWT is reserved — PostgREST reads it to
-- `SET ROLE <claim>` on every REST request, and normally it's just
-- "authenticated". The original hook overwrote it with the literal string
-- "coach"/"student", which broke every direct table query (PostgREST/
-- supabase-js `.from(...)`) for any coach/student session with
-- `role "coach"/"student" does not exist`, since no such Postgres role
-- exists. Edge Functions and JWT-decode-only checks (Tasks 5/6/8's
-- verification) never hit this, because none of them issued a direct
-- PostgREST table query with a real coach/student session — Task 9's RLS
-- verification is the first to do that, which is how this surfaced.
--
-- Fix: stamp the coach/student distinction onto a differently-named claim
-- (app_role) instead, leaving Supabase's own `role` claim (`authenticated`)
-- untouched so PostgREST's role-switching keeps working.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  coach_is_admin boolean;
  student_found boolean;
begin
  claims := coalesce(event->'claims', '{}'::jsonb);

  select "isAdmin" into coach_is_admin
  from "Coach"
  where "authUserId" = (event->>'user_id');

  if found then
    claims := jsonb_set(claims, '{isAdmin}', to_jsonb(coach_is_admin));
    claims := jsonb_set(claims, '{app_role}', to_jsonb('coach'::text));
    return jsonb_set(event, '{claims}', claims);
  end if;

  select true into student_found
  from "Student"
  where "authUserId" = (event->>'user_id');

  if found then
    claims := jsonb_set(claims, '{isAdmin}', to_jsonb(false));
    claims := jsonb_set(claims, '{app_role}', to_jsonb('student'::text));
    return jsonb_set(event, '{claims}', claims);
  end if;

  -- No linked Coach/Student row (shouldn't happen for real sessions) —
  -- leave claims unset. Every policy below fails closed in that case.
  return event;
end;
$$;

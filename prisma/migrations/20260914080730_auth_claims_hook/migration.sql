-- prisma/migrations/20260914080730_auth_claims_hook/migration.sql

-- Stamps isAdmin + role onto every issued JWT, so RLS policies can read
-- auth.jwt() directly instead of a subquery back to Coach/Student on every
-- row check. Must be wired up as the active "Custom Access Token" hook in
-- the Supabase dashboard (Authentication -> Hooks) — see Step 3, a
-- one-time manual step; this migration only creates the function.
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
    claims := jsonb_set(claims, '{role}', to_jsonb('coach'::text));
    return jsonb_set(event, '{claims}', claims);
  end if;

  select true into student_found
  from "Student"
  where "authUserId" = (event->>'user_id');

  if found then
    claims := jsonb_set(claims, '{isAdmin}', to_jsonb(false));
    claims := jsonb_set(claims, '{role}', to_jsonb('student'::text));
    return jsonb_set(event, '{claims}', claims);
  end if;

  -- No linked Coach/Student row (shouldn't happen for real sessions) —
  -- leave claims unset. Every policy below fails closed in that case.
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Reads the isAdmin claim the hook above stamped onto the JWT. Every
-- write-policy admin-bypass in this migration set calls this.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'isAdmin')::boolean, false);
$$;

-- security definer: resolves "which Coach/Student is this session" without
-- being subject to that same table's own RLS policy (avoids the function
-- being unable to see the very row it's trying to identify).
create or replace function public.current_coach_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from "Coach" where "authUserId" = auth.uid()::text;
$$;

create or replace function public.current_student_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from "Student" where "authUserId" = auth.uid()::text;
$$;

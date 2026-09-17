-- security definer: checks whether the current session's coach has ANY
-- ClassAssignment row for the given class, without being subject to
-- ClassAssignment's own RLS policy — a plain EXISTS subquery inside that
-- policy's own USING clause would recurse into itself (Postgres error
-- 42P17, "infinite recursion detected in policy for relation") since
-- evaluating the subquery would re-trigger the same policy being
-- evaluated. Same reasoning as current_coach_id()'s own security definer.
create or replace function public.is_assigned_to_class(target_class_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from "ClassAssignment"
    where "classId" = target_class_id and "coachId" = current_coach_id()
  );
$$;

-- Widen ClassAssignment's read policy: a coach could previously only see
-- their own assignment row, not a co-assigned coach's row for the same
-- class (a real product regression from the pre-migration app, approved
-- for restoration by the user 2026-09-18). Keeps the existing admin/own-row
-- checks (cheaper, short-circuit before the function call needs to run)
-- and adds the co-assignment check as a third OR clause.
drop policy "class_assignment_select" on "ClassAssignment";
create policy "class_assignment_select" on "ClassAssignment" for select to authenticated
  using (is_admin() or "coachId" = current_coach_id() or is_assigned_to_class("classId"));

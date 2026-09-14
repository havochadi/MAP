-- prisma/migrations/20260914110652_rls_coach_shift/migration.sql
alter table "CoachShift" enable row level security;

create policy "coach_shift_select" on "CoachShift" for select to authenticated
  using (is_admin() or "coachId" = current_coach_id());

create policy "coach_shift_insert_own" on "CoachShift" for insert to authenticated
  with check ("coachId" = current_coach_id());

-- A coach may edit their own shift only while it's still OPEN or PENDING
-- (not yet APPROVED/REJECTED) — matches editShift's current behavior.
-- Only admin can move status into APPROVED/REJECTED (approveShift/
-- rejectShift/reopenShift are admin-only today).
create policy "coach_shift_update" on "CoachShift" for update to authenticated
  using (
    is_admin() or ("coachId" = current_coach_id() and status in ('OPEN', 'PENDING'))
  )
  with check (
    is_admin() or ("coachId" = current_coach_id() and status in ('OPEN', 'PENDING'))
  );

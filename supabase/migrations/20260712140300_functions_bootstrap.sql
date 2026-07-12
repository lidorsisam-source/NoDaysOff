-- No Days Off — spec-aligned backend foundation (Round 5): safe structural
-- functions only (spec §10.1–10.2). Domain RPCs (onboarding steps, plan
-- generation, mission/shield/streak) come in later rounds.
--
-- Function safety rules (spec §9.5): explicit empty search_path, fully
-- qualified names, SECURITY DEFINER only where a function must write protected
-- tables the caller can't, with ownership checks inside; execute privileges
-- revoked from public/anon and granted narrowly.

-- ── updated_at maintenance (SECURITY INVOKER) ──────────────────────────────
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.user_profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.daily_missions
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.streak_states
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.monthly_shield_states
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.notification_preferences
  for each row execute function private.set_updated_at();

-- ── protected-field guard on user_profiles (defense in depth) ──────────────
-- Column GRANTs already stop a client updating protected columns; this trigger
-- rejects any protected-field change not made by a SECURITY DEFINER function
-- (which runs with BYPASSRLS/owner rights and sets private.allow_protected).
create or replace function private.guard_user_profile_protected_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- An approved internal function signals its context via a GUC.
  if current_setting('private.allow_protected_profile_write', true) = 'on' then
    return new;
  end if;

  if new.onboarding_step is distinct from old.onboarding_step
     or new.onboarding_completed is distinct from old.onboarding_completed
     or new.onboarding_completed_at is distinct from old.onboarding_completed_at
     or new.daily_calorie_target is distinct from old.daily_calorie_target
     or new.weekly_schedule_version is distinct from old.weekly_schedule_version
     or new.plan_generated_at is distinct from old.plan_generated_at
     or new.active_plan_id is distinct from old.active_plan_id
     or new.profile_revision is distinct from old.profile_revision
     or new.onboarding_started_at is distinct from old.onboarding_started_at then
    raise exception 'PROFILE_PROTECTED_FIELD_UPDATE'
      using hint = 'These fields are server-managed and cannot be updated directly.';
  end if;
  return new;
end;
$$;

create trigger guard_protected_fields before update on public.user_profiles
  for each row execute function private.guard_user_profile_protected_fields();

-- ── new-auth-user profile bootstrap (SECURITY DEFINER) ─────────────────────
-- Minimal AFTER INSERT trigger on auth.users. Creates the initial profile
-- only, idempotently. No plan generation, remote calls, or heavy logic — an
-- auth-trigger failure would block signup.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, display_name, onboarding_step, onboarding_completed)
  values (
    new.id,
    -- only approved, non-authoritative signup metadata is copied
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    'account_created',
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── ensure_user_profile RPC (SECURITY DEFINER) ─────────────────────────────
-- Recovery path if the signup trigger didn't run. Idempotent; derives the user
-- from auth.uid() and never trusts a caller-supplied id.
create or replace function public.ensure_user_profile()
returns public.user_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile public.user_profiles;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into public.user_profiles (user_id, onboarding_step, onboarding_completed)
  values (v_uid, 'account_created', false)
  on conflict (user_id) do nothing;

  select * into v_profile from public.user_profiles where user_id = v_uid;
  return v_profile;
end;
$$;

-- Lock down execution: not callable by anonymous or the public role.
revoke all on function public.ensure_user_profile() from public, anon;
grant execute on function public.ensure_user_profile() to authenticated;

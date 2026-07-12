-- No Days Off — spec-aligned backend foundation (Round 5): RLS + privileges.
--
-- Per Backend Specification §9. RLS on every user-owned table; access scoped
-- to auth.uid(). Reads are own-row everywhere. Writes are denied by default
-- (no policy) and happen through SECURITY DEFINER RPCs (later rounds) — except
-- the allowlisted own-row writes the spec permits directly: profile edits
-- (column-restricted), notification preferences, and push tokens. Policies
-- target the `authenticated` role explicitly (auth.uid() is null otherwise).

alter table public.user_profiles enable row level security;
alter table public.user_plan_versions enable row level security;
alter table public.workout_schedule_days enable row level security;
alter table public.daily_missions enable row level security;
alter table public.mission_outcomes enable row level security;
alter table public.streak_states enable row level security;
alter table public.monthly_shield_states enable row level security;
alter table public.shield_transactions enable row level security;
alter table public.coach_events enable row level security;
alter table public.coach_messages enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_logs enable row level security;

-- ── SELECT own rows (every table) ──────────────────────────────────────────
create policy "user_profiles_select_own" on public.user_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_plan_versions_select_own" on public.user_plan_versions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "workout_schedule_days_select_own" on public.workout_schedule_days
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_missions_select_own" on public.daily_missions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "mission_outcomes_select_own" on public.mission_outcomes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "streak_states_select_own" on public.streak_states
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "monthly_shield_states_select_own" on public.monthly_shield_states
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "shield_transactions_select_own" on public.shield_transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "coach_events_select_own" on public.coach_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "coach_messages_select_own" on public.coach_messages
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notification_preferences_select_own" on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "push_tokens_select_own" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notification_logs_select_own" on public.notification_logs
  for select to authenticated using ((select auth.uid()) = user_id);

-- ── Allowlisted own-row writes ─────────────────────────────────────────────
-- Profile: own-row UPDATE only. Which COLUMNS may change is restricted by the
-- column GRANTs below; the guard trigger (next migration) is defense in depth.
-- No client INSERT (the auth trigger / ensure_user_profile creates the row) and
-- no client DELETE.
create policy "user_profiles_update_own" on public.user_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Notification preferences: own insert + update.
create policy "notification_preferences_insert_own" on public.notification_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notification_preferences_update_own" on public.notification_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Push tokens: own insert + update (registration/deactivation of own device).
create policy "push_tokens_insert_own" on public.push_tokens
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "push_tokens_update_own" on public.push_tokens
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── Column-level lockdown on user_profiles ─────────────────────────────────
-- Row-level policies don't restrict columns, so remove blanket UPDATE and
-- re-grant only the onboarding-answer fields a client may edit directly.
-- Protected fields (onboarding state, plan pointers, calorie target, revision,
-- timestamps) are only writable by SECURITY DEFINER functions.
revoke update on public.user_profiles from authenticated;
grant update (
  display_name,
  age,
  height_cm,
  current_weight_kg,
  preferred_units,
  timezone,
  goal,
  weekly_workout_frequency,
  preferred_workout_days,
  experience_level,
  preferred_workout_duration_minutes,
  coach_personality
) on public.user_profiles to authenticated;

-- Row Level Security: every table here is user-owned data. Enable RLS
-- everywhere and scope all access to auth.uid(). The service_role key
-- bypasses RLS by design (Supabase default) — that key must only ever be
-- used from trusted server/edge-function code, never shipped to a client
-- or embedded in frontend env vars. See supabase/README.md.

alter table public.user_profiles enable row level security;
alter table public.workout_schedule_days enable row level security;
alter table public.daily_missions enable row level security;
alter table public.mission_outcomes enable row level security;
alter table public.streak_states enable row level security;
alter table public.monthly_shield_states enable row level security;
alter table public.coach_events enable row level security;
alter table public.coach_messages enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_logs enable row level security;

-- user_profiles: ownership is keyed by id (== auth.users.id) rather than a
-- separate user_id column.
create policy "user_profiles_select_own" on public.user_profiles
  for select using (auth.uid() = id);
create policy "user_profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = id);
create policy "user_profiles_update_own" on public.user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "user_profiles_delete_own" on public.user_profiles
  for delete using (auth.uid() = id);

-- Every other table is keyed by a user_id column — one blanket
-- "own rows only" policy per table covers select/insert/update/delete.
create policy "workout_schedule_days_owner" on public.workout_schedule_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_missions_owner" on public.daily_missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mission_outcomes_owner" on public.mission_outcomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "streak_states_owner" on public.streak_states
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "monthly_shield_states_owner" on public.monthly_shield_states
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach_events_owner" on public.coach_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach_messages_owner" on public.coach_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_tokens_owner" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notification_logs_owner" on public.notification_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

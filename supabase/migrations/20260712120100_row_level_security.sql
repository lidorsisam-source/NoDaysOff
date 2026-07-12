-- Row Level Security for the calorie/weekly/schedule additions. Same posture
-- as the initial tables: RLS on, all access scoped to auth.uid() = user_id.
-- The service_role key still bypasses RLS by design and must never reach a
-- client build (see supabase/README.md).

alter table public.calorie_entries enable row level security;
alter table public.weekly_checkins enable row level security;
alter table public.schedule_versions enable row level security;

create policy "calorie_entries_owner" on public.calorie_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "weekly_checkins_owner" on public.weekly_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "schedule_versions_owner" on public.schedule_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

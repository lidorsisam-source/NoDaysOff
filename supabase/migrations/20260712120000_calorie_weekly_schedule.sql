-- No Days Off — backend additions (schema only): calorie entries, weekly
-- check-in / plan confirmation, and schedule-edit versioning. Additive; no
-- existing table is altered or dropped.
--
-- As with the initial schema, NO business logic lives here — daily calorie
-- aggregation, weekly-checkin gating, missed-Sunday evaluation, one-edit-per-
-- week enforcement, and workout-count validation all belong in application /
-- edge-function code. These tables only hold the state that logic reads/writes.

-- ── calorie_entries ──────────────────────────────────────────────────────
-- Individual calorie log entries (Add / Edit / Delete). A day's consumed total
-- is the SUM of its entries; mission_outcomes still holds the evaluated daily
-- result. Keyed to the owning day via the composite FK against
-- daily_missions(user_id, mission_date) so an entry can't reference a day the
-- user doesn't own or that has no mission.
create table if not exists public.calorie_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  mission_date date not null,
  calories integer not null check (calories > 0),
  label text,
  meal_type text not null default 'other'
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, mission_date)
    references public.daily_missions (user_id, mission_date) on delete cascade
);
comment on table public.calorie_entries is 'Individual calorie log entries; daily consumed = SUM. One row per logged item.';

-- ── weekly_checkins ──────────────────────────────────────────────────────
-- The mandatory weekly check-in that confirms the plan for a Sunday–Saturday
-- week. `week_start` is the Sunday. `workout_count` is the count the user
-- committed to for the week (exact-count validation happens app-side). Status
-- carries the missed-Sunday state.
create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  week_start date not null, -- Sunday of the week
  workout_count integer not null check (workout_count between 0 and 7),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'missed')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);
comment on table public.weekly_checkins is 'Mandatory weekly (Sun–Sat) check-in / plan confirmation, one row per user per week.';

-- ── schedule_versions ────────────────────────────────────────────────────
-- Version history of the weekly workout layout. Version 1 is the initial plan
-- for a week; each allowed edit appends a new version (the "one edit per week"
-- limit and protected-past-date rules are enforced app-side — here the row
-- count per week is simply the audit trail). `days` snapshots the 7-day layout.
create table if not exists public.schedule_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  week_start date not null, -- Sunday of the week this version applies to
  version integer not null default 1 check (version >= 1),
  days jsonb not null, -- e.g. {"0":"rest","1":"workout",...} for Sun..Sat
  workout_count integer not null check (workout_count between 0 and 7),
  created_at timestamptz not null default now(),
  unique (user_id, week_start, version)
);
comment on table public.schedule_versions is 'Per-week workout-layout version history; row count per week is the edit audit trail.';

-- ── indexes for the obvious query patterns ─────────────────────────────
create index if not exists idx_calorie_entries_user_date on public.calorie_entries (user_id, mission_date desc);
create index if not exists idx_weekly_checkins_user_week on public.weekly_checkins (user_id, week_start desc);
create index if not exists idx_schedule_versions_user_week on public.schedule_versions (user_id, week_start desc, version desc);

-- ── updated_at maintenance (reuses public.set_updated_at from init) ────────
create trigger set_updated_at before update on public.calorie_entries
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.weekly_checkins
  for each row execute function public.set_updated_at();

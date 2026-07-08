-- No Days Off — MVP backend foundation: schema only.
--
-- Deliberately NOT implemented here (belongs in application / edge-function
-- code, not the database): streak/shield math, mission generation, AI coach
-- message generation, notification dispatch. These tables just hold state
-- and history for that logic to read/write.

create extension if not exists "pgcrypto";

-- ── user_profiles ────────────────────────────────────────────────────────
-- One row per auth user (id doubles as the FK to auth.users, enforcing the
-- one-profile-per-user rule via primary key rather than a separate unique
-- constraint).
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  age integer not null check (age between 10 and 100),
  height_cm numeric(5, 1) not null check (height_cm > 0),
  weight_kg numeric(5, 1) not null check (weight_kg > 0),
  goal text not null check (goal in ('lose_weight', 'build_muscle', 'maintain')),
  workouts_per_week integer not null check (workouts_per_week between 0 and 7),
  coach_style text not null check (coach_style in ('beast', 'supportive', 'tough_love')),
  calorie_target integer check (calorie_target > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.user_profiles is 'Onboarding profile + generated calorie target, one row per auth user.';

-- ── workout_schedule_days ───────────────────────────────────────────────
-- The generated weekly plan: which weekdays are workout vs. rest days.
create table if not exists public.workout_schedule_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  day_type text not null check (day_type in ('workout', 'rest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_of_week)
);
comment on table public.workout_schedule_days is 'Weekly plan: one row per user per weekday (0=Sunday..6=Saturday).';

-- ── daily_missions ──────────────────────────────────────────────────────
-- One mission per user per calendar date, snapshotted from the weekly plan
-- at generation time (so later plan edits don't rewrite past missions).
create table if not exists public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  mission_date date not null,
  day_type text not null check (day_type in ('workout', 'rest')),
  calorie_target integer not null check (calorie_target > 0),
  created_at timestamptz not null default now(),
  unique (user_id, mission_date),
  unique (id, user_id) -- referenced by mission_outcomes to FK-enforce owner consistency
);
comment on table public.daily_missions is 'One mission per user per date, snapshotted from the plan.';

-- ── mission_outcomes ────────────────────────────────────────────────────
-- Exactly one outcome per mission. The composite FK against
-- daily_missions(id, user_id) guarantees an outcome's user_id can never
-- diverge from its mission's actual owner.
create table if not exists public.mission_outcomes (
  mission_id uuid primary key,
  user_id uuid not null,
  completed boolean not null default false,
  calories_logged integer check (calories_logged >= 0),
  outcome text not null default 'pending' check (outcome in ('pending', 'success', 'missed', 'overage')),
  recorded_at timestamptz not null default now(),
  foreign key (mission_id, user_id) references public.daily_missions (id, user_id) on delete cascade
);
comment on table public.mission_outcomes is 'One outcome per mission; user_id is FK-checked against the parent mission.';

-- ── streak_states ───────────────────────────────────────────────────────
-- One row per user holding the running streak counters.
create table if not exists public.streak_states (
  user_id uuid primary key references public.user_profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_checked_date date,
  updated_at timestamptz not null default now()
);
comment on table public.streak_states is 'One row per user: current/longest streak + last processed date.';

-- ── monthly_shield_states ───────────────────────────────────────────────
-- One shield balance per user per calendar month (month resets to 4).
create table if not exists public.monthly_shield_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  shield_month date not null, -- first-of-month convention, e.g. 2026-07-01
  shields_remaining numeric(2, 1) not null default 4.0 check (shields_remaining >= 0 and shields_remaining <= 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, shield_month)
);
comment on table public.monthly_shield_states is 'One shield balance per user per month.';

-- ── coach_events ────────────────────────────────────────────────────────
-- Log of triggers the coach reacts to. No message generation happens here.
create table if not exists public.coach_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  event_type text not null check (
    event_type in ('app_open', 'mission_complete', 'full_penalty', 'half_penalty', 'new_streak', 'new_month', 'achievement')
  ),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
comment on table public.coach_events is 'Trigger log the coach reacts to (event generation happens elsewhere).';

-- ── coach_messages ──────────────────────────────────────────────────────
-- Messages actually shown to the user; generation logic lives elsewhere.
create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  coach_event_id uuid references public.coach_events (id) on delete set null,
  coach_style text not null check (coach_style in ('beast', 'supportive', 'tough_love')),
  message_text text not null,
  created_at timestamptz not null default now()
);
comment on table public.coach_messages is 'Messages shown to the user; generation logic lives outside the DB.';

-- ── push_tokens ─────────────────────────────────────────────────────────
-- Device push tokens; a user may register multiple devices.
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
comment on table public.push_tokens is 'Device push tokens, multiple per user allowed.';

-- ── notification_logs ───────────────────────────────────────────────────
-- Record of notifications actually sent; dispatch logic lives elsewhere.
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  push_token_id uuid references public.push_tokens (id) on delete set null,
  notification_type text not null,
  title text not null,
  body text not null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'failed')),
  sent_at timestamptz not null default now()
);
comment on table public.notification_logs is 'Record of notifications sent; dispatch logic lives outside the DB.';

-- ── indexes for the obvious query patterns ─────────────────────────────
create index if not exists idx_daily_missions_user_date on public.daily_missions (user_id, mission_date desc);
create index if not exists idx_mission_outcomes_user on public.mission_outcomes (user_id);
create index if not exists idx_coach_events_user_time on public.coach_events (user_id, occurred_at desc);
create index if not exists idx_coach_messages_user_time on public.coach_messages (user_id, created_at desc);
create index if not exists idx_push_tokens_user on public.push_tokens (user_id);
create index if not exists idx_notification_logs_user_time on public.notification_logs (user_id, sent_at desc);

-- ── updated_at maintenance ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.user_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workout_schedule_days
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.streak_states
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.monthly_shield_states
  for each row execute function public.set_updated_at();

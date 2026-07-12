-- No Days Off — spec-aligned backend foundation (Round 5): tables.
--
-- Field-by-field per Backend Specification §7. Ownership consistency is
-- enforced with composite (id, user_id) foreign keys wherever practical
-- (§8.4). No business logic here — plan/mission/shield/streak state is written
-- only by the RPC/internal functions added in later rounds. Only wide sanity
-- checks are applied; product validation ranges (age/height/weight/duration,
-- calorie bounds) are intentionally NOT invented (spec §16, §18 — pending
-- product approval) and are enforced in application/RPC code.

-- ── user_profiles ─────────────────────────────────────────────────────────
-- Authoritative profile, onboarding status, preferences, and current plan
-- pointers. active_plan_id FK is added by ALTER at the end (breaks the
-- profile<->plan cycle).
create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  age smallint check (age is null or (age > 0 and age < 130)), -- product range pending approval
  age_recorded_at timestamptz,
  height_cm numeric(6, 2) check (height_cm is null or height_cm > 0),
  current_weight_kg numeric(6, 2) check (current_weight_kg is null or current_weight_kg > 0),
  preferred_units public.preferred_units_enum,
  timezone text, -- validated IANA tz (server-validated in RPC)
  goal public.goal_enum,
  weekly_workout_frequency smallint check (weekly_workout_frequency is null or weekly_workout_frequency between 0 and 7),
  preferred_workout_days smallint[], -- ISO 1..7; length/uniqueness validated in RPC (§8.2)
  experience_level public.experience_level_enum,
  preferred_workout_duration_minutes smallint check (preferred_workout_duration_minutes is null or preferred_workout_duration_minutes > 0),
  coach_personality public.coach_personality_enum,
  onboarding_step public.onboarding_state_enum not null default 'account_created',
  onboarding_completed boolean not null default false,
  onboarding_started_at timestamptz not null default now(),
  onboarding_completed_at timestamptz,
  daily_calorie_target integer check (daily_calorie_target is null or daily_calorie_target > 0),
  weekly_schedule_version integer,
  plan_generated_at timestamptz,
  active_plan_id uuid,
  profile_revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, active_plan_id) -- lets the active-plan composite FK enforce same-user
);
comment on table public.user_profiles is 'Authoritative profile, onboarding state, preferences, and current plan pointers. One row per auth user.';

-- ── user_plan_versions ────────────────────────────────────────────────────
-- Immutable history of generated / overridden plans.
create table public.user_plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (user_id) on delete cascade,
  version integer not null,
  status public.plan_status_enum not null,
  source public.plan_source_enum not null,
  generation_reason public.plan_generation_reason_enum not null,
  input_profile_revision integer not null,
  daily_calorie_target integer check (daily_calorie_target is null or daily_calorie_target > 0),
  calorie_formula_version text,
  calorie_explanation jsonb not null default '{}'::jsonb,
  weekly_schedule_version integer,
  schedule_formula_version text,
  effective_from date,
  effective_to date,
  generated_at timestamptz not null default now(),
  activated_at timestamptz,
  superseded_at timestamptz,
  generation_error_code text,
  created_at timestamptz not null default now(),
  unique (user_id, version),
  unique (id, user_id) -- referenced by composite ownership FKs
);
comment on table public.user_plan_versions is 'Immutable versioned plan history; at most one active per user.';
-- At most one active plan per user.
create unique index uniq_active_plan_per_user on public.user_plan_versions (user_id) where status = 'active';

-- profile.active_plan_id must reference a plan owned by the same user.
alter table public.user_profiles
  add constraint user_profiles_active_plan_fk
  foreign key (active_plan_id, user_id) references public.user_plan_versions (id, user_id);

-- ── workout_schedule_days ─────────────────────────────────────────────────
-- Normalized weekly schedule belonging to a plan version. ISO weekdays 1..7.
create table public.workout_schedule_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- denormalized owner (kept consistent via composite FK)
  plan_id uuid not null,
  iso_weekday smallint not null check (iso_weekday between 1 and 7),
  day_type public.workout_day_status_enum not null,
  workout_sequence smallint,
  duration_minutes smallint,
  created_at timestamptz not null default now(),
  unique (plan_id, iso_weekday),
  foreign key (plan_id, user_id) references public.user_plan_versions (id, user_id) on delete cascade,
  -- duration required (positive) for workout days, null for rest days
  check (
    (day_type = 'workout' and duration_minutes is not null and duration_minutes > 0)
    or (day_type = 'rest' and duration_minutes is null)
  )
);
comment on table public.workout_schedule_days is 'Seven rows per activated plan; workout/rest per ISO weekday.';

-- ── daily_missions ────────────────────────────────────────────────────────
-- One authoritative mission per user-local date.
create table public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (user_id) on delete cascade,
  mission_date date not null,
  timezone_snapshot text not null,
  plan_id uuid not null,
  mission_type public.mission_type_enum not null,
  status public.mission_status_enum not null default 'scheduled',
  scheduled_workout_day_id uuid references public.workout_schedule_days (id),
  calorie_target_snapshot integer check (calorie_target_snapshot is null or calorie_target_snapshot > 0),
  activated_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  shield_penalty_applied_at timestamptz,
  streak_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mission_date),
  unique (id, user_id),
  foreign key (plan_id, user_id) references public.user_plan_versions (id, user_id),
  -- workout mission needs a schedule-day ref; rest mission needs a target snapshot
  check (
    (mission_type = 'workout_day' and scheduled_workout_day_id is not null)
    or (mission_type = 'rest_day' and calorie_target_snapshot is not null)
  )
);
comment on table public.daily_missions is 'One mission per user per local date (unique key is the duplicate guard).';
create index idx_daily_missions_user_date on public.daily_missions (user_id, mission_date desc);

-- ── mission_outcomes ──────────────────────────────────────────────────────
-- Immutable authoritative evaluation of a mission (one per mission).
create table public.mission_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  daily_mission_id uuid not null,
  outcome public.mission_outcome_enum not null,
  reported_calories integer,
  evaluated_calorie_target integer,
  completion_source text not null,
  idempotency_key uuid not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (daily_mission_id),
  unique (user_id, idempotency_key),
  foreign key (daily_mission_id, user_id) references public.daily_missions (id, user_id) on delete cascade
);
comment on table public.mission_outcomes is 'One immutable outcome per mission; idempotency_key dedupes completion requests.';

-- ── streak_states ─────────────────────────────────────────────────────────
create table public.streak_states (
  user_id uuid primary key references public.user_profiles (user_id) on delete cascade,
  current_streak_days integer not null default 0 check (current_streak_days >= 0),
  longest_streak_days integer not null default 0 check (longest_streak_days >= 0),
  last_successful_mission_date date,
  last_processed_mission_date date,
  flame_active boolean not null default true,
  flame_extinguished_at timestamptz,
  version integer not null default 1, -- optimistic concurrency
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.streak_states is 'Current/longest streak + flame state cache; rebuildable from outcomes + shield ledger.';

-- ── monthly_shield_states ─────────────────────────────────────────────────
create table public.monthly_shield_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (user_id) on delete cascade,
  shield_month date not null, -- first day of user-local month
  timezone_snapshot text not null,
  allocated_points numeric(3, 1) not null default 4.0,
  remaining_points numeric(3, 1) not null,
  initialized_at timestamptz not null default now(),
  depleted_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, shield_month),
  unique (id, user_id),
  check (remaining_points >= 0 and remaining_points <= allocated_points)
);
comment on table public.monthly_shield_states is 'One shield balance per user per local month; starts at 4.0.';

-- ── shield_transactions ───────────────────────────────────────────────────
-- Append-only shield ledger + penalty idempotency.
create table public.shield_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (user_id) on delete cascade,
  monthly_shield_state_id uuid not null,
  daily_mission_id uuid, -- null for allocation/reset/adjustment
  transaction_type public.shield_transaction_type_enum not null,
  delta_points numeric(3, 1) not null,
  balance_before numeric(3, 1) not null,
  balance_after numeric(3, 1) not null,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  foreign key (monthly_shield_state_id, user_id) references public.monthly_shield_states (id, user_id),
  foreign key (daily_mission_id, user_id) references public.daily_missions (id, user_id)
);
comment on table public.shield_transactions is 'Append-only shield ledger; idempotency_key + partial uniques prevent double penalties.';
-- At most one penalty of each kind per mission.
create unique index uniq_missed_workout_penalty_per_mission
  on public.shield_transactions (daily_mission_id) where transaction_type = 'missed_workout_penalty';
create unique index uniq_rest_day_penalty_per_mission
  on public.shield_transactions (daily_mission_id) where transaction_type = 'rest_day_calorie_penalty';

-- ── coach_events ──────────────────────────────────────────────────────────
create table public.coach_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (user_id) on delete cascade,
  event_type public.coach_event_type_enum not null,
  source_entity_type text not null,
  source_entity_id uuid,
  coach_personality_snapshot public.coach_personality_enum not null,
  event_payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  unique (id, user_id)
);
comment on table public.coach_events is 'Structured authoritative events; personality snapshot preserves historical consistency.';

-- ── coach_messages ────────────────────────────────────────────────────────
-- One-way system messages (not a chat transcript). One per event for the MVP.
create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  coach_event_id uuid not null,
  personality_snapshot public.coach_personality_enum not null,
  status public.coach_message_status_enum not null default 'pending',
  template_key text,
  content text,
  generation_source text not null default 'template_engine',
  prompt_version text,
  model_name text,
  generation_metadata jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (coach_event_id), -- one active message per event (MVP)
  foreign key (coach_event_id, user_id) references public.coach_events (id, user_id) on delete cascade
);
comment on table public.coach_messages is 'System-generated coach messages; future AI output remains presentation content, never business state.';

-- ── notification_preferences ──────────────────────────────────────────────
create table public.notification_preferences (
  user_id uuid primary key references public.user_profiles (user_id) on delete cascade,
  decision public.notification_decision_enum not null,
  push_enabled boolean not null default false,
  decision_recorded_at timestamptz not null default now(),
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.notification_preferences is 'Onboarding notification decision + channel prefs (consent is not a profile identity attribute).';

-- ── push_tokens ───────────────────────────────────────────────────────────
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (user_id) on delete cascade,
  token_hash text not null, -- indexed hash for dedupe
  encrypted_token text not null, -- protected storage; raw token never logged
  platform text not null,
  device_id text,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.push_tokens is 'User-owned device push registrations; raw tokens are never stored in cleartext or logs.';
-- One active registration per provider token.
create unique index uniq_active_push_token on public.push_tokens (token_hash) where active;
create index idx_push_tokens_user on public.push_tokens (user_id);

-- ── notification_logs ─────────────────────────────────────────────────────
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (user_id) on delete cascade,
  push_token_id uuid references public.push_tokens (id) on delete set null,
  coach_message_id uuid references public.coach_messages (id) on delete set null,
  notification_type text not null,
  scheduled_for timestamptz not null,
  status public.notification_delivery_status_enum not null default 'pending',
  idempotency_key text not null,
  provider_message_id text,
  attempt_count integer not null default 0,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
comment on table public.notification_logs is 'Delivery audit for scheduled notifications; provider secrets are never stored.';
create index idx_notification_logs_user_time on public.notification_logs (user_id, scheduled_for desc);

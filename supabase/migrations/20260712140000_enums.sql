-- No Days Off — spec-aligned backend foundation (Round 5): enums + schemas.
--
-- Enum value sets are taken verbatim from the Backend Specification §6.2 and
-- are intentionally closed for the MVP. Values likely to churn would move to
-- lookup tables later; the listed sets are stable enough for enums now.

create extension if not exists "pgcrypto";

-- Internal helpers, scheduled-job functions, and integration config live here,
-- out of the API-visible surface.
create schema if not exists private;

-- ── onboarding / profile enums ─────────────────────────────────────────
create type public.preferred_units_enum as enum ('metric', 'imperial');

create type public.goal_enum as enum (
  'lose_fat', 'build_muscle', 'body_recomposition', 'maintain_weight'
);

create type public.experience_level_enum as enum ('beginner', 'intermediate', 'advanced');

create type public.coach_personality_enum as enum ('beast_mode', 'supportive', 'tough_love');

create type public.onboarding_state_enum as enum (
  'account_created',
  'personal_details_complete',
  'goal_complete',
  'training_profile_complete',
  'coach_selected',
  'plan_generated',
  'notifications_decided',
  'onboarding_complete'
);

-- ── plan enums ──────────────────────────────────────────────────────────
create type public.plan_status_enum as enum ('draft', 'active', 'superseded', 'generation_failed');

create type public.plan_generation_reason_enum as enum (
  'initial_onboarding',
  'goal_changed',
  'body_data_changed',
  'workout_frequency_changed',
  'workout_days_changed',
  'workout_duration_changed',
  'manual_override'
);

create type public.plan_source_enum as enum ('deterministic_engine', 'manual_override');

create type public.workout_day_status_enum as enum ('workout', 'rest');

-- ── mission enums ─────────────────────────────────────────────────────────
create type public.mission_type_enum as enum ('workout_day', 'rest_day');

create type public.mission_status_enum as enum (
  'scheduled', 'active', 'completed', 'failed', 'shield_penalty_applied', 'streak_updated'
);

create type public.mission_outcome_enum as enum ('completed', 'failed');

-- ── shield enums ──────────────────────────────────────────────────────────
create type public.shield_transaction_type_enum as enum (
  'monthly_allocation',
  'missed_workout_penalty',
  'rest_day_calorie_penalty',
  'flame_extinguished_reset',
  'administrative_adjustment'
);

-- ── coach enums ───────────────────────────────────────────────────────────
create type public.coach_event_type_enum as enum (
  'onboarding_completed',
  'mission_completed',
  'mission_failed',
  'shield_penalty_applied',
  'flame_extinguished',
  'streak_milestone',
  'weekly_review'
);

create type public.coach_message_status_enum as enum (
  'pending', 'generated', 'generation_failed', 'suppressed'
);

-- ── notification enums ─────────────────────────────────────────────────────
create type public.notification_decision_enum as enum ('enabled', 'declined');

create type public.notification_delivery_status_enum as enum (
  'pending', 'sent', 'delivered', 'failed', 'skipped'
);

-- Dev-only seed data. Runs automatically on `supabase db reset` against the
-- local stack started by `supabase start`. Never run this against a real
-- production project — it fabricates an auth.users row directly, which is
-- fine for local testing but is not how real signups work.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'demo@nodaysoff.dev', crypt('password123', gen_salt('bf')),
  now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'
) on conflict (id) do nothing;

insert into public.user_profiles (
  id, name, age, height_cm, weight_kg, goal, workouts_per_week, coach_style, calorie_target
) values (
  '11111111-1111-1111-1111-111111111111',
  'דמו', 27, 178.0, 82.0, 'lose_weight', 4, 'tough_love', 2100
) on conflict (id) do nothing;

insert into public.workout_schedule_days (user_id, day_of_week, day_type)
values
  ('11111111-1111-1111-1111-111111111111', 0, 'rest'),
  ('11111111-1111-1111-1111-111111111111', 1, 'workout'),
  ('11111111-1111-1111-1111-111111111111', 2, 'rest'),
  ('11111111-1111-1111-1111-111111111111', 3, 'workout'),
  ('11111111-1111-1111-1111-111111111111', 4, 'rest'),
  ('11111111-1111-1111-1111-111111111111', 5, 'workout'),
  ('11111111-1111-1111-1111-111111111111', 6, 'workout')
on conflict (user_id, day_of_week) do nothing;

insert into public.daily_missions (id, user_id, mission_date, day_type, calorie_target)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  current_date, 'workout', 2100
) on conflict (user_id, mission_date) do nothing;

insert into public.mission_outcomes (mission_id, user_id, completed, outcome)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  true, 'success'
) on conflict (mission_id) do nothing;

insert into public.streak_states (user_id, current_streak, longest_streak, last_checked_date)
values ('11111111-1111-1111-1111-111111111111', 5, 12, current_date)
on conflict (user_id) do nothing;

insert into public.monthly_shield_states (user_id, shield_month, shields_remaining)
values ('11111111-1111-1111-1111-111111111111', date_trunc('month', current_date), 3.5)
on conflict (user_id, shield_month) do nothing;

insert into public.coach_events (user_id, event_type, metadata)
values ('11111111-1111-1111-1111-111111111111', 'mission_complete', '{"streak": 5}')
on conflict do nothing;

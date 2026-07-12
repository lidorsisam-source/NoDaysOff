-- Dev-only seed for the local Supabase stack (`supabase db reset`). Never run
-- against production — it fabricates an auth.users row directly.
--
-- Creates one demo user. The on_auth_user_created trigger bootstraps its
-- user_profiles row at onboarding_step = account_created, so the app opens on
-- onboarding for the demo account. Plan/mission/shield rows are created by the
-- domain RPCs (later rounds), not seeded here.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'demo@nodaysoff.dev', crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"דמו"}'
) on conflict (id) do nothing;

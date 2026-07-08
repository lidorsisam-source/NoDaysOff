# NoDaysOff — Supabase backend foundation

Database schema only. No business logic lives here: streak/shield math,
mission generation, AI coach message generation, and notification dispatch
are all intentionally left out — this is just the tables, constraints, and
Row Level Security they'll read and write.

## Tables

| Table | Purpose |
|---|---|
| `user_profiles` | Onboarding profile + generated calorie target. One row per auth user (`id` = `auth.users.id`). |
| `workout_schedule_days` | The weekly plan: one row per user per weekday (0=Sunday..6=Saturday), `workout` or `rest`. |
| `daily_missions` | One mission per user per calendar date, snapshotted from the plan. |
| `mission_outcomes` | One outcome per mission (`pending`/`success`/`missed`/`overage`). |
| `streak_states` | One row per user: current/longest streak + last processed date. |
| `monthly_shield_states` | One shield balance (0–4, half-steps allowed) per user per calendar month. |
| `coach_events` | Log of triggers the coach reacts to (`app_open`, `mission_complete`, `full_penalty`, `half_penalty`, `new_streak`, `new_month`, `achievement`). |
| `coach_messages` | Messages actually shown to the user, optionally linked to the event that triggered them. |
| `push_tokens` | Device push tokens; a user may register multiple devices. |
| `notification_logs` | Record of notifications actually sent. |

Key relationships enforced at the DB level (not in application code):
- One profile per auth user — `user_profiles.id` is both the primary key and the FK to `auth.users.id`.
- One mission per user per date — `unique (user_id, mission_date)` on `daily_missions`.
- One outcome per mission — `mission_outcomes.mission_id` is its primary key, and a composite FK against `daily_missions (id, user_id)` guarantees an outcome's `user_id` can never diverge from its mission's real owner.
- One streak state per user — `streak_states.user_id` is its primary key.
- One shield state per user per month — `unique (user_id, shield_month)` on `monthly_shield_states`.

## Row Level Security

RLS is enabled on all 10 tables. Every policy scopes access to `auth.uid()`
matching the row's owner (`id` for `user_profiles`, `user_id` everywhere
else) — a user can only ever see or modify their own data.

The `service_role` key bypasses RLS by design (standard Supabase behavior)
so backend/edge-function code can operate across users. **That key must
never be shipped to a frontend build or exposed in a client-readable env
var** (e.g. anything prefixed `VITE_`/`NEXT_PUBLIC_`/`EXPO_PUBLIC_`) — only
the `anon`/publishable key and a user's own session belong on the client.

## Running the migrations

Against a real Supabase project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Against a local stack (requires Docker):

```bash
npx supabase start
npx supabase db reset   # applies migrations/*.sql then seed.sql
```

## Verifying it works

This sandbox has no Docker daemon, so the migrations were verified against
a plain local Postgres 16 instance with a minimal `auth.users` stub and an
`auth.uid()` shim instead of the full Supabase stack. Confirmed:

- Both migration files apply cleanly in order with no errors.
- `seed.sql` inserts without violating any constraint.
- RLS actually isolates rows: a session with no identity sees zero rows
  everywhere; a session impersonating the seeded user sees exactly its own
  profile/streak/mission rows; a session impersonating a different user
  sees zero of that data; inserting a row for another user's `user_id`
  while impersonating someone else is rejected.
- `daily_missions` rejects a second row for the same `(user_id, mission_date)`.
- `mission_outcomes` rejects a second row for the same `mission_id`.
- `mission_outcomes` rejects a `user_id` that doesn't match its mission's
  real owner (composite FK).

To re-verify yourself with the real Supabase CLI once Docker is available:

```bash
npx supabase start
npx supabase db reset
npx supabase test db   # or query directly via `npx supabase db psql`
```

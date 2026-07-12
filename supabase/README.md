# NoDaysOff — Supabase backend

Spec-aligned backend foundation, built from the **Backend Foundation Technical
Specification**. This round delivers the **schema + security foundation**
(Phases 2–3 tables and the security scaffolding of Phases 4–8). Domain logic —
onboarding-step RPCs, deterministic plan generation, mission/shield/streak
functions, cron sweeps, and Edge Functions — lands in later rounds.

## Tables (13)

| Table | Purpose |
|---|---|
| `user_profiles` | Authoritative profile, onboarding state (`onboarding_state_enum`), preferences, timezone, and current plan pointers. One row per auth user (`user_id` = `auth.users.id`). |
| `user_plan_versions` | Immutable versioned plan history; at most one `active` per user. Holds calorie target + explainable `calorie_explanation`. |
| `workout_schedule_days` | Seven rows per activated plan; workout/rest per ISO weekday (1=Mon..7=Sun). |
| `daily_missions` | One authoritative mission per user-local date, with timezone snapshot and lifecycle status. |
| `mission_outcomes` | One immutable outcome per mission; `idempotency_key` dedupes completion. |
| `streak_states` | Current/longest streak + flame state cache. |
| `monthly_shield_states` | One shield balance per user per local month; starts at 4.0. |
| `shield_transactions` | Append-only shield ledger; idempotency + partial uniques prevent double penalties. |
| `coach_events` | Structured authoritative events with a personality snapshot. |
| `coach_messages` | One-way system messages (not chat); future AI output is presentation only. |
| `notification_preferences` | Onboarding notification decision + channel prefs. |
| `push_tokens` | User-owned device registrations; raw tokens never stored in cleartext/logs. |
| `notification_logs` | Delivery audit for scheduled notifications. |

Enums (`public.*_enum`) and a `private` schema (internal/scheduled functions)
are created first in `20260712140000_enums.sql`.

### Integrity enforced at the DB level
- **One profile per auth user** — `user_profiles.user_id` PK/FK to `auth.users`.
- **Ownership consistency** — composite `(id, user_id)` foreign keys so a child row's `user_id` can't diverge from its parent's owner (plans→schedule/missions, missions→outcomes/shield ledger, shield state→ledger, events→messages, and `user_profiles.active_plan_id`→same-user plan).
- **One active plan per user** — partial unique index `where status = 'active'`.
- **One mission per user per date** — `unique (user_id, mission_date)`.
- **One outcome per mission** + **one penalty of each kind per mission** — unique + partial-unique on the ledger; plus `idempotency_key` uniqueness on outcomes, shield transactions, coach events, and notification logs.
- **One shield state per user per month**; `remaining_points` clamped `0 … allocated`.
- Workout days require a positive `duration_minutes`; rest days forbid it.

### Not invented here (pending product approval — spec §16/§18)
Calorie-formula coefficients/bounds, exact age/height/weight/duration ranges,
streak-with-Shield semantics, Flame reactivation, and the Rest-Day calorie
source are **not** hard-coded. The schema uses only wide sanity checks
(`> 0`); product ranges and the streak/shield/plan logic arrive with the RPC
layer once those questions are answered.

## Security

RLS is enabled on all 13 tables; every policy is scoped `to authenticated`
with `(select auth.uid()) = user_id`. **Reads** are own-row everywhere.
**Writes** are denied by default and go through `SECURITY DEFINER` RPCs
(later rounds) — except the spec-permitted direct own-row writes: profile
edits (restricted to an allowlist of 12 answer columns via column `GRANT`s,
with a `guard_user_profile_protected_fields` trigger as defense in depth),
notification preferences, and push tokens.

Structural functions use `SECURITY DEFINER` only where they must write
protected tables, each with `set search_path = ''`, fully-qualified names, and
`execute` revoked from `public`/`anon`. `handle_new_auth_user` bootstraps the
profile on signup; `ensure_user_profile()` is the idempotent recovery RPC.

The `service_role` key bypasses RLS by design — **never ship it to a frontend
build or a client-readable env var** (`VITE_`/`NEXT_PUBLIC_`/`EXPO_PUBLIC_`).

## Running the migrations

Real Supabase project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Local stack (requires Docker):

```bash
npx supabase start
npx supabase db reset   # applies migrations/*.sql then seed.sql
```

## How this was verified

No Docker in the build sandbox, so the migrations were applied to a plain
**Postgres 16** with a realistic stub: an `auth` schema (`auth.users` +
`auth.uid()` shim), and `anon` / `authenticated` roles. All four migrations
apply cleanly in order. Behavioral checks confirmed:

- Inserting an `auth.users` row fires `handle_new_auth_user` → exactly one
  profile at `account_created`, copying only `display_name` metadata.
- `ensure_user_profile()` is idempotent.
- RLS isolates rows: no session → 0 rows; user A sees only A; user B sees 0 of
  A's rows; a forged insert of another user's row is rejected by `with check`.
- Column lockdown: an allowlisted column update succeeds; a protected column
  update is denied. The guard trigger rejects protected writes even when column
  privileges are bypassed, and allows them only inside the approved
  (`private.allow_protected_profile_write`) function context.
- Composite-ownership FK rejects a mission referencing another user's plan.
- Partial uniques reject a 2nd active plan per user and a 2nd missed-workout
  penalty per mission; the day-type check rejects a workout day with no
  duration.

Re-verify with the real CLI once Docker is available:

```bash
npx supabase start && npx supabase db reset
npx supabase db psql   # then run cross-user / transition tests
```

## Roadmap (remaining spec phases)

Onboarding-step RPC state machine · deterministic plan generation (needs
approved calorie constants) · `ensure_daily_mission` / `complete_mission` /
shield-penalty / streak functions (need streak & flame-reactivation rules) ·
cron sweeps (daily mission, monthly shield, notifications, weekly review) ·
Edge Function contracts (coach message, push delivery).

-- Discipline OS — schema
-- Maps 1:1 to §3.2 of the blueprint (Identity → Goal → Habit → Intention → Log + Coach Memory).
-- Single-user now; multi-user-ready because every row is scoped to auth.uid() via RLS.
-- Run with: supabase db push   (or paste into the SQL editor)

create extension if not exists "pgcrypto";

-- ── IDENTITIES — who you're becoming (the durable motivation layer) ──────────
create table identities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,                 -- "An engineer who thinks in systems"
  description text,
  created_at  timestamptz not null default now()
);

-- ── GOALS — specific, time-bound outcomes (Locke & Latham) ───────────────────
create table goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  identity_id uuid references identities(id) on delete set null,
  title       text not null,
  outcome     text,                           -- the measurable target
  target_date date,
  status      text not null default 'active'
              check (status in ('active','achieved','paused','dropped')),
  created_at  timestamptz not null default now()
);

-- ── HABITS — the recurring behavior that serves a goal ───────────────────────
-- status drives staggering: only a few 'active' at once, the rest 'queued'.
create table habits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  goal_id          uuid references goals(id) on delete cascade,
  name             text not null,             -- "One focused study block"
  tiny_version     text not null,             -- the worst-day minimum
  cadence          jsonb not null default '{"type":"daily"}',
                   -- {"type":"daily"} | {"type":"weekly_count","target":3}
                   -- | {"type":"days","days":["mon","wed","fri"]}
  status           text not null default 'queued'
                   check (status in ('active','queued','paused','retired')),
  activation_order int,                        -- lower = phase in sooner
  activated_at     timestamptz,
  -- auto_source: null = manual only. When set, an external signal can satisfy this habit
  -- without a tap (the lowest-friction log is no log). HealthKit is native-only, so this
  -- only fires once you Capacitor-wrap (see README). e.g. workout habit:
  --   {"provider":"healthkit","metric":"workout","min_duration_min":15}
  -- Guitar/pottery should stay null — no Health signal maps to them.
  auto_source      jsonb,
  created_at       timestamptz not null default now()
);

-- ── IMPLEMENTATION INTENTIONS — anchor + behavior + context (Gollwitzer) ─────
create table implementation_intentions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  habit_id   uuid not null references habits(id) on delete cascade,
  anchor     text not null,                    -- "After my morning coffee"
  behavior   text not null,                    -- "I sketch one system-design component"
  context    text,                             -- "at my desk, before Slack"
  created_at timestamptz not null default now()
);

-- ── HABIT LOGS — the self-monitoring core (Harkin et al. 2016) ───────────────
-- Absence of a row for a date = "not yet logged". One log per habit per day.
create table habit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  habit_id     uuid not null references habits(id) on delete cascade,
  log_date     date not null default current_date,
  status       text not null check (status in ('done','skipped')),
  -- how this log was created. A future Apple Health auto-log is just source='healthkit'
  -- — no schema change needed when you add HealthKit later.
  source       text not null default 'manual' check (source in ('manual','healthkit','auto')),
  note         text,
  practice_note text,                          -- deliberate practice: what was at the edge today
  -- derived facts only (never the raw health stream): {"duration_min":32,"kcal":410,"hk_uuid":"..."}
  -- store hk_uuid here and check it before inserting to dedupe re-imports.
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  unique (habit_id, log_date)
);

-- ── REFLECTIONS — free-form daily check-ins (optional) ───────────────────────
create table reflections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  reflection_date date not null default current_date,
  content         text not null,
  created_at      timestamptz not null default now()
);

-- ── COACH MEMORY — the relationship moat (coach writes here itself) ──────────
-- kind 'profile'     = durable facts (what motivates you, your obstacles, prefs)
-- kind 'observation' = things the coach noticed over time
create table coach_memory (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  kind               text not null check (kind in ('profile','observation')),
  content            text not null,
  created_at         timestamptz not null default now(),
  last_referenced_at timestamptz
);

-- ── WEEKLY REVIEWS — rolling episodic summaries (keeps history compact) ──────
create table weekly_reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  week_end    date not null,
  summary     text not null,
  wins        text,
  struggles   text,
  adaptations text,
  created_at  timestamptz not null default now()
);

-- ── PLAN PROPOSALS — coach proposes, you decide (SDT autonomy, in the schema) ─
-- The coach can NEVER mutate your plan directly. It records a proposal here and
-- you accept/reject it in the UI. This is an architectural guardrail, not a UI nicety.
create table plan_proposals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  change_type text not null,                   -- activate_habit | pause_habit | shrink_habit | grow_habit | new_habit | other
  details     text not null,
  rationale   text,
  status      text not null default 'pending'
              check (status in ('pending','accepted','rejected')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ── COACH MESSAGES — conversation history ────────────────────────────────────
create table coach_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index on goals (user_id, status);
create index on habits (user_id, status, activation_order);
create index on implementation_intentions (habit_id);
create index on habit_logs (user_id, log_date desc);
create index on habit_logs (habit_id, log_date desc);
create index on coach_memory (user_id, kind, created_at desc);
create index on weekly_reviews (user_id, week_start desc);
create index on plan_proposals (user_id, status);
create index on coach_messages (user_id, created_at desc);

-- ── Row-Level Security — every table, same rule: you only touch your own rows ─
do $$
declare t text;
begin
  foreach t in array array[
    'identities','goals','habits','implementation_intentions','habit_logs',
    'reflections','coach_memory','weekly_reviews','plan_proposals','coach_messages'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

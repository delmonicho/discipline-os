# Discipline OS — CLAUDE.md

## What this app is

A personal habit-coaching PWA. Calm, meditative daily loop: press-and-hold an orb to complete a habit, an AI coach with memory, a proposals inbox, and a Progress garden/heatmap. Single user (nicho.delmo@gmail.com) for now; schema is multi-user-ready via RLS.

## Navigation

```
src/
  App.tsx                 — AuthGate wrapping DisciplineOS (entry point)
  DisciplineOS.tsx        — composition root: useToday() + tab routing (Today/Coach/Plan/Progress)
  database.types.ts       — hand-authored Database type (mirrors migrations)
  types.ts                — app view models (Habit, Goal, Proposal, …)
  lib/                    — supabase (typed client), useAuth, format, styles, history
  data/                   — typed Supabase queries: habits, logs, proposals, coach
  hooks/useToday.ts       — habits/logs/proposals state + mutations
  components/             — Ambient, SignIn, AuthGate, today/, coach/, plan/, progress/
  (folder detail: src/CLAUDE.md)
prototype/
  DisciplineOS.jsx        — design reference (do not edit; src/ is the working copy)
supabase/
  migrations/             — 001_discipline_os.sql (10 tables) + 002 weekly-review unique index
  functions/
    coach-stream/         — streaming coach endpoint (NDJSON, prompt-cached)
    weekly-review/        — weekly review generation + observation compaction
    _shared/coach-core.ts — system prompt (stance/context blocks), tools, memory assembly
```

## Habit data flow

- Habits are fetched on mount via `data/habits.ts` `fetchTodayState`; `shapeHabit` adds hue/c1/c2
  from the UUID, the identity join, and the anchor. State + all mutations live in `hooks/useToday.ts`.
- Orb press-and-hold completes (upsert `habit_logs` source='manual'); "Not today" logs a neutral
  `skipped`; tapping a done/skipped orb undoes it (delete). done/skipped share the day's single row
  (unique habit_id,log_date) and are optimistic with revert on error.
- Coach streams from `/functions/v1/coach-stream` (NDJSON, via `data/coach.ts`); thread from `coach_messages`.
- Proposals loaded from `plan_proposals` on Plan tab open. The accept sheet now handles **all**
  change_types (activate/pause/shrink/grow/new_habit) and always writes status='accepted'; reject
  sets status='rejected'. Pessimistic: local state changes only after the DB writes succeed.
- "Reflect on this week" (Progress) calls `/functions/v1/weekly-review` → a `weekly_reviews` row.

## Env vars (in .env.local — never commit)

| Var | Purpose |
|-----|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key — client only, RLS enforces access |

## DB schema (key tables)

`identities` → `goals` → `habits` (active|queued) → `implementation_intentions` → `habit_logs`
`coach_messages`, `coach_memory`, `plan_proposals`

Full schema: `supabase/migrations/001_discipline_os.sql`

## localStorage policy

**None.** State lives in React + Supabase only (invariant 6).

## Invariants — never violate

1. Aesthetic is final — inline styles, Fraunces/Hanken Grotesk, twilight palette, drifting ambient, bloom/spring animations. No Tailwind, no component library.
2. Coach proposes only — plan mutations go through `plan_proposals` + explicit user Accept.
3. No shame — misses are neutral, garden growth is permanent (total completions), use "rhythm" not "streak."
4. ≤3 active habits — enforce in UI on `activate_habit` accept.
5. Source-aware logs — `habit_logs.source='manual'`, preserve `source`/`metadata` columns.
6. No localStorage/sessionStorage.
7. RLS-scoped queries — anon key on client only; inserts set `user_id`.
8. NDJSON over fetch (not SSE); Bearer = user access token, not anon key.

## Build phases

- **Phase 0** (done) — Auth + prototype drop-in
- **Phase 1** (done) — Today loop wired to real habits/logs
- **Phase 2** (done) — Progress wired to real habit_logs history
- **Phase 3** (done) — Coach streams from coach-stream NDJSON
- **Phase 4** (done) — Proposals accept/reject with implementation_intentions
- **Phase 5** (done) — Refactor into lib/data/hooks/components + `.tsx` with DB types (behavior unchanged)
- **Phase 6** (done) — Coach prompt caching, full proposal acceptance, skip logging, weekly-review + compaction
- **Phase 7** — Public-ready: onboarding, rate limiting, observability — see `ROADMAP.md`

## Roadmap / deferred

Work intentionally not built yet (onboarding/multi-user, coach rate limiting + spend observability,
notifications, HealthKit/Capacitor, vector memory) lives in `ROADMAP.md`, with its scale triggers.

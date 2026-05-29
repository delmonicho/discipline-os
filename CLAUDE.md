# Discipline OS — CLAUDE.md

## What this app is

A personal habit-coaching PWA. Calm, meditative daily loop: press-and-hold an orb to complete a habit, an AI coach with memory, a proposals inbox, and a Progress garden/heatmap. Single user (nicho.delmo@gmail.com) for now; schema is multi-user-ready via RLS.

## Navigation

```
src/
  App.tsx                 — AuthGate wrapping DisciplineOS (entry point)
  DisciplineOS.jsx        — single-file prototype, all four views (Today/Coach/Plan/Progress)
  lib/
    supabase.ts           — singleton Supabase client (anon key, no service role)
    useAuth.ts            — session/user hook, signIn (magic link), signOut
  components/
    SignIn.tsx            — magic-link sign-in screen
    AuthGate.tsx          — renders SignIn or children based on session
prototype/
  DisciplineOS.jsx        — design reference (do not edit; src/ copy is the working one)
supabase/
  migrations/             — 001_discipline_os.sql — all 10 tables
  functions/
    coach-stream/         — streaming coach endpoint (NDJSON)
    _shared/coach-core.ts — system prompt, tools, memory assembly
```

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
- **Phase 1** — Today loop wired to real habits/logs
- **Phase 2** — Progress wired to real habit_logs history
- **Phase 3** — Coach streaming (NDJSON)
- **Phase 4** — Proposals (plan_proposals accept/reject)
- **Phase 5** — Refactor into components/ + hooks/ (behavior unchanged)

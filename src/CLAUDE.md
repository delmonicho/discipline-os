# src/ — folder map

Phase 5 done: the old monolith is split into a typed data layer + a hook + per-view components.
`DisciplineOS.tsx` is now a thin composition root. Behavior is unchanged from Phases 1–4.

```
src/
  App.tsx              — root: AuthGate + DisciplineOS
  DisciplineOS.tsx     — composition root: useToday() + tab routing (Today/Coach/Plan/Progress)
  database.types.ts    — hand-authored Database type (mirrors supabase/migrations)
  types.ts             — app view models (Habit, Goal, Proposal, AcceptPayload, HabitHistory, HistoryEntry)
  lib/
    supabase.ts        — createClient<Database> singleton (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
    useAuth.ts         — { session, user, loading, signIn, signOut }
    format.ts          — hueFromId, mix, hx, lerp, vibrate, HOLD_MS
    styles.ts          — inline-style object S + sendBtn/toggleBtn/navBtn + CSS keyframes
    history.ts         — computeHistory (13-week grid + rhythm stats from habit_logs)
  data/                — typed Supabase queries/mutations (the single source of truth)
    habits.ts          — fetchTodayState, shapeHabit
    logs.ts            — logDone, logSkipped, removeLog
    proposals.ts       — fetchPending, applyProposal (per change_type), rejectProposal
    coach.ts           — fetchThread, streamCoach (NDJSON), reflectWeek
  hooks/
    useToday.ts        — owns habits/done/skipped/history/proposals + all mutations
  components/
    Ambient.tsx        — drifting warmth mesh
    SignIn.tsx         — magic-link email form
    AuthGate.tsx       — loading shimmer → SignIn → children
    today/{Today,HabitOrb}.tsx
    coach/Coach.tsx
    plan/Plan.tsx
    progress/{Progress,Garden,Plant,HabitHeatmap}.tsx + stages.ts
```

`database.types.ts` is hand-authored to mirror `supabase/migrations/`. Regenerate with
`supabase gen types typescript --local > src/database.types.ts` once the local stack is running;
keep the same shape so the typed client keeps working.

TS config note: `noImplicitAny` and `strictNullChecks` are effectively on — annotate component
props (see the `Props` types) and guard nullables.

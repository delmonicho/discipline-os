# src/ — folder map

```
src/
  App.tsx            — root: AuthGate + DisciplineOS
  DisciplineOS.jsx   — all four views in one file (Today, Coach, Plan, Progress)
                       Phase 1 done: Today wired to Supabase (habits + habit_logs).
                       Coach (Phase 3) and Proposals (Phase 4) still use mock/empty state.
  lib/
    supabase.ts      — createClient singleton (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
    useAuth.ts       — { session, user, loading, signIn, signOut }
  components/
    SignIn.tsx        — magic-link email form, matching prototype aesthetic
    AuthGate.tsx      — loading shimmer → SignIn → children
```

Future folders (added in later phases):
- `data/`  — query functions (habits, logs, proposals, coach thread)
- `hooks/` — useTodayHabits, useTodayLogs, useCoachStream, useProposals

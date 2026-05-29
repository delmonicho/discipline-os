# Claude Code — Start Prompt for Discipline OS

Paste everything below into Claude Code at the repo root.

---

You're helping me build **Discipline OS**, a personal habit-coaching PWA I'll dogfood myself before opening it up. Read these files first — they are the source of truth, do not redesign them:

- `prototype/DisciplineOS.jsx` — the **design + interaction** truth. The look, animations, copy, and component structure are decided. Port it; don't restyle it.
- `supabase/migrations/001_discipline_os.sql` — the data model and RLS.
- `supabase/functions/coach-stream/index.ts` and `coach/index.ts` — the coach API (already deployed).
- The backend `README.md` — has the NDJSON stream-reader client snippet and the table→feature map.

## What the app is
A calm, meditative habit coach. Five layers: Identity → Goal → Habit → Implementation Intention → daily action. A daily loop (press-and-hold an orb to complete), a generative AI coach with memory, a proposals inbox, and a Progress page (a garden, with a heatmap toggle). I (Nicho) am the only user for now; the schema is already multi-user-ready via RLS.

## Your job
Scaffold auth and wire the prototype's mock data to live Supabase, **in the phases below, stopping after each for me to test.** Start by dropping `DisciplineOS.jsx` in as a single rendering component; wire data into it; only refactor into separate files once it works end-to-end. Ship the loop first.

## Invariants — do not violate these (they're load-bearing design decisions)
1. **Keep the aesthetic exactly.** Inline styles, the Fraunces/Hanken Grotesk fonts, the twilight palette, the drifting ambient that warms with progress, the spring/bloom on completion. No Tailwind utility restyling, no component library.
2. **The coach proposes, never mutates.** Plan changes go through `plan_proposals`; only an explicit user Accept applies them. Never have the coach write directly to `habits`.
3. **No shame mechanics.** Misses are quiet neutral cells / sleeping plants — never red, never "streak broken." The garden's growth is permanent (driven by *total* completions); missing only changes vitality, never height. Use "rhythm," not "streak."
4. **≤3 active habits.** Enforce in the UI when accepting an `activate_habit` proposal.
5. **Source-aware logs.** Completions insert `habit_logs` with `source='manual'`. Don't drop the `source`/`metadata` columns — they're for future HealthKit auto-logs.
6. **No `localStorage`/`sessionStorage`.** State in React + Supabase only.
7. **RLS-scoped queries.** Never add a service-role key to the client. All reads rely on RLS; inserts set `user_id`.
8. **Streaming over fetch + NDJSON**, not SSE/EventSource. Pass the user's access token (`supabase.auth.getSession()`) as the Bearer — not the anon key — to the coach functions.

## Phased build (checkpoint after each)

**Phase 0 — Foundations.** `src/lib/supabase.ts` (client from `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`). A `useAuth` hook + a minimal email-magic-link sign-in screen matching the aesthetic. Gate the app behind auth. Drop `DisciplineOS.jsx` in as-is so it renders for a signed-in user. → *Checkpoint: I can sign in and see the prototype.*

**Phase 1 — Today loop (real).** Load active + queued habits (+ their implementation_intentions) from Supabase, replacing the hardcoded `HABITS`. On completing an orb, `upsert` into `habit_logs` (`{habit_id, log_date: today, status:'done', source:'manual'}`, onConflict `habit_id,log_date`); undo deletes that row. Derive the `done` set from today's logs. Greeting name from the user. → *Checkpoint: completions persist across refresh; ambient warms.*

**Phase 2 — Progress (real history).** Fetch the last ~97 days of `habit_logs` once into a `Map<habitId, Set<dateString>>`. Rewrite `computeHistory` to read from that map instead of `rngDone` — **keep the exact grid layout, stage thresholds, and stat logic.** Garden + grid toggle both read real data. → *Checkpoint: garden/grid reflect real logs; today's completion lights the live cell / wakes the plant.*

**Phase 3 — Coach (streaming).** Load thread from `coach_messages`. Wire `Coach` to `POST {VITE_SUPABASE_URL}/functions/v1/coach-stream` using the NDJSON reader from the backend README — render `text` deltas into the bubble and `status` events as inline pills. Replace `simulateCoach`. → *Checkpoint: real coached replies stream; memory writes show as status pills; new `coach_memory` rows appear.*

**Phase 4 — Proposals (real).** `Plan` loads pending `plan_proposals`. Accept → update proposal to `accepted` AND apply it (for `activate_habit`: set the habit `status='active'`, `activated_at=now()`, and prompt me for its anchor → insert an `implementation_intentions` row), respecting the ≤3 cap. "Not yet" → `rejected`. → *Checkpoint: accepting wakes a queued habit on Today.*

**Phase 5 — Refactor.** Only now split the single file into `components/`, `data/` (query functions), `hooks/`. Keep behavior identical.

## Out of scope (don't build unless I ask)
Onboarding flow (the seed is my onboarding), push/local notifications, HealthKit/Capacitor, vector-search memory, weekly-review automation, any visual redesign. Flag these as future work; don't start them.

Begin with Phase 0. Show me the plan for Phase 0 before writing code, then go.

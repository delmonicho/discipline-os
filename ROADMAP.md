# Discipline OS — Roadmap / Deferred Work

This file is the single home for work intentionally **not** built yet. The dogfood app (one user)
is deliberately small; everything here is a real future need with a clear trigger. Keep it in sync
with the build-phases list in `CLAUDE.md`.

See also: `DISCIPLINE_OS_BLUEPRINT.md` (product thesis) and `CLAUDE_CODE_PROMPT.md` (original
"out of scope" list, restated below so it lives in one place).

---

## Before any non-private / multi-user use

These are the hard blockers to a second real user — "schema is multi-user-ready via RLS" is true at
the data layer but the app cannot yet onboard anyone but the seeded user.

- **Onboarding + identity/goal creation.** Today the only way to create plan data is the seed
  (`supabase/seed_personal.sql`, hardcoded to one UUID) and the coach's `propose_plan_change` tool —
  which can propose *habits* but **cannot create `identities` or `goals`**. A second user signs in to
  an empty app with no way to populate it. Need: a first-run flow (identity → goal → first habit),
  and/or new coach tools / a creation UI for identities and goals. **This, not the schema, is what
  blocks multi-user.**
- **Rate limiting on `coach-stream`.** The function calls Anthropic on every turn with no throttle;
  `ANTHROPIC_API_KEY` spend is unbounded the moment the app is non-private. Add per-user rate limiting
  (e.g. a `coach_messages` count window, or an edge KV counter) before opening up.
- **Spend / usage observability.** Log `usage` from `finalMessage()` (input/output/cache tokens) per
  turn so cost is visible. No spend monitoring exists today.

## Already deferred (restated from CLAUDE_CODE_PROMPT.md "out of scope")

- **Push / local notifications.** The behavioral core ("never two misses in a row", smallest re-entry)
  depends on a nudge the app cannot send as a PWA. This is the single biggest goal-gap that the web
  platform can't close — it arrives with the native wrap.
- **HealthKit + Capacitor native wrap.** The schema is already prepared (`habit_logs.source`,
  `habits.auto_source`) for auto-logged workouts. HealthKit is native-only, so "import Apple Health"
  is the requirement that eventually forces a Capacitor build. Wrap the same React app — don't rewrite.
- **Vector-search memory / embeddings.** Tier-2/3 coach memory is loaded in full each turn today
  (intentional YAGNI for one user). Move `coach_memory` + `weekly_reviews` to embeddings + retrieval
  once full-context load stops being comfortable.

## Scale triggers to watch

- **Context size:** when profile facts + observations + weekly reviews no longer fit comfortably in
  the coach's context window (or cost climbs), switch Tier-2/3 to retrieval. Until then, full load is
  intentional. (The weekly-review compaction added in Phase 6 buys a lot of runway here.)
- **History:** `buildHistory` loads the last 30 `coach_messages`; weekly reviews are the long-horizon
  memory. If raw-message volume becomes a storage/query concern, archive older messages once their
  week has a review.
- **Per-user cost:** revisit prompt-cache hit rate and `max_tokens` once there is real traffic.

# Discipline OS — backend (personal dogfood phase)

The Supabase backend for the coach in `DISCIPLINE_OS_BLUEPRINT.md`. This is **Phase 0 (schema) + the core of Phase 3 (coach with memory)** — the part that's hard to copy and the part you actually want first. The daily-loop client (Phases 1–2) is the next build.

```
supabase/
  migrations/001_discipline_os.sql   ← data model + RLS (§3.2), source-aware logs for HealthKit
  functions/
    _shared/coach-core.ts            ← tools, memory assembly, system prompt (bundled, not deployed)
    coach-stream/index.ts            ← NDJSON streaming coach (the only LLM surface)
  seed_personal.sql                  ← your §4 plan as data, so you can talk to it today
```

The streaming coach is the only deployed LLM function. (A non-streaming `coach/` existed for week-1
dogfooding; it was removed once `coach-stream` became the real UX — one less path to keep in sync.)

## How it maps to the blueprint

| Blueprint | Here |
|---|---|
| Identity → Goal → Habit → Intention → Log (§3.2) | the seven core tables |
| Self-monitoring is the active ingredient (§1.2) | `habit_logs`, one row per habit per day |
| Three-tier memory (§2.3) | Tier 1 = live queries of state; Tier 2 = `coach_memory`; Tier 3 = `weekly_reviews` + `coach_messages` |
| Coach writes its own notes (§2.3) | the `remember` tool |
| "Coach proposes, you decide" (§1.4 autonomy) | `propose_plan_change` → `plan_proposals`, never auto-applied |
| Stagger to ≤3 habits (§2.1) | `habits.status` (`active` vs `queued`) + the system prompt enforcing it |
| MI stance, tiny actions, compassionate misses (§2.1) | the system prompt in `buildSystemPrompt` |

## Three design decisions worth knowing

1. **The coach cannot change your plan.** It can only *propose* (a row in `plan_proposals` you accept/reject). That's the autonomy principle from the SDT research, enforced in the architecture rather than left to good intentions.
2. **No RAG yet.** For one user, your whole history fits in context for a long time, so the function just *loads* memory instead of doing vector retrieval. Add embeddings only when you open it up. (YAGNI for the dogfood phase.)
3. **Streaming is the only LLM surface that needs it.** The daily loop is a plain DB write (sub-10s, no model). Only the chat streams — and it streams over **fetch + NDJSON, not SSE**, because SSE can't carry the Supabase JWT cleanly and breaks inside a native webview. The method is chosen to survive the eventual native move.

## Deploy

```bash
supabase db push                                  # apply the schema (incl. 002 weekly-review index)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... # SUPABASE_URL/ANON_KEY are auto-injected
supabase functions deploy coach-stream
supabase functions deploy weekly-review
# sign up once, grab your auth uid, paste it into seed_personal.sql, run it
```

`weekly-review` writes a `weekly_reviews` row from the last ISO week's logs + chat (the Tier-3
memory the coach prompt injects), then prunes observations from before this week so `coach_memory`
stays bounded. It's idempotent (upsert on `user_id, week_start`). Triggered manually today via the
"Reflect on this week" button in Progress; schedule with pg_cron later (see `../ROADMAP.md`).

Quick check (streaming NDJSON — each line is one `{type,value}` event):

```bash
curl -N -X POST "$SUPABASE_URL/functions/v1/coach-stream" \
  -H "Authorization: Bearer <your-user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Morning — did my system design block, skipped the gym. Felt behind."}'
```

You should get a streamed coached reply, and — if it noticed something durable — a new row in `coach_memory`. The function logs `coach usage:` per turn (incl. `cache_read_input_tokens`) so you can confirm prompt caching is hitting.

## Consuming the stream (client)

NDJSON over fetch. Read chunks, split on newlines, parse each complete line:

```ts
async function streamCoach(message: string, jwt: string, onText: (t: string) => void, onStatus: (s: string) => void) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/coach-stream`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";                 // keep the partial last line
    for (const line of lines) {
      if (!line.trim()) continue;
      const ev = JSON.parse(line);
      if (ev.type === "text") onText(ev.value);        // append to the bubble
      else if (ev.type === "status") onStatus(ev.value); // render inline: "📝 remembered …"
      else if (ev.type === "error") throw new Error(ev.value);
    }
  }
}
```

The `status` events are a feature, not noise — render them inline so the coach's memory writes and proposals are visible. That legibility is the trust mechanism.

## Mobile, web, and the iOS / Apple Health path

The choices above are deliberately native-ready. The plan:

- **Now: one React PWA** (same stack as Potheads/LearnLang), installable on mobile, runs on web, on Vercel. Split the surfaces by job: **mobile owns the daily loop + check-ins + prompts**; **web/desktop owns the slower work** — stating intentions, reading long coach reflections, the weekly review. Cache the daily loop in the service worker so you can log with no signal.
- **Later: wrap, don't rewrite.** [Capacitor](https://capacitorjs.com) puts the *same* React app in a native iOS shell, unlocking native plugins. A clean PWA wraps painlessly — which is why it's worth keeping clean now.
- **HealthKit is native-only** — no PWA can read it, period. So "import Apple Health" is the single requirement that forces a native build eventually. When you wrap with Capacitor, a workout from Apple Watch can **auto-satisfy your `Train` habit with zero taps** → a `habit_logs` row with `source='healthkit'` and `metadata` like `{"duration_min":32,"hk_uuid":"..."}`. The lowest-friction log is no log — this attacks the abandonment cliff for fitness directly. The schema already supports it (`habit_logs.source`, `.metadata`, and `habits.auto_source`); no migration needed.
  - **Privacy pattern:** read HealthKit on-device, derive only the habit-relevant fact, sync *that* — never the raw health stream. Dedupe on `hk_uuid` before inserting.
- **Prompts = scheduled local notifications, not server push.** Your intentions fire at known times ("after morning coffee"), so schedule on-device local notifications once you're in Capacitor — rock-solid, no push server to build. Skip web/server push entirely.

## Next build (Phases 1–2: the daily loop)

The client (Vite + React 19, Tailwind v4, Vercel — same as Potheads/LearnLang), as a **PWA**:

- **Today view**: active habits, one-tap `done` logging (<10s) → `habit_logs` (`source='manual'`).
- **Progress viz**: a heatmap / growing-world view off `habit_logs` — framed as growth, not a breakable chain.
- **Coach chat**: a thread on `coach-stream` + `coach_messages`, with inline status events.
- **Proposals inbox**: pending `plan_proposals` with accept/reject (accept = mutate the plan: flip a queued habit to active, add its intention).
- **Weekly review ritual**: a coached check-in that writes a `weekly_reviews` row.

For the personal phase, skip onboarding polish — the seed *is* your onboarding. Pottery can lean on Potheads; Spanish on LearnLang.

Say the word and I'll build the React PWA daily-loop + streaming coach chat against this schema next.

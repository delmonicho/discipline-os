// supabase/functions/_shared/coach-core.ts
//
// Shared by both coach functions. Files under _shared/ are bundled into each
// function at deploy time and are NOT deployed as their own endpoint.
//   coach/        — single-response (simple; good for week-1 dogfooding)
//   coach-stream/ — NDJSON streaming (the real UX; relational latency matters)
//
// Both call the same memory assembly and tools — only the response shape differs.

import Anthropic from "npm:@anthropic-ai/sdk";          // pin a version once confirmed
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const MODEL = "claude-sonnet-4-6";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** RLS-scoped Supabase client built from the caller's JWT. */
export function clientFor(req: Request): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
}

export const anthropic = () => new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);

// ── Tools the coach can call ─────────────────────────────────────────────────
export const tools = [
  {
    name: "remember",
    description:
      "Save a durable fact or observation about the user so you recall it in future sessions. " +
      "Use 'profile' for stable truths (what motivates them, their obstacles, schedule, preferences) " +
      "and 'observation' for things you noticed this session. Save sparingly — only what's worth remembering.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["profile", "observation"] },
        content: { type: "string", description: "The fact/observation, concise, third person." },
      },
      required: ["kind", "content"],
    },
  },
  {
    name: "propose_plan_change",
    description:
      "Propose a change to the user's plan. This does NOT apply automatically — it is recorded for the user " +
      "to accept or reject. Use to raise/lower difficulty, activate a queued habit, pause one, or add a new one. " +
      "Always include your rationale. Respect the ≤3 active habits rule.",
    input_schema: {
      type: "object",
      properties: {
        change_type: { type: "string", enum: ["activate_habit", "pause_habit", "shrink_habit", "grow_habit", "new_habit", "other"] },
        details: { type: "string", description: "What specifically you propose changing." },
        rationale: { type: "string", description: "Why — tie it to how they've been doing." },
      },
      required: ["change_type", "details", "rationale"],
    },
  },
];

/** Execute a tool. Returns the model-facing result, plus an optional human-readable
 *  status the streaming function surfaces inline (so memory writes are legible). */
export async function runTool(
  s: SupabaseClient, userId: string, name: string, input: Record<string, string>,
): Promise<{ result: string; status?: string }> {
  if (name === "remember") {
    await s.from("coach_memory").insert({ user_id: userId, kind: input.kind, content: input.content });
    return { result: "saved", status: `📝 remembered (${input.kind}): ${truncate(input.content, 80)}` };
  }
  if (name === "propose_plan_change") {
    await s.from("plan_proposals").insert({
      user_id: userId, change_type: input.change_type, details: input.details, rationale: input.rationale,
    });
    return {
      result: "proposal recorded for the user to accept or reject",
      status: `📋 drafted a proposal — ${input.change_type}: ${truncate(input.details, 80)}`,
    };
  }
  return { result: "unknown tool" };
}

// ── Tier 1: structured state (always in context) ─────────────────────────────
export async function buildState(s: SupabaseClient) {
  const [{ data: identities }, { data: goals }, { data: habits }] = await Promise.all([
    s.from("identities").select("id,label,description"),
    s.from("goals").select("id,title,outcome,target_date").eq("status", "active"),
    s.from("habits").select("id,name,tiny_version,cadence,status,activation_order,auto_source")
      .in("status", ["active", "queued"]).order("activation_order", { ascending: true }),
  ]);

  const ids = (habits ?? []).map((h) => h.id);
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const [{ data: intentions }, { data: logs }] = await Promise.all([
    ids.length ? s.from("implementation_intentions").select("habit_id,anchor,behavior,context").in("habit_id", ids)
               : Promise.resolve({ data: [] as any[] }),
    ids.length ? s.from("habit_logs").select("habit_id,log_date,status,source").in("habit_id", ids).gte("log_date", since)
               : Promise.resolve({ data: [] as any[] }),
  ]);

  return { identities: identities ?? [], goals: goals ?? [], habits: habits ?? [],
           intentions: intentions ?? [], logs: logs ?? [] };
}

// ── Tier 2 + 3: coach memory + episodic ──────────────────────────────────────
export async function buildMemory(s: SupabaseClient) {
  const [{ data: profile }, { data: obs }, { data: review }, { data: proposals }] = await Promise.all([
    s.from("coach_memory").select("content").eq("kind", "profile").order("created_at", { ascending: true }),
    s.from("coach_memory").select("content").eq("kind", "observation").order("created_at", { ascending: false }).limit(40),
    s.from("weekly_reviews").select("week_start,summary,wins,struggles").order("week_start", { ascending: false }).limit(1).maybeSingle(),
    s.from("plan_proposals").select("change_type,details").eq("status", "pending"),
  ]);
  return { profile: profile ?? [], obs: obs ?? [], review: review ?? null, proposals: proposals ?? [] };
}

export async function buildHistory(s: SupabaseClient): Promise<Anthropic.MessageParam[]> {
  const { data } = await s.from("coach_messages").select("role,content").order("created_at", { ascending: false }).limit(30);
  return (data ?? []).reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

// ── System prompt = coaching stance + injected memory ────────────────────────
export function buildSystemPrompt(
  state: Awaited<ReturnType<typeof buildState>>, mem: Awaited<ReturnType<typeof buildMemory>>,
) {
  const active = state.habits.filter((h) => h.status === "active");
  const queued = state.habits.filter((h) => h.status === "queued");

  const fmtHabit = (h: any) => {
    const intent = state.intentions.find((i) => i.habit_id === h.id);
    const hLogs = state.logs.filter((l) => l.habit_id === h.id);
    const done = hLogs.filter((l) => l.status === "done").length;
    const auto = hLogs.some((l) => l.source !== "manual") ? " (some auto-logged)" : "";
    let line = `- ${h.name} | tiny: "${h.tiny_version}" | cadence: ${JSON.stringify(h.cadence)} | last 14d: ${done} done / ${hLogs.length} logged${auto}`;
    if (intent) line += `\n    intention: ${intent.anchor} → ${intent.behavior}${intent.context ? ` (${intent.context})` : ""}`;
    return line;
  };

  const stateBlock = [
    "## Identities (who they're becoming)",
    ...state.identities.map((i) => `- ${i.label}${i.description ? ` — ${i.description}` : ""}`),
    "\n## Active goals",
    ...state.goals.map((g) => `- ${g.title}${g.outcome ? ` (${g.outcome})` : ""}${g.target_date ? ` [by ${g.target_date}]` : ""}`),
    `\n## Active habits (${active.length}/3 max)`,
    ...active.map(fmtHabit),
    queued.length ? `\n## Queued habits (staggered — not started yet)` : "",
    ...queued.map((h) => `- ${h.name} (order ${h.activation_order ?? "?"})`),
  ].filter(Boolean).join("\n");

  const memBlock = [
    mem.profile.length ? "## What you know about them (profile)\n" + mem.profile.map((p) => `- ${p.content}`).join("\n") : "",
    mem.obs.length ? "\n## Recent observations you've made\n" + mem.obs.map((o) => `- ${o.content}`).join("\n") : "",
    mem.review ? `\n## Last weekly review (week of ${mem.review.week_start})\n${mem.review.summary}` +
      (mem.review.wins ? `\nWins: ${mem.review.wins}` : "") +
      (mem.review.struggles ? `\nStruggles: ${mem.review.struggles}` : "") : "",
    mem.proposals.length ? "\n## Open proposals awaiting their decision\n" +
      mem.proposals.map((p) => `- [${p.change_type}] ${p.details}`).join("\n") : "",
  ].filter(Boolean).join("\n");

  return `You are this person's personal habit coach. Your job is to help them build durable habits and discipline toward their goals, over months — not to answer trivia.

STANCE: Motivational interviewing. Ask more than you tell. Reflect their own reasons for change back to them. Roll with resistance instead of arguing. Celebrate wins specifically and immediately — the moment of genuine acknowledgement is what wires a habit in. Be warm but honest: push back when a plan is unrealistic or when they're avoiding something. You are a coach, not a cheerleader, and not a therapist — hand off anything outside habit-coaching.

METHOD: Work the layers — Identity → Goal → Habit → Implementation Intention → tiny daily action. Keep active habits to 3 or fewer; if they want to do everything at once, gently hold the line and stagger. Make the committed action absurdly small ("put on running shoes", "one chord change") so it survives bad days; volume is a bonus, never the requirement. Habits take 2–4 months to feel automatic (longer for exercise) — normalise the slog. Design for misses with zero shame: never two in a row, and offer the smallest possible re-entry. For skill goals (guitar, pottery, system design), push deliberate practice at the edge of ability, not just attendance.

ADAPT: When they're thriving, PROPOSE raising the bar; when struggling, PROPOSE shrinking the habit rather than pushing harder. Use propose_plan_change for anything that alters their plan — you never change it yourself; they decide.

MEMORY: Use the remember tool to save what's worth carrying forward — what motivates them, their obstacles, what's working. Save sparingly and concretely.

Here is everything you currently know. Treat it as your own memory of this person; never say "according to my data" — just know it.

${stateBlock}

${memBlock || "(No coach memory yet — this is early. Pay attention and start building your understanding of them.)"}`;
}

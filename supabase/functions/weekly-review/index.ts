// supabase/functions/weekly-review/index.ts
//
// Generates the Tier-3 episodic memory the coach prompt already injects but nothing wrote:
// a weekly_reviews row summarising the last ISO week's logs + conversation. Then it PRUNES
// observations from before this week — the review now carries their gist, which bounds the
// otherwise-unbounded coach_memory growth (see ROADMAP.md "scale triggers").
//
// Trigger: manual today (a "Reflect on this week" button in Progress). Schedule via
// pg_cron + pg_net later. Non-streaming JSON: { ok, review } or { error }.

import { cors, json, clientFor, anthropic, MODEL } from "../_shared/coach-core.ts";

// Monday of the ISO week containing d, as YYYY-MM-DD (UTC).
function isoWeekStart(d: Date): string {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = dt.getUTCDay(); // 0=Sun..6=Sat
  dt.setUTCDate(dt.getUTCDate() + (day === 0 ? -6 : 1 - day)); // back to Monday
  return dt.toISOString().slice(0, 10);
}
const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabase = clientFor(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return json({ error: "unauthorized" }, 401);

    const weekStart = isoWeekStart(new Date());
    const weekEnd = addDays(weekStart, 6);

    // Gather the week (all RLS-scoped to the caller).
    const [{ data: habits }, { data: logs }, { data: messages }, { data: obs }] = await Promise.all([
      supabase.from("habits").select("id,name,status").in("status", ["active", "queued"]),
      supabase.from("habit_logs").select("habit_id,status").gte("log_date", weekStart).lte("log_date", weekEnd),
      supabase.from("coach_messages").select("role,content").gte("created_at", weekStart).order("created_at", { ascending: true }),
      supabase.from("coach_memory").select("content").eq("kind", "observation").order("created_at", { ascending: false }).limit(40),
    ]);

    const habitName = new Map((habits ?? []).map((h) => [h.id, h.name]));
    const tally = new Map<string, { done: number; skipped: number }>();
    for (const l of logs ?? []) {
      const t = tally.get(l.habit_id) ?? { done: 0, skipped: 0 };
      if (l.status === "done") t.done++;
      else if (l.status === "skipped") t.skipped++;
      tally.set(l.habit_id, t);
    }
    const logSummary = [...tally.entries()]
      .map(([id, t]) => `- ${habitName.get(id) ?? "habit"}: ${t.done} done, ${t.skipped} skipped`)
      .join("\n") || "(no logs this week)";
    const convo = (messages ?? []).map((m) => `${m.role}: ${m.content}`).join("\n").slice(-6000);
    const obsBlock = (obs ?? []).map((o) => `- ${o.content}`).join("\n") || "(none)";

    const system =
      "You are the user's habit coach writing their weekly review. Be concise, specific, and warm; " +
      "no shame about misses (a skip is a neutral, healthy choice, not a failure). Respond with ONLY a " +
      "JSON object with keys: summary (2-4 sentences), wins (string), struggles (string), adaptations " +
      "(string — concrete things to consider, framed as suggestions, never imposed).";
    const userMsg = `Week of ${weekStart} to ${weekEnd}.

## Habit activity
${logSummary}

## Recent observations you've noted
${obsBlock}

## This week's conversation
${convo || "(no chat this week)"}`;

    const resp = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match
      ? JSON.parse(match[0])
      : { summary: text.trim(), wins: "", struggles: "", adaptations: "" };

    const { data: review, error: upErr } = await supabase.from("weekly_reviews").upsert({
      user_id: user.id, week_start: weekStart, week_end: weekEnd,
      summary: parsed.summary ?? "", wins: parsed.wins ?? "",
      struggles: parsed.struggles ?? "", adaptations: parsed.adaptations ?? "",
    }, { onConflict: "user_id,week_start" }).select().single();
    if (upErr) throw upErr;

    // Compaction: the review now carries the gist, so prune observations from before this week.
    // Profile facts (kind='profile') are kept forever; only observations are pruned.
    await supabase.from("coach_memory").delete().eq("kind", "observation").lt("created_at", weekStart);

    return json({ ok: true, review });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

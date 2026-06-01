import { supabase } from "../lib/supabase";
import { hueFromId } from "../lib/format";
import type { Habit, Goal } from "../types";

// Raw habit row → UI view model (derived colors + joined identity label + anchor).
export function shapeHabit(
  h: { id: string; status: string; name: string; tiny_version: string; activation_order: number | null },
  identityLabel: string | undefined,
  anchor: string | undefined,
): Habit {
  const { hue, c1, c2 } = hueFromId(h.id);
  return {
    id: h.id, status: h.status, name: h.name, tiny: h.tiny_version,
    activation_order: h.activation_order, identity: identityLabel ?? "", anchor: anchor ?? "",
    hue, c1, c2,
  };
}

// One mount-time read: active/queued habits shaped, active goals, today's done/skipped sets,
// and a 97-day done-history map for the Progress garden/heatmap.
export async function fetchTodayState(todayISO: string) {
  const since = new Date(Date.now() - 97 * 86400000).toISOString().slice(0, 10);
  const [habitsRes, intentionsRes, identitiesRes, goalsRes, logsRes, historyRes] = await Promise.all([
    supabase.from("habits").select("id, name, tiny_version, status, goal_id, activation_order")
      .in("status", ["active", "queued"]).order("activation_order"),
    supabase.from("implementation_intentions").select("habit_id, anchor"),
    supabase.from("identities").select("id, label"),
    supabase.from("goals").select("id, identity_id, title, status"),
    supabase.from("habit_logs").select("habit_id, status").eq("log_date", todayISO),
    supabase.from("habit_logs").select("habit_id, log_date").gte("log_date", since).eq("status", "done"),
  ]);

  const habitsData = habitsRes.data ?? [];
  const goalsData = goalsRes.data ?? [];
  const identitiesData = identitiesRes.data ?? [];
  const intentionsData = intentionsRes.data ?? [];
  const logsData = logsRes.data ?? [];
  const historyData = historyRes.data ?? [];

  const goalMap = Object.fromEntries(goalsData.map((g) => [g.id, g] as const));
  const identityMap = Object.fromEntries(identitiesData.map((i) => [i.id, i] as const));
  const intentionMap = Object.fromEntries(intentionsData.map((i) => [i.habit_id, i] as const));

  const habits: Habit[] = habitsData.map((h) => {
    const goal = h.goal_id ? goalMap[h.goal_id] : undefined;
    const identity = goal?.identity_id ? identityMap[goal.identity_id] : undefined;
    return shapeHabit(h, identity?.label, intentionMap[h.id]?.anchor);
  });
  const goals: Goal[] = goalsData.filter((g) => g.status === "active");

  const done = new Set(logsData.filter((l) => l.status === "done").map((l) => l.habit_id));
  const skipped = new Set(logsData.filter((l) => l.status === "skipped").map((l) => l.habit_id));

  const historyByHabit = new Map<string, Set<string>>();
  for (const { habit_id, log_date } of historyData) {
    if (!historyByHabit.has(habit_id)) historyByHabit.set(habit_id, new Set());
    historyByHabit.get(habit_id)!.add(log_date);
  }

  return { habits, goals, done, skipped, historyByHabit };
}

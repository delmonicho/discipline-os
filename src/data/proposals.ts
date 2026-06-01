import { supabase } from "../lib/supabase";
import { hueFromId } from "../lib/format";
import type { Habit, Proposal, AcceptPayload } from "../types";

export async function fetchPending(): Promise<Proposal[]> {
  const { data } = await supabase.from("plan_proposals")
    .select("id, change_type, details, rationale, status, created_at")
    .eq("status", "pending").order("created_at");
  return (data ?? []) as Proposal[];
}

export async function rejectProposal(proposal: Proposal) {
  await supabase.from("plan_proposals")
    .update({ status: "rejected", resolved_at: new Date().toISOString() }).eq("id", proposal.id);
}

// Coach proposes, user decides (invariant 2). Applies the change by type, then marks the
// proposal accepted. Returns a transform to run on local habits state — only after every DB
// write succeeds. Throws on any error so the caller can leave the proposal untouched.
export async function applyProposal(
  userId: string, proposal: Proposal, payload: AcceptPayload, habits: Habit[],
): Promise<(hs: Habit[]) => Habit[]> {
  const ct = proposal.change_type;
  let applied: (hs: Habit[]) => Habit[];

  if (ct === "activate_habit") {
    const chosen = habits.find((h) => h.id === payload.habitId);
    await supabase.from("habits")
      .update({ status: "active", activated_at: new Date().toISOString() })
      .eq("id", payload.habitId!).throwOnError();
    await supabase.from("implementation_intentions")
      .insert({ user_id: userId, habit_id: payload.habitId!, anchor: payload.anchor ?? "", behavior: chosen?.tiny ?? "", context: null })
      .throwOnError();
    applied = (hs) => hs.map((h) => h.id === payload.habitId ? { ...h, status: "active", anchor: payload.anchor ?? "" } : h);
  } else if (ct === "pause_habit") {
    await supabase.from("habits").update({ status: "paused" }).eq("id", payload.habitId!).throwOnError();
    applied = (hs) => hs.filter((h) => h.id !== payload.habitId); // state holds only active|queued
  } else if (ct === "shrink_habit" || ct === "grow_habit") {
    await supabase.from("habits").update({ tiny_version: payload.tiny ?? "" }).eq("id", payload.habitId!).throwOnError();
    applied = (hs) => hs.map((h) => h.id === payload.habitId ? { ...h, tiny: payload.tiny ?? "" } : h);
  } else if (ct === "new_habit") {
    const order = habits.reduce((m, h) => Math.max(m, h.activation_order ?? 0), 0) + 1;
    const { data, error } = await supabase.from("habits")
      .insert({ user_id: userId, goal_id: payload.goalId, name: payload.name ?? "", tiny_version: payload.tiny ?? "", status: "queued", activation_order: order })
      .select("id, name, tiny_version, status, goal_id, activation_order").single();
    if (error) throw error;
    const { hue, c1, c2 } = hueFromId(data.id);
    const shaped: Habit = { id: data.id, status: data.status, name: data.name, tiny: data.tiny_version,
      activation_order: data.activation_order, identity: "", anchor: "", hue, c1, c2 };
    applied = (hs) => [...hs, shaped];
  } else {
    throw new Error(`unsupported change_type: ${ct}`);
  }

  await supabase.from("plan_proposals")
    .update({ status: "accepted", resolved_at: new Date().toISOString() }).eq("id", proposal.id).throwOnError();
  return applied;
}

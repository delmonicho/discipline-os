import { supabase } from "../lib/supabase";

// Source-aware (invariant 5). done and skipped share the day's single row (unique
// habit_id,log_date), so upserting either status overwrites the other. The optimistic
// state + revert-on-error live in the hook; these are the bare DB ops.
export const logDone = (userId: string, habitId: string, date: string) =>
  supabase.from("habit_logs").upsert(
    { user_id: userId, habit_id: habitId, log_date: date, status: "done", source: "manual" },
    { onConflict: "habit_id,log_date" },
  );

export const logSkipped = (userId: string, habitId: string, date: string) =>
  supabase.from("habit_logs").upsert(
    { user_id: userId, habit_id: habitId, log_date: date, status: "skipped", source: "manual" },
    { onConflict: "habit_id,log_date" },
  );

export const removeLog = (habitId: string, date: string) =>
  supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("log_date", date);

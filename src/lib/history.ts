import type { Habit, HabitHistory } from "../types";

// Build the 13-week grid + rhythm stats for one habit from its done-dates set.
// Growth is permanent (total completions); misses are quiet, never alarming (invariant 3).
export function computeHistory(
  habit: Habit,
  historyByHabit: Map<string, Set<string>>,
  doneSet: Set<string>,
): HabitHistory {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const habitDates = historyByHabit.get(habit.id) ?? new Set<string>();

  const map: Record<number, string> = {};
  for (let a = 0; a <= 97; a++) {
    const d = new Date(today); d.setDate(today.getDate() - a);
    const dateStr = d.toISOString().slice(0, 10);
    map[a] = a === 0
      ? (doneSet.has(habit.id) ? "done" : "today")
      : (habitDates.has(dateStr) ? "done" : "miss");
  }

  let total = 0, month = 0;
  for (let a = 0; a <= 97; a++) {
    if (map[a] === "done") {
      total++;
      const d = new Date(today); d.setDate(today.getDate() - a);
      if (d >= monthStart) month++;
    }
  }
  let cur = 0; for (let a = map[0] === "today" ? 1 : 0; a <= 97; a++) { if (map[a] === "done") cur++; else break; }
  let best = 0, c = 0; for (let a = 97; a >= 0; a--) { if (map[a] === "done") { c++; if (c > best) best = c; } else c = 0; }

  const cols = 13, rows = 7, grid: string[][] = [];
  for (let col = 0; col < cols; col++) {
    const column: string[] = [];
    for (let row = 0; row < rows; row++) {
      const a = (cols - 1 - col) * 7 + (6 - row) - (6 - dow);
      column.push(a < 0 ? "future" : (map[a] ?? "miss"));
    }
    grid.push(column);
  }
  return { grid, total, month, cur, best };
}

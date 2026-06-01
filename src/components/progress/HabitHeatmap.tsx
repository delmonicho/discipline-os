import { S } from "../../lib/styles";
import type { Habit } from "../../types";

type Props = { habit: Habit; grid: string[][]; total: number; month: number; cur: number; best: number };

export function HabitHeatmap({ habit, grid, total, month, cur, best }: Props) {
  return (
    <div style={S.hmCard}>
      <div style={S.hmHead}>
        <span style={{ ...S.hmDot, background: `linear-gradient(135deg, ${habit.c1}, ${habit.c2})`, boxShadow: `0 0 10px ${habit.c1}99` }} />
        <span style={S.hmName}>{habit.name}</span>
      </div>

      <div style={S.hmGrid}>
        {grid.map((col, ci) => (
          <div key={ci} style={S.hmCol}>
            {col.map((state, ri) => <Cell key={ri} state={state} habit={habit} />)}
          </div>
        ))}
      </div>
      <div style={S.hmCaption}>last 13 weeks</div>

      <div style={S.hmStats}>
        <Stat n={total} label="times" />
        <Stat n={month} label="this month" />
        <Stat n={cur} label="current rhythm" hue={habit.c1} />
        <Stat n={best} label="best rhythm" />
      </div>
    </div>
  );
}

function Cell({ state, habit }: { state: string; habit: Habit }) {
  const base = { width: 13, height: 13, borderRadius: 4, transition: "all .3s" };
  if (state === "future") return <span style={{ ...base, background: "transparent" }} />;
  if (state === "done")
    return <span style={{ ...base, background: `linear-gradient(135deg, ${habit.c1}, ${habit.c2})`, boxShadow: `0 0 7px ${habit.c1}66` }} />;
  if (state === "today")
    return <span style={{ ...base, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${habit.c1}`, boxShadow: `0 0 8px ${habit.c1}55` }} />;
  return <span style={{ ...base, background: "rgba(255,255,255,0.045)" }} />; // miss — quiet, never alarming
}

export function Stat({ n, label, hue }: { n: number; label: string; hue?: string }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statN, color: hue || "#ece7f7" }}>{n}</div>
      <div style={S.statL}>{label}</div>
    </div>
  );
}

import { useState } from "react";
import { S, toggleBtn } from "../../lib/styles";
import { computeHistory } from "../../lib/history";
import { Garden } from "./Garden";
import { HabitHeatmap } from "./HabitHeatmap";
import type { Habit } from "../../types";

type Props = {
  active: Habit[]; done: Set<string>;
  historyByHabit: Map<string, Set<string>>; onReflect: () => Promise<unknown>;
};

export function Progress({ active, done, historyByHabit, onReflect }: Props) {
  const [view, setView] = useState("garden");
  const [reviewState, setReviewState] = useState("idle"); // idle | loading | done | error
  const histories = active.map((h) => ({ habit: h, ...computeHistory(h, historyByHabit, done) }));
  const totalVotes = histories.reduce((s, x) => s + x.total, 0);

  const reflect = async () => {
    setReviewState("loading");
    try { await onReflect(); setReviewState("done"); }
    catch { setReviewState("error"); }
  };
  const reflectLabel = reviewState === "loading" ? "Reflecting…"
    : reviewState === "done" ? "Review saved ✓"
    : reviewState === "error" ? "Didn't save — try again"
    : "Reflect on this week";

  return (
    <div>
      <header className="rise" style={{ ...S.head, animationDelay: "40ms" }}>
        <div style={S.greet}>Progress</div>
        <div style={S.sub}>The quiet proof you're showing up</div>
        <button onClick={reflect} disabled={reviewState === "loading"} style={S.reflectBtn}>{reflectLabel}</button>
      </header>

      <div className="rise" style={{ ...S.bigStat, animationDelay: "110ms" }}>
        <div style={S.bigNum}>{totalVotes}</div>
        <div style={S.bigLabel}>small votes cast since you started</div>
      </div>

      {active.length === 0 ? (
        <div className="rise" style={{ ...S.empty, animationDelay: "120ms" }}>
          Nothing active yet — your first seed will go in here.
        </div>
      ) : (
        <>
          <div className="rise" style={{ ...S.toggle, animationDelay: "140ms" }}>
            {[["garden", "Garden"], ["grid", "Grid"]].map(([k, label]) => (
              <button key={k} onClick={() => setView(k)} style={toggleBtn(view === k)}>{label}</button>
            ))}
          </div>

          {view === "garden"
            ? <Garden histories={histories} done={done} onSeeGrid={() => setView("grid")} />
            : histories.map((x, i) => (
                <div className="rise" key={x.habit.id} style={{ animationDelay: `${60 + i * 100}ms` }}>
                  <HabitHeatmap {...x} />
                </div>
              ))}
        </>
      )}
    </div>
  );
}

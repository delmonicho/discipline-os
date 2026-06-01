import { useState, useEffect } from "react";
import { useToday } from "./hooks/useToday";
import { S, navBtn, CSS } from "./lib/styles";
import { Ambient } from "./components/Ambient";
import { Today } from "./components/today/Today";
import { Coach } from "./components/coach/Coach";
import { Plan } from "./components/plan/Plan";
import { Progress } from "./components/progress/Progress";

// Composition root: routes the four tabs and wires the useToday data into each view.
export default function DisciplineOS() {
  const {
    session, habits, active, queued, goals, done, skipped, loading, proposals, historyByHabit, warmth,
    completeHabit, undoHabit, skipHabit, unskipHabit, loadProposals, acceptProposal, rejectProposal, reflectWeek,
  } = useToday();
  const [tab, setTab] = useState("today");

  const name = session?.user?.user_metadata?.full_name?.split(" ")[0]
    ?? session?.user?.email?.split("@")[0]
    ?? "there";

  // Refetch proposals each time the Plan tab opens
  useEffect(() => { if (tab === "plan") loadProposals(); }, [tab, loadProposals]);

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <Ambient warmth={warmth} />

      <div style={S.phone}>
        <div style={S.scroll} key={tab}>
          {tab === "today" && (
            <Today
              active={active} queued={queued} done={done} skipped={skipped}
              name={name} onComplete={completeHabit} onUndo={undoHabit}
              onSkip={skipHabit} onUnskip={unskipHabit} loading={loading}
            />
          )}
          {tab === "coach" && <Coach />}
          {tab === "plan" && <Plan proposals={proposals} habits={habits} goals={goals} done={done} onAccept={acceptProposal} onReject={rejectProposal} />}
          {tab === "progress" && <Progress active={active} done={done} historyByHabit={historyByHabit} onReflect={reflectWeek} />}
        </div>

        <nav style={S.nav}>
          {[["today", "Today"], ["coach", "Coach"], ["plan", "Plan"], ["progress", "Progress"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={navBtn(tab === k)}>
              {label}
              {k === "plan" && proposals.length > 0 && <span style={S.dot} />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

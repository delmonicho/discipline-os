import { useState } from "react";
import { S } from "../../lib/styles";
import type { Habit, Goal, Proposal, AcceptPayload } from "../../types";

const ACTIONABLE = ["activate_habit", "pause_habit", "shrink_habit", "grow_habit", "new_habit"];

type Props = {
  proposals: Proposal[]; habits: Habit[]; goals: Goal[]; done: Set<string>;
  onAccept: (p: Proposal, payload: AcceptPayload) => void; onReject: (p: Proposal) => void;
};

// Coach proposes, you decide (invariant 2). The accept sheet adapts its fields to the
// proposal's change_type; only ACTIONABLE types get an Accept button.
export function Plan({ proposals, habits, goals, done, onAccept, onReject }: Props) {
  const active = habits.filter((h) => h.status === "active");
  const queued = habits.filter((h) => h.status === "queued");
  const [accepting, setAccepting] = useState<Proposal | null>(null); // proposal being confirmed
  const [chosenId, setChosenId] = useState("");     // selected habit (activate/pause/shrink/grow)
  const [anchor, setAnchor] = useState("");         // activate_habit
  const [tiny, setTiny] = useState("");             // shrink/grow + new_habit
  const [name, setName] = useState("");             // new_habit
  const [goalId, setGoalId] = useState("");         // new_habit

  // Seed the sheet's fields with sensible defaults for the proposal's type.
  const startAccept = (p: Proposal) => {
    const ct = p.change_type;
    if (ct === "activate_habit") { setChosenId(queued[0]?.id ?? ""); setAnchor(""); }
    else if (ct === "pause_habit") { setChosenId(active[0]?.id ?? ""); }
    else if (ct === "shrink_habit" || ct === "grow_habit") { setChosenId(active[0]?.id ?? ""); setTiny(active[0]?.tiny ?? ""); }
    else if (ct === "new_habit") { setName(""); setTiny(""); setGoalId(goals[0]?.id ?? ""); }
    setAccepting(p);
  };
  const confirmAccept = () => {
    if (!accepting) return;
    const ct = accepting.change_type;
    let payload: AcceptPayload;
    if (ct === "activate_habit") { if (!chosenId) return; payload = { habitId: chosenId, anchor }; }
    else if (ct === "pause_habit") { if (!chosenId) return; payload = { habitId: chosenId }; }
    else if (ct === "shrink_habit" || ct === "grow_habit") { if (!chosenId || !tiny.trim()) return; payload = { habitId: chosenId, tiny: tiny.trim() }; }
    else if (ct === "new_habit") { if (!name.trim() || !goalId) return; payload = { name: name.trim(), tiny: tiny.trim(), goalId }; }
    else return;
    onAccept(accepting, payload);
    setAccepting(null);
  };

  return (
    <div>
      <header className="rise" style={{ ...S.head, animationDelay: "40ms" }}>
        <div style={S.greet}>Plan</div>
        <div style={S.sub}>{active.length} of 3 habits active · the rest stay resting</div>
      </header>

      {proposals.length === 0 ? (
        <div className="rise" style={{ ...S.empty, animationDelay: "120ms" }}>No proposals right now. Your coach will suggest a change when the moment's right.</div>
      ) : proposals.map((p, i) => (
        <div className="rise" key={p.id} style={{ ...S.proposal, animationDelay: `${120 + i * 90}ms` }}>
          <div style={S.propTag}>Coach proposes</div>
          <div style={S.propTitle}>{p.details}</div>
          {p.rationale && <div style={S.propWhy}>{p.rationale}</div>}

          {accepting?.id === p.id ? (
            <div style={S.sheet}>
              {p.change_type === "activate_habit" && active.length >= 3 ? (
                <div style={S.sheetGuard}>Only three at a time — pause one first.</div>
              ) : (
                <>
                  {p.change_type === "activate_habit" && (
                    <>
                      <div style={S.sheetField}>
                        <div style={S.sheetLabel}>Which habit?</div>
                        <select value={chosenId} onChange={(e) => setChosenId(e.target.value)} style={S.sheetSelect}>
                          {queued.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                      </div>
                      <div style={S.sheetField}>
                        <div style={S.sheetLabel}>Anchor (when will you do it?)</div>
                        <input value={anchor} onChange={(e) => setAnchor(e.target.value)}
                          placeholder="After morning coffee…" style={{ ...S.input, padding: "11px 15px", fontSize: 14 }} />
                      </div>
                    </>
                  )}

                  {p.change_type === "pause_habit" && (
                    <div style={S.sheetField}>
                      <div style={S.sheetLabel}>Pause which habit?</div>
                      <select value={chosenId} onChange={(e) => setChosenId(e.target.value)} style={S.sheetSelect}>
                        {active.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                  )}

                  {(p.change_type === "shrink_habit" || p.change_type === "grow_habit") && (
                    <>
                      <div style={S.sheetField}>
                        <div style={S.sheetLabel}>Which habit?</div>
                        <select value={chosenId}
                          onChange={(e) => { const id = e.target.value; setChosenId(id); setTiny(active.find((h) => h.id === id)?.tiny ?? ""); }}
                          style={S.sheetSelect}>
                          {active.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                      </div>
                      <div style={S.sheetField}>
                        <div style={S.sheetLabel}>{p.change_type === "shrink_habit" ? "New, smaller version" : "New, bigger version"}</div>
                        <input value={tiny} onChange={(e) => setTiny(e.target.value)}
                          placeholder="one chord change…" style={{ ...S.input, padding: "11px 15px", fontSize: 14 }} />
                      </div>
                    </>
                  )}

                  {p.change_type === "new_habit" && (
                    <>
                      <div style={S.sheetField}>
                        <div style={S.sheetLabel}>Name</div>
                        <input value={name} onChange={(e) => setName(e.target.value)}
                          placeholder="Evening stretch…" style={{ ...S.input, padding: "11px 15px", fontSize: 14 }} />
                      </div>
                      <div style={S.sheetField}>
                        <div style={S.sheetLabel}>Tiny version</div>
                        <input value={tiny} onChange={(e) => setTiny(e.target.value)}
                          placeholder="put on running shoes…" style={{ ...S.input, padding: "11px 15px", fontSize: 14 }} />
                      </div>
                      <div style={S.sheetField}>
                        <div style={S.sheetLabel}>Goal</div>
                        <select value={goalId} onChange={(e) => setGoalId(e.target.value)} style={S.sheetSelect}>
                          {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  <div style={S.propBtns}>
                    <button onClick={confirmAccept} style={S.accept}>Confirm</button>
                    <button onClick={() => setAccepting(null)} style={S.decline}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={S.propBtns}>
              {ACTIONABLE.includes(p.change_type) && (
                <button onClick={() => startAccept(p)} style={S.accept}>Accept</button>
              )}
              <button onClick={() => onReject(p)} style={S.decline}>Not yet</button>
            </div>
          )}
        </div>
      ))}

      <div className="rise" style={{ ...S.section, animationDelay: "260ms" }}>
        <div style={S.secLabel}>Active</div>
        {active.map((h) => (
          <div key={h.id} style={S.planRow}>
            <span style={{ ...S.planDotC, background: h.c1 }} />
            <span style={S.planName}>{h.name}</span>
            <span style={S.planState}>{done.has(h.id) ? "done today" : "today"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

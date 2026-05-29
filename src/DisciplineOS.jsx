import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Check, ArrowUp, Sparkles, Moon } from "lucide-react";
import { supabase } from "./lib/supabase";
import { useAuth } from "./lib/useAuth";

/*
  Discipline OS — Today / Coach / Plan / Progress
  ------------------------------------------------
  Phase 1+: Today loop wired to Supabase (habits + habit_logs).
  Phases 2–4 will wire Progress, Coach, and Proposals.
  Phase 5 will split into components/data/hooks.

  Aesthetic: calm, meditative, frictionless. Press-and-hold-to-complete (hold ~1s
  → bloom + haptic). The world warms toward dawn as habits complete.
*/

const HOLD_MS = 1000;

const vibrate = (p) => { try { navigator.vibrate?.(p); } catch { /* no-op */ } };
const lerp = (a, b, t) => a + (b - a) * t;

export default function App() {
  const { session } = useAuth();
  const [tab, setTab] = useState("today");
  const [habits, setHabits] = useState([]);
  const [done, setDone] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [historyByHabit, setHistoryByHabit] = useState(new Map());

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const name = session?.user?.user_metadata?.full_name?.split(" ")[0]
    ?? session?.user?.email?.split("@")[0]
    ?? "there";

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function load() {
      const since = new Date(Date.now() - 97 * 86400000).toISOString().slice(0, 10);
      const [
        { data: habitsData },
        { data: intentionsData },
        { data: identitiesData },
        { data: goalsData },
        { data: logsData },
        { data: historyData },
      ] = await Promise.all([
        supabase.from("habits").select("id, name, tiny_version, status, goal_id, activation_order")
          .in("status", ["active", "queued"]).order("activation_order"),
        supabase.from("implementation_intentions").select("habit_id, anchor"),
        supabase.from("identities").select("id, label"),
        supabase.from("goals").select("id, identity_id"),
        supabase.from("habit_logs").select("habit_id")
          .eq("log_date", todayISO).eq("status", "done"),
        supabase.from("habit_logs").select("habit_id, log_date")
          .gte("log_date", since).eq("status", "done"),
      ]);

      if (cancelled) return;

      const goalMap = Object.fromEntries((goalsData ?? []).map((g) => [g.id, g]));
      const identityMap = Object.fromEntries((identitiesData ?? []).map((i) => [i.id, i]));
      const intentionMap = Object.fromEntries((intentionsData ?? []).map((i) => [i.habit_id, i]));

      const shaped = (habitsData ?? []).map((h) => {
        const goal = goalMap[h.goal_id];
        const identity = goal ? identityMap[goal.identity_id] : null;
        const intention = intentionMap[h.id];
        const hue = parseInt(h.id.replace(/-/g, "").slice(0, 8), 16) % 360;
        return {
          id: h.id,
          status: h.status,
          name: h.name,
          tiny: h.tiny_version,
          identity: identity?.label ?? "",
          anchor: intention?.anchor ?? "",
          hue,
          c1: `hsl(${hue} 60% 65%)`,
          c2: `hsl(${hue} 55% 45%)`,
        };
      });

      const histMap = new Map();
      for (const { habit_id, log_date } of (historyData ?? [])) {
        if (!histMap.has(habit_id)) histMap.set(habit_id, new Set());
        histMap.get(habit_id).add(log_date);
      }

      setHabits(shaped);
      setDone(new Set((logsData ?? []).map((l) => l.habit_id)));
      setHistoryByHabit(histMap);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [session, todayISO]);

  const completeHabit = useCallback(async (habitId) => {
    setDone((prev) => { const n = new Set(prev); n.add(habitId); return n; });
    const { error } = await supabase.from("habit_logs").upsert(
      { user_id: session.user.id, habit_id: habitId, log_date: todayISO, status: "done", source: "manual" },
      { onConflict: "habit_id,log_date" }
    );
    if (error) setDone((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
  }, [session, todayISO]);

  const undoHabit = useCallback(async (habitId) => {
    setDone((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
    const { error } = await supabase.from("habit_logs").delete()
      .eq("habit_id", habitId).eq("log_date", todayISO);
    if (error) setDone((prev) => { const n = new Set(prev); n.add(habitId); return n; });
  }, [session, todayISO]);

  const loadProposals = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from("plan_proposals")
      .select("*").eq("status", "pending").order("created_at");
    setProposals(data ?? []);
  }, [session]);

  // Refetch proposals each time the Plan tab opens
  useEffect(() => {
    if (tab === "plan") loadProposals();
  }, [tab, loadProposals]);

  const acceptProposal = useCallback(async (proposal, chosenHabitId, anchor) => {
    if (proposal.change_type === "activate_habit") {
      const chosenHabit = habits.find((h) => h.id === chosenHabitId);
      await supabase.from("habits")
        .update({ status: "active", activated_at: new Date().toISOString() }).eq("id", chosenHabitId);
      await supabase.from("implementation_intentions").insert({
        user_id: session.user.id, habit_id: chosenHabitId,
        anchor, behavior: chosenHabit?.tiny ?? "", context: null,
      });
      await supabase.from("plan_proposals")
        .update({ status: "accepted", resolved_at: new Date().toISOString() }).eq("id", proposal.id);
      setHabits((hs) => hs.map((h) => h.id === chosenHabitId ? { ...h, status: "active" } : h));
    }
    setProposals((ps) => ps.filter((x) => x.id !== proposal.id));
    vibrate([10, 24, 12]);
  }, [session, habits]);

  const rejectProposal = useCallback(async (proposal) => {
    await supabase.from("plan_proposals")
      .update({ status: "rejected", resolved_at: new Date().toISOString() }).eq("id", proposal.id);
    setProposals((ps) => ps.filter((x) => x.id !== proposal.id));
    vibrate(8);
  }, []);

  const active = habits.filter((h) => h.status === "active");
  const queued = habits.filter((h) => h.status === "queued");
  const warmth = active.length
    ? [...done].filter((id) => active.some((h) => h.id === id)).length / active.length
    : 0;

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <Ambient warmth={warmth} />

      <div style={S.phone}>
        <div style={S.scroll} key={tab}>
          {tab === "today" && (
            <Today
              active={active} queued={queued} done={done}
              name={name} onComplete={completeHabit} onUndo={undoHabit}
              warmth={warmth} loading={loading}
            />
          )}
          {tab === "coach" && <Coach />}
          {tab === "plan" && <Plan proposals={proposals} habits={habits} done={done} onAccept={acceptProposal} onReject={rejectProposal} />}
          {tab === "progress" && <Progress active={active} done={done} historyByHabit={historyByHabit} />}
        </div>

        <nav style={S.nav}>
          {[["today", "Today"], ["coach", "Coach"], ["plan", "Plan"], ["progress", "Progress"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={S.navBtn(tab === k)}>
              {label}
              {k === "plan" && proposals.length > 0 && <span style={S.dot} />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ---------- Ambient drifting mesh that warms with progress ---------- */
function Ambient({ warmth }) {
  // cool twilight -> warm dawn as warmth 0->1
  const blob = (cool, warm) => `radial-gradient(circle, ${mix(cool, warm, warmth)} 0%, transparent 70%)`;
  return (
    <div style={S.ambient}>
      <div className="blob b1" style={{ background: blob("#3a2d72", "#7a5aa8") }} />
      <div className="blob b2" style={{ background: blob("#19505e", "#c98a6b") }} />
      <div className="blob b3" style={{ background: blob("#2a2350", "#e0a06e") }} />
      <div style={{ ...S.warmWash, opacity: warmth * 0.5 }} />
      <div style={S.grain} />
    </div>
  );
}

/* ---------- TODAY ---------- */
function Today({ active, queued, done, name, onComplete, onUndo, warmth, loading }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const allDone = active.length && active.every((h) => done.has(h.id));

  return (
    <div>
      <header className="rise" style={{ ...S.head, animationDelay: "40ms" }}>
        <div style={S.greet}>{greet}, {name}</div>
        <div style={S.sub}>
          {loading ? "Loading your habits…"
            : allDone ? "All votes cast. The day is yours."
            : `${[...done].filter((id) => active.some((h) => h.id === id)).length} of ${active.length} small votes cast today`}
        </div>
      </header>

      {active.map((h, i) => (
        <div className="rise" key={h.id} style={{ animationDelay: `${120 + i * 90}ms` }}>
          <HabitOrb habit={h} done={done.has(h.id)} onComplete={onComplete} onUndo={onUndo} />
        </div>
      ))}

      {queued.length > 0 && (
        <div className="rise" style={{ ...S.restWrap, animationDelay: `${120 + active.length * 90 + 80}ms` }}>
          <div style={S.restLabel}><Moon size={12} strokeWidth={2.2} /> Resting · arrive when these stick</div>
          <div style={S.restRow}>
            {queued.map((h) => (
              <div key={h.id} style={S.restOrb} title={`${h.name} — staggered`}>
                <div style={{ ...S.restOrbInner, background: `radial-gradient(circle at 35% 30%, ${h.c1}55, ${h.c2}22)` }} />
                <span style={S.restName}>{h.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HabitOrb({ habit, done, onComplete, onUndo }) {
  const [p, setP] = useState(0);          // hold progress 0..1
  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState(false);
  const [bloom, setBloom] = useState(0);
  const raf = useRef(0); const start = useRef(0); const thr = useRef(0); const active = useRef(false);

  const R = 86, STROKE = 6, C = 2 * Math.PI * R;

  const finish = useCallback(() => {
    active.current = false; cancelAnimationFrame(raf.current);
    setHolding(false); setP(0);
    onComplete(habit.id);
    setBloom((b) => b + 1); vibrate([12, 30, 16]);
  }, [habit.id, onComplete]);

  const tick = useCallback(() => {
    if (!active.current) return;
    const prog = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setP(prog);
    if (prog >= thr.current * 0.34 + 0.0 && thr.current < 3 && prog > thr.current / 3) { thr.current += 1; vibrate(7); }
    if (prog >= 1) return finish();
    raf.current = requestAnimationFrame(tick);
  }, [finish]);

  const startHold = () => {
    if (done) return;
    active.current = true; start.current = performance.now(); thr.current = 0;
    setHolding(true); tick();
  };
  const endHold = () => {
    if (!active.current) return;
    active.current = false; cancelAnimationFrame(raf.current);
    setHolding(false); setP(0);
    if (!done) { setHint(true); setTimeout(() => setHint(false), 950); }
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const undo = () => { onUndo(habit.id); vibrate(8); };

  const ringColor = done ? habit.c1 : holding ? habit.c1 : `${habit.c1}`;
  const glow = done ? 0.9 : holding ? lerp(0.15, 0.85, p) : 0.18;
  const scale = done ? 1.0 : holding ? lerp(1, 1.06, p) : 1;

  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <div style={S.identity}>{habit.identity}</div>
        <div style={S.hName}>{habit.name}</div>
        <div style={S.hTiny}>{habit.tiny}</div>
      </div>

      <div style={S.orbWrap}>
        <div
          className={done ? "" : "breathe"}
          onPointerDown={startHold} onPointerUp={endHold}
          onPointerLeave={endHold} onPointerCancel={endHold}
          onClick={done ? undo : undefined}
          style={{ ...S.orbHit, transform: `scale(${scale})`, transition: holding ? "none" : "transform .6s cubic-bezier(.2,.8,.2,1)", cursor: "pointer" }}
        >
          {/* bloom bursts */}
          {bloom > 0 && [0, 1, 2].map((k) => (
            <span key={bloom + "-" + k} className="bloom" style={{ borderColor: habit.c1, animationDelay: `${k * 90}ms` }} />
          ))}

          <svg width={(R + STROKE) * 2} height={(R + STROKE) * 2} style={{ position: "relative", zIndex: 2 }}>
            <circle cx={R + STROKE} cy={R + STROKE} r={R} fill="none" stroke="#ffffff14" strokeWidth={STROKE} />
            <circle
              cx={R + STROKE} cy={R + STROKE} r={R} fill="none"
              stroke={ringColor} strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={done ? 0 : C * (1 - p)}
              transform={`rotate(-90 ${R + STROKE} ${R + STROKE})`}
              style={{ transition: holding ? "none" : "stroke-dashoffset .55s cubic-bezier(.2,.8,.2,1)",
                       filter: `drop-shadow(0 0 ${glow * 18}px ${habit.c1})` }}
            />
            <defs>
              <radialGradient id={`g-${habit.id}`} cx="38%" cy="32%">
                <stop offset="0%" stopColor={habit.c1} stopOpacity={done ? 0.95 : 0.5} />
                <stop offset="100%" stopColor={habit.c2} stopOpacity={done ? 0.8 : 0.18} />
              </radialGradient>
            </defs>
            <circle cx={R + STROKE} cy={R + STROKE} r={R - 12} fill={`url(#g-${habit.id})`}
              style={{ transition: "all .5s ease", filter: done ? `drop-shadow(0 0 26px ${habit.c1}88)` : "none" }} />
          </svg>

          <div style={S.orbCenter}>
            {done ? <Check size={40} strokeWidth={2.4} color="#fff" />
              : <span style={{ ...S.holdLabel, opacity: holding ? 0 : 1 }}>hold</span>}
          </div>
        </div>
      </div>

      <div style={S.cardFoot}>
        {done ? <span style={S.doneFoot}>Done · tap to undo</span>
          : <span style={{ ...S.intent, opacity: hint ? 1 : 0.62, color: hint ? habit.c1 : "#a79fc4" }}>
              {hint ? "keep holding — make it intentional" : `${habit.anchor} → ${habit.name.toLowerCase()}`}
            </span>}
      </div>
    </div>
  );
}

/* ---------- COACH (real NDJSON stream from /functions/v1/coach-stream) ---------- */
// Message model:
//   user:      { role:"user", text:string }
//   assistant: { role:"assistant", segments:[{kind:"text"|"status", text:string}] }
function Coach() {
  const { session } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Load thread on mount
  useEffect(() => {
    if (!session) return;
    supabase.from("coach_messages")
      .select("role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setMsgs(data.map((m) =>
          m.role === "user"
            ? { role: "user", text: m.content }
            : { role: "assistant", segments: [{ kind: "text", text: m.content }] }
        ));
      });
  }, [session]);

  const streamCoach = async (userText) => {
    setStreaming(true);
    setMsgs((m) => [...m, { role: "assistant", segments: [] }]);

    const appendSeg = (seg) => setMsgs((m) => {
      const n = [...m];
      const last = { ...n[n.length - 1], segments: [...n[n.length - 1].segments] };
      if (seg.kind === "text" && last.segments.length > 0 && last.segments[last.segments.length - 1].kind === "text") {
        const segs = [...last.segments];
        segs[segs.length - 1] = { kind: "text", text: segs[segs.length - 1].text + seg.text };
        last.segments = segs;
      } else {
        last.segments = [...last.segments, seg];
      }
      n[n.length - 1] = last;
      return n;
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-stream`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        }
      );
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let evt; try { evt = JSON.parse(line); } catch { continue; }
          if (evt.type === "text") appendSeg({ kind: "text", text: evt.value });
          else if (evt.type === "status") appendSeg({ kind: "status", text: evt.value });
          else if (evt.type === "done") break outer;
          else if (evt.type === "error") { appendSeg({ kind: "status", text: `⚠️ ${evt.value}` }); break outer; }
        }
      }
    } catch (e) {
      appendSeg({ kind: "status", text: `⚠️ ${String(e)}` });
    } finally {
      setStreaming(false);
    }
  };

  const send = () => {
    const t = input.trim(); if (!t || streaming) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    streamCoach(t);
  };

  return (
    <div style={S.coachWrap}>
      <header className="rise" style={{ ...S.head, animationDelay: "40ms" }}>
        <div style={S.greet}>Coach</div>
        <div style={S.sub}>Here for the long arc — not just today.</div>
      </header>

      <div style={S.thread}>
        {msgs.length === 0 && !streaming && (
          <div className="rise" style={{ ...S.bubbleCoach, color: "#8a82ad", animationDelay: "120ms" }}>
            What's on your mind? I have the full picture — habits, history, what you've shared before.
          </div>
        )}
        {msgs.map((m, i) => (
          m.role === "user" ? (
            <div key={i} style={S.bubbleUser}>{m.text}</div>
          ) : (
            <div key={i} style={S.bubbleCoach}>
              {m.segments.map((seg, si) =>
                seg.kind === "text"
                  ? <span key={si}>{seg.text}</span>
                  : <div key={si} style={S.statusPill}><Sparkles size={11} strokeWidth={2.4} /> {seg.text}</div>
              )}
            </div>
          )
        ))}
        <div ref={endRef} />
      </div>

      <div style={S.inputRow}>
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tell your coach how it's going…" style={S.input}
        />
        <button onClick={send} style={S.sendBtn(!!input.trim() && !streaming)}><ArrowUp size={18} strokeWidth={2.6} /></button>
      </div>
    </div>
  );
}

/* ---------- PLAN (proposals — coach proposes, you decide) ---------- */
function Plan({ proposals, habits, done, onAccept, onReject }) {
  const active = habits.filter((h) => h.status === "active");
  const queued = habits.filter((h) => h.status === "queued");
  const [accepting, setAccepting] = useState(null); // proposal currently being confirmed
  const [chosenId, setChosenId] = useState("");
  const [anchor, setAnchor] = useState("");

  const startAccept = (p) => {
    setChosenId(queued[0]?.id ?? "");
    setAnchor("");
    setAccepting(p);
  };
  const confirmAccept = () => {
    if (!chosenId || !accepting) return;
    onAccept(accepting, chosenId, anchor);
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

          {/* Accept sheet for activate_habit */}
          {accepting?.id === p.id && (
            <div style={S.sheet}>
              {active.length >= 3 ? (
                <div style={S.sheetGuard}>Only three at a time — pause one first.</div>
              ) : (
                <>
                  <div style={S.sheetField}>
                    <div style={S.sheetLabel}>Which habit?</div>
                    <select value={chosenId} onChange={(e) => setChosenId(e.target.value)} style={S.sheetSelect}>
                      {queued.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div style={S.sheetField}>
                    <div style={S.sheetLabel}>Anchor (when will you do it?)</div>
                    <input
                      value={anchor} onChange={(e) => setAnchor(e.target.value)}
                      placeholder="After morning coffee…" style={{ ...S.input, padding: "11px 15px", fontSize: 14 }}
                    />
                  </div>
                  <div style={S.propBtns}>
                    <button onClick={confirmAccept} style={S.accept}>Confirm</button>
                    <button onClick={() => setAccepting(null)} style={S.decline}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}

          {accepting?.id !== p.id && (
            <div style={S.propBtns}>
              {p.change_type === "activate_habit" ? (
                <button onClick={() => startAccept(p)} style={S.accept}>Accept</button>
              ) : (
                <button style={{ ...S.accept, opacity: 0.4, cursor: "default" }} disabled>Coming soon</button>
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

/* ---------- PROGRESS (garden by default, heatmap a tap away) ---------- */
function Progress({ active, done, historyByHabit }) {
  const [view, setView] = useState("garden");
  const histories = active.map((h) => ({ habit: h, ...computeHistory(h, historyByHabit, done) }));
  const totalVotes = histories.reduce((s, x) => s + x.total, 0);

  return (
    <div>
      <header className="rise" style={{ ...S.head, animationDelay: "40ms" }}>
        <div style={S.greet}>Progress</div>
        <div style={S.sub}>The quiet proof you're showing up</div>
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
              <button key={k} onClick={() => setView(k)} style={S.toggleBtn(view === k)}>{label}</button>
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

/* ---------- GARDEN (growth accumulates; misses only make it sleep) ---------- */
const STAGE_NAME = ["Seed", "Sprouting", "Growing", "Budding", "Blooming", "Flourishing"];
const STAGE_H = [14, 44, 76, 106, 132, 150];
const STAGE_LEAVES = [0, 1, 2, 3, 3, 4];
const stageFor = (t) => (t < 1 ? 0 : t < 5 ? 1 : t < 15 ? 2 : t < 30 ? 3 : t < 60 ? 4 : 5);

function Garden({ histories, done, onSeeGrid }) {
  const [sel, setSel] = useState(null);
  const selX = histories.find((h) => h.habit.id === sel);

  return (
    <div>
      <div className="rise" style={{ ...S.scene, animationDelay: "180ms" }}>
        <div style={S.plants}>
          {histories.map((x, i) => {
            const stage = stageFor(x.total);
            const vitality = done.has(x.habit.id) ? "fresh" : x.cur > 0 ? "vital" : "resting";
            return (
              <button key={x.habit.id} onClick={() => setSel(sel === x.habit.id ? null : x.habit.id)} style={S.plantBtn}>
                <Plant habit={x.habit} stage={stage} vitality={vitality} delay={i * 0.8} />
                <span style={{ ...S.plantName, color: sel === x.habit.id ? x.habit.c1 : "#a79fc4" }}>
                  {x.habit.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
        <div style={S.soil} />
      </div>

      <div style={S.gardenCaption}>Tend it daily — it only ever grows. Rest days just let it sleep.</div>

      {selX && (
        <div className="rise" style={{ ...S.selCard, animationDelay: "0ms" }}>
          <div style={S.selHead}>
            <span style={{ ...S.hmDot, background: `linear-gradient(135deg, ${selX.habit.c1}, ${selX.habit.c2})`, boxShadow: `0 0 10px ${selX.habit.c1}99` }} />
            <span style={S.hmName}>{selX.habit.name}</span>
            <span style={{ ...S.stageTag, color: selX.habit.c1, borderColor: `${selX.habit.c1}44` }}>{STAGE_NAME[stageFor(selX.total)]}</span>
          </div>
          <div style={S.hmStats}>
            <Stat n={selX.total} label="times" />
            <Stat n={selX.month} label="this month" />
            <Stat n={selX.cur} label="current rhythm" hue={selX.habit.c1} />
            <Stat n={selX.best} label="best rhythm" />
          </div>
          <button onClick={onSeeGrid} style={S.seeGrid}>See the grid for the detail →</button>
        </div>
      )}
    </div>
  );
}

function Plant({ habit, stage, vitality, delay }) {
  const h = STAGE_H[stage], baseY = 178, topY = baseY - h, c1 = habit.c1, c2 = habit.c2;
  const resting = vitality === "resting", fresh = vitality === "fresh";
  const pairs = STAGE_LEAVES[stage];
  const leaves = [];
  for (let k = 0; k < pairs; k++) leaves.push({ y: baseY - h * ((k + 1) / (pairs + 1)), rot: 28 + (resting ? 16 : 0) });
  const petalOpen = resting ? 0.78 : 1;

  return (
    <div style={{ position: "relative", width: 90, height: 190 }}>
      {stage >= 5 && !resting && [0, 1, 2].map((i) => (
        <span key={i} className="firefly"
          style={{ background: `radial-gradient(circle, ${c1}, transparent)`, left: 22 + i * 20, top: 26 + i * 16, animationDelay: `${i * 1.4}s` }} />
      ))}
      <div className="sway" style={{ filter: resting ? "none" : `drop-shadow(0 0 7px ${c1}aa)`, opacity: resting ? 0.6 : 1, transition: "all .5s", animationDelay: `${delay}s` }}>
        <svg width="90" height="190" viewBox="0 0 90 190">
          {stage >= 1 && <path d={`M45,${baseY} C 37,${baseY - h * 0.35} 53,${baseY - h * 0.7} 45,${topY}`} stroke={c2} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
          {leaves.map((lf, i) => (
            <g key={i}>
              <ellipse cx={33} cy={lf.y} rx="11" ry="5" fill={c2} opacity="0.85" transform={`rotate(${-lf.rot} 33 ${lf.y})`} />
              <ellipse cx={57} cy={lf.y} rx="11" ry="5" fill={c2} opacity="0.85" transform={`rotate(${lf.rot} 57 ${lf.y})`} />
            </g>
          ))}
          {stage === 0 && <ellipse cx="45" cy={baseY - 6} rx="7" ry="5" fill={c2} />}
          {stage === 3 && <path d={`M45,${topY + 11} C 37,${topY - 3} 53,${topY - 3} 45,${topY - 13} C 45,${topY - 3} 45,${topY + 3} 45,${topY + 11}`} fill={c1} />}
          {stage >= 4 && (() => {
            const petals = [];
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2, px = 45 + Math.cos(a) * 10 * petalOpen, py = topY + Math.sin(a) * 10 * petalOpen;
              petals.push(<ellipse key={i} cx={px} cy={py} rx="7" ry="11" fill={c1} opacity="0.92" transform={`rotate(${a * 180 / Math.PI + 90} ${px} ${py})`} />);
            }
            return <g>{petals}<circle cx="45" cy={topY} r="6.5" fill={fresh ? "#fff4d6" : "#ffe7b0"} /></g>;
          })()}
        </svg>
      </div>
    </div>
  );
}

function HabitHeatmap({ habit, grid, total, month, cur, best }) {
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

function Cell({ state, habit }) {
  const base = { width: 13, height: 13, borderRadius: 4, transition: "all .3s" };
  if (state === "future") return <span style={{ ...base, background: "transparent" }} />;
  if (state === "done")
    return <span style={{ ...base, background: `linear-gradient(135deg, ${habit.c1}, ${habit.c2})`, boxShadow: `0 0 7px ${habit.c1}66` }} />;
  if (state === "today")
    return <span style={{ ...base, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${habit.c1}`, boxShadow: `0 0 8px ${habit.c1}55` }} />;
  return <span style={{ ...base, background: "rgba(255,255,255,0.045)" }} />; // miss — quiet, never alarming
}

function Stat({ n, label, hue }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statN, color: hue || "#ece7f7" }}>{n}</div>
      <div style={S.statL}>{label}</div>
    </div>
  );
}

/* ---------- history from real habit_logs ---------- */
function computeHistory(habit, historyByHabit, doneSet) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const habitDates = historyByHabit.get(habit.id) ?? new Set();

  const map = {};
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

  const cols = 13, rows = 7, grid = [];
  for (let col = 0; col < cols; col++) {
    const column = [];
    for (let row = 0; row < rows; row++) {
      const a = (cols - 1 - col) * 7 + (6 - row) - (6 - dow);
      column.push(a < 0 ? "future" : (map[a] ?? "miss"));
    }
    grid.push(column);
  }
  return { grid, total, month, cur, best };
}

/* ---------- color mix helper ---------- */
function mix(a, b, t) {
  const pa = hx(a), pb = hx(b);
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function hx(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

/* ---------- styles ---------- */
const S = {
  root: { minHeight: "100vh", width: "100%", background: "#0d0a1c", position: "relative", overflow: "hidden",
    fontFamily: "'Hanken Grotesk', sans-serif", display: "flex", justifyContent: "center", color: "#ece7f7" },
  ambient: { position: "fixed", inset: 0, zIndex: 0 },
  warmWash: { position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 120%, #e0a06e, transparent 60%)", transition: "opacity 1.2s ease" },
  grain: { position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "overlay",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" },

  phone: { position: "relative", zIndex: 1, width: "100%", maxWidth: 430, minHeight: "100vh",
    display: "flex", flexDirection: "column" },
  scroll: { flex: 1, overflowY: "auto", padding: "64px 22px 110px" },

  head: { marginBottom: 26 },
  greet: { fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.1 },
  sub: { marginTop: 8, fontSize: 14.5, color: "#a79fc4", fontWeight: 400 },

  card: { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 30, padding: "26px 22px 22px", marginBottom: 18, backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)", boxShadow: "0 20px 50px -30px rgba(0,0,0,0.7)" },
  cardHead: { textAlign: "center", marginBottom: 8 },
  identity: { fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a82ad", fontWeight: 600 },
  hName: { fontFamily: "'Fraunces', serif", fontSize: 23, fontWeight: 500, marginTop: 6 },
  hTiny: { fontSize: 13.5, color: "#a79fc4", marginTop: 3 },

  orbWrap: { display: "flex", justifyContent: "center", padding: "14px 0 6px" },
  orbHit: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
    touchAction: "none", userSelect: "none", WebkitTapHighlightColor: "transparent" },
  orbCenter: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, pointerEvents: "none" },
  holdLabel: { fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", fontWeight: 600, transition: "opacity .3s" },

  cardFoot: { textAlign: "center", minHeight: 20, marginTop: 6 },
  intent: { fontSize: 12.5, transition: "all .3s", fontWeight: 500 },
  doneFoot: { fontSize: 12.5, color: "#8a82ad", fontWeight: 500 },

  restWrap: { marginTop: 30 },
  restLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, letterSpacing: "0.06em",
    textTransform: "uppercase", color: "#7b7399", fontWeight: 600, marginBottom: 14, justifyContent: "center" },
  restRow: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" },
  restOrb: { display: "flex", flexDirection: "column", alignItems: "center", gap: 7, opacity: 0.7 },
  restOrbInner: { width: 48, height: 48, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)" },
  restName: { fontSize: 11, color: "#8a82ad", fontWeight: 500 },

  coachWrap: { display: "flex", flexDirection: "column", height: "100%" },
  thread: { display: "flex", flexDirection: "column", gap: 14, paddingBottom: 14 },
  bubbleCoach: { alignSelf: "flex-start", maxWidth: "86%", background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "22px 22px 22px 7px", padding: "14px 17px",
    fontSize: 15, lineHeight: 1.5, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" },
  bubbleUser: { alignSelf: "flex-end", maxWidth: "84%", background: "linear-gradient(135deg, #5ad1c8, #2b8aa6)",
    color: "#06141a", borderRadius: "22px 22px 7px 22px", padding: "13px 17px", fontSize: 15, lineHeight: 1.45, fontWeight: 500 },
  statusPill: { display: "inline-flex", alignItems: "center", gap: 6, marginTop: 11, fontSize: 11.5,
    color: "#ffd98a", background: "rgba(255,217,138,0.1)", border: "1px solid rgba(255,217,138,0.2)",
    borderRadius: 20, padding: "5px 11px", fontWeight: 600 },
  inputRow: { position: "sticky", bottom: 0, display: "flex", gap: 9, paddingTop: 12,
    background: "linear-gradient(to top, #0d0a1c 60%, transparent)" },
  input: { flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24, padding: "14px 18px", color: "#ece7f7", fontSize: 14.5, outline: "none", fontFamily: "inherit" },
  sendBtn: (on) => ({ width: 48, height: 48, borderRadius: "50%", border: "none",
    background: on ? "linear-gradient(135deg, #5ad1c8, #2b8aa6)" : "rgba(255,255,255,0.08)",
    color: on ? "#06141a" : "#6c6489", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: on ? "pointer" : "default", transition: "all .25s" }),

  proposal: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,217,138,0.18)", borderRadius: 26,
    padding: 22, marginBottom: 16, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" },
  propTag: { fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ffd98a", fontWeight: 700, marginBottom: 9 },
  propTitle: { fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 500, lineHeight: 1.3 },
  propWhy: { fontSize: 14, color: "#b8b1d2", lineHeight: 1.55, marginTop: 10 },
  propBtns: { display: "flex", gap: 10, marginTop: 18 },
  accept: { flex: 1, background: "linear-gradient(135deg, #ffd98a, #e0a64e)", color: "#2a1c00", border: "none",
    borderRadius: 16, padding: "13px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  decline: { flex: 1, background: "rgba(255,255,255,0.06)", color: "#c9c2e0", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: "13px", fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  sheet: { marginTop: 16, padding: "16px 0 0", borderTop: "1px solid rgba(255,255,255,0.07)" },
  sheetField: { marginBottom: 12 },
  sheetLabel: { fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a82ad", fontWeight: 600, marginBottom: 7 },
  sheetSelect: { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14, padding: "11px 15px", color: "#ece7f7", fontSize: 14, outline: "none", fontFamily: "inherit",
    appearance: "none", WebkitAppearance: "none" },
  sheetGuard: { fontSize: 14, color: "#a79fc4", lineHeight: 1.5, padding: "4px 0 12px" },
  empty: { color: "#8a82ad", fontSize: 14.5, lineHeight: 1.55, padding: "10px 0" },

  section: { marginTop: 28 },
  secLabel: { fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7b7399", fontWeight: 600, marginBottom: 12 },

  bigStat: { textAlign: "center", padding: "14px 0 26px" },
  bigNum: { fontFamily: "'Fraunces', serif", fontSize: 64, fontWeight: 500, lineHeight: 1,
    background: "linear-gradient(135deg, #5ad1c8, #ffd98a)", WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent", backgroundClip: "text" },
  bigLabel: { fontSize: 13.5, color: "#a79fc4", marginTop: 10 },

  hmCard: { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 26,
    padding: "20px 20px 18px", marginBottom: 16, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" },
  hmHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  hmDot: { width: 13, height: 13, borderRadius: "50%" },
  hmName: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500 },
  hmGrid: { display: "flex", gap: 3, justifyContent: "space-between" },
  hmCol: { display: "flex", flexDirection: "column", gap: 3 },
  hmCaption: { fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6c6489", marginTop: 9, textAlign: "right" },
  hmStats: { display: "flex", gap: 8, marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 },
  stat: { flex: 1, textAlign: "center" },
  statN: { fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, lineHeight: 1 },
  statL: { fontSize: 10.5, color: "#8a82ad", marginTop: 5, lineHeight: 1.2 },

  toggle: { display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 4, marginBottom: 18, width: "fit-content" },
  toggleBtn: (on) => ({ border: "none", background: on ? "rgba(255,255,255,0.12)" : "transparent",
    color: on ? "#ece7f7" : "#8a82ad", padding: "7px 20px", borderRadius: 12, fontSize: 13.5,
    fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }),
  scene: { position: "relative", height: 290, borderRadius: 28, overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "linear-gradient(to bottom, rgba(255,255,255,0.015), rgba(18,12,38,0.35))", marginBottom: 14 },
  plants: { position: "absolute", left: 0, right: 0, bottom: 30, display: "flex",
    justifyContent: "space-around", alignItems: "flex-end", padding: "0 6px" },
  soil: { position: "absolute", left: 0, right: 0, bottom: 0, height: 50,
    background: "linear-gradient(to top, rgba(44,30,66,0.75), transparent)", borderTop: "1px solid rgba(255,255,255,0.05)" },
  plantBtn: { background: "none", border: "none", cursor: "pointer", display: "flex",
    flexDirection: "column", alignItems: "center", padding: 0, WebkitTapHighlightColor: "transparent" },
  plantName: { fontSize: 11, marginTop: 0, fontWeight: 500, transition: "color .3s" },
  gardenCaption: { fontSize: 12.5, color: "#8a82ad", textAlign: "center", lineHeight: 1.5, marginBottom: 18 },
  selCard: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24,
    padding: "18px 20px", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" },
  selHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  stageTag: { marginLeft: "auto", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
    border: "1px solid", borderRadius: 20, padding: "3px 11px" },
  seeGrid: { background: "none", border: "none", color: "#a79fc4", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", marginTop: 14, padding: 0 },
  planRow: { display: "flex", alignItems: "center", gap: 12, padding: "13px 4px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  planDotC: { width: 11, height: 11, borderRadius: "50%" },
  planName: { flex: 1, fontSize: 15.5, fontWeight: 500 },
  planState: { fontSize: 12.5, color: "#8a82ad" },

  nav: { position: "sticky", bottom: 0, display: "flex", gap: 3, padding: "10px 12px 22px",
    justifyContent: "center", background: "linear-gradient(to top, #0d0a1c 55%, transparent)" },
  navBtn: (on) => ({ position: "relative", border: "none", background: on ? "rgba(255,255,255,0.1)" : "transparent",
    color: on ? "#ece7f7" : "#7b7399", padding: "9px 16px", borderRadius: 20, fontSize: 14,
    fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all .25s",
    backdropFilter: on ? "blur(10px)" : "none" }),
  dot: { position: "absolute", top: 6, right: 10, width: 7, height: 7, borderRadius: "50%", background: "#ffd98a" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
body { margin: 0; }
::-webkit-scrollbar { display: none; }

.blob { position: absolute; width: 120vw; max-width: 760px; height: 760px; border-radius: 50%;
  filter: blur(60px); opacity: 0.55; will-change: transform; }
.b1 { top: -22%; left: -18%; animation: drift1 46s ease-in-out infinite; }
.b2 { bottom: -26%; right: -22%; animation: drift2 58s ease-in-out infinite; }
.b3 { top: 28%; right: -28%; animation: drift3 70s ease-in-out infinite; }
@keyframes drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(8%,12%) scale(1.12); } }
@keyframes drift2 { 0%,100% { transform: translate(0,0) scale(1.05); } 50% { transform: translate(-10%,-8%) scale(0.95); } }
@keyframes drift3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-6%,10%) scale(1.1); } }

.breathe { animation: breathe 6.5s ease-in-out infinite; }
@keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.025); } }

.rise { opacity: 0; transform: translateY(14px); animation: rise .7s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes rise { to { opacity: 1; transform: translateY(0); } }

.bloom { position: absolute; width: 180px; height: 180px; border-radius: 50%; border: 2px solid;
  opacity: 0.6; z-index: 1; pointer-events: none; animation: bloom 1s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes bloom { from { transform: scale(0.55); opacity: 0.55; } to { transform: scale(2.1); opacity: 0; } }

.sway { transform-origin: 50% 100%; animation: sway 5.5s ease-in-out infinite; }
@keyframes sway { 0%,100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }
.firefly { position: absolute; width: 6px; height: 6px; border-radius: 50%; pointer-events: none;
  z-index: 3; opacity: 0.7; animation: fly 6s ease-in-out infinite; }
@keyframes fly { 0%,100% { transform: translate(0,0); opacity: 0.25; } 50% { transform: translate(9px,-14px); opacity: 0.9; } }
`;

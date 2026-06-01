import { useState, useRef, useEffect, useCallback } from "react";
import type { MouseEvent } from "react";
import { Check, Moon } from "lucide-react";
import { S } from "../../lib/styles";
import { HOLD_MS, vibrate, lerp } from "../../lib/format";
import type { Habit } from "../../types";

type Props = {
  habit: Habit; done: boolean; skipped: boolean;
  onComplete: (id: string) => void; onUndo: (id: string) => void;
  onSkip: (id: string) => void; onUnskip: (id: string) => void;
};

// Press-and-hold to complete (~1s → bloom + haptic). Tap a done orb to undo; "Not today"
// logs a neutral skip (tap to undo). No shame anywhere (invariant 3).
export function HabitOrb({ habit, done, skipped, onComplete, onUndo, onSkip, onUnskip }: Props) {
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

  // Function declaration (hoisted) so it can self-schedule the rAF loop without a
  // before-declaration self-reference. Only ever called imperatively, so no memoization.
  function tick() {
    if (!active.current) return;
    const prog = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setP(prog);
    if (prog >= thr.current * 0.34 + 0.0 && thr.current < 3 && prog > thr.current / 3) { thr.current += 1; vibrate(7); }
    if (prog >= 1) return finish();
    raf.current = requestAnimationFrame(tick);
  }

  const startHold = () => {
    if (done || skipped) return;
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
  const skip = (e: MouseEvent) => { e.stopPropagation(); onSkip(habit.id); vibrate(6); };
  const unskip = () => { onUnskip(habit.id); vibrate(8); };

  const muted = skipped && !done;
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
          className={done || skipped ? "" : "breathe"}
          onPointerDown={startHold} onPointerUp={endHold}
          onPointerLeave={endHold} onPointerCancel={endHold}
          onClick={done ? undo : skipped ? unskip : undefined}
          style={{ ...S.orbHit, transform: `scale(${scale})`, opacity: muted ? 0.45 : 1, transition: holding ? "none" : "transform .6s cubic-bezier(.2,.8,.2,1), opacity .5s ease", cursor: "pointer" }}
        >
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
              : skipped ? <Moon size={26} strokeWidth={2.2} color="#cfc8ea" />
              : <span style={{ ...S.holdLabel, opacity: holding ? 0 : 1 }}>hold</span>}
          </div>
        </div>
      </div>

      <div style={S.cardFoot}>
        {done ? <span style={S.doneFoot}>Done · tap to undo</span>
          : skipped ? <span style={S.doneFoot}>Resting today · tap to undo</span>
          : <>
              <span style={{ ...S.intent, opacity: hint ? 1 : 0.62, color: hint ? habit.c1 : "#a79fc4" }}>
                {hint ? "keep holding — make it intentional" : `${habit.anchor} → ${habit.name.toLowerCase()}`}
              </span>
              <button onClick={skip} style={S.skipBtn}>Not today</button>
            </>}
      </div>
    </div>
  );
}

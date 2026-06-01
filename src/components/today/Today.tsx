import { Moon } from "lucide-react";
import { S } from "../../lib/styles";
import { HabitOrb } from "./HabitOrb";
import type { Habit } from "../../types";

type Props = {
  active: Habit[]; queued: Habit[]; done: Set<string>; skipped: Set<string>; name: string;
  onComplete: (id: string) => void; onUndo: (id: string) => void;
  onSkip: (id: string) => void; onUnskip: (id: string) => void; loading: boolean;
};

export function Today({ active, queued, done, skipped, name, onComplete, onUndo, onSkip, onUnskip, loading }: Props) {
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
          <HabitOrb habit={h} done={done.has(h.id)} skipped={skipped.has(h.id)}
            onComplete={onComplete} onUndo={onUndo} onSkip={onSkip} onUnskip={onUnskip} />
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

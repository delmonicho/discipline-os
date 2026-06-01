import { useState } from "react";
import { S } from "../../lib/styles";
import { Plant } from "./Plant";
import { stageFor, STAGE_NAME } from "./stages";
import { Stat } from "./HabitHeatmap";
import type { HistoryEntry } from "../../types";

type Props = { histories: HistoryEntry[]; done: Set<string>; onSeeGrid: () => void };

export function Garden({ histories, done, onSeeGrid }: Props) {
  const [sel, setSel] = useState<string | null>(null);
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

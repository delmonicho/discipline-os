import type { Habit } from "../../types";
import { STAGE_H, STAGE_LEAVES } from "./stages";

type Props = { habit: Habit; stage: number; vitality: string; delay: number };
export function Plant({ habit, stage, vitality, delay }: Props) {
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

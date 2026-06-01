import { mix } from "../lib/format";
import { S } from "../lib/styles";

// Drifting mesh that warms from cool twilight toward dawn as habits complete.
export function Ambient({ warmth }: { warmth: number }) {
  const blob = (cool: string, warm: string) => `radial-gradient(circle, ${mix(cool, warm, warmth)} 0%, transparent 70%)`;
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

// Small pure helpers shared across views.

export const HOLD_MS = 1000;

export const vibrate = (p: number | number[]) => {
  try { navigator.vibrate?.(p); } catch { /* no-op */ }
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function hx(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Interpolate between two #rrggbb colors.
export function mix(a: string, b: string, t: number): string {
  const pa = hx(a), pb = hx(b);
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// Deterministic hue (and matching orb colors) from a habit UUID.
export function hueFromId(id: string): { hue: number; c1: string; c2: string } {
  const hue = parseInt(id.replace(/-/g, "").slice(0, 8), 16) % 360;
  return { hue, c1: `hsl(${hue} 60% 65%)`, c2: `hsl(${hue} 55% 45%)` };
}

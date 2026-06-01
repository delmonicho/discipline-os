import type { CSSProperties } from "react";

// Inline-style objects (invariant 1: no Tailwind, no component library). The three
// state-dependent styles (sendBtn/toggleBtn/navBtn) are exported as functions below.
export const S: Record<string, CSSProperties> = {
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
  skipBtn: { display: "block", margin: "9px auto 0", background: "none", border: "none", color: "#6d6790",
    fontSize: 11.5, letterSpacing: "0.04em", cursor: "pointer", fontFamily: "inherit", padding: "3px 6px" },
  reflectBtn: { marginTop: 14, padding: "9px 16px", borderRadius: 999, border: "1px solid #ffffff1f",
    background: "#ffffff0d", color: "#cfc8ea", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
    letterSpacing: "0.02em", cursor: "pointer" },

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
  dot: { position: "absolute", top: 6, right: 10, width: 7, height: 7, borderRadius: "50%", background: "#ffd98a" },
};

export const sendBtn = (on: boolean): CSSProperties => ({
  width: 48, height: 48, borderRadius: "50%", border: "none",
  background: on ? "linear-gradient(135deg, #5ad1c8, #2b8aa6)" : "rgba(255,255,255,0.08)",
  color: on ? "#06141a" : "#6c6489", display: "flex", alignItems: "center", justifyContent: "center",
  cursor: on ? "pointer" : "default", transition: "all .25s",
});

export const toggleBtn = (on: boolean): CSSProperties => ({
  border: "none", background: on ? "rgba(255,255,255,0.12)" : "transparent",
  color: on ? "#ece7f7" : "#8a82ad", padding: "7px 20px", borderRadius: 12, fontSize: 13.5,
  fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
});

export const navBtn = (on: boolean): CSSProperties => ({
  position: "relative", border: "none", background: on ? "rgba(255,255,255,0.1)" : "transparent",
  color: on ? "#ece7f7" : "#7b7399", padding: "9px 16px", borderRadius: 20, fontSize: 14,
  fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all .25s",
  backdropFilter: on ? "blur(10px)" : "none",
});

export const CSS = `
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

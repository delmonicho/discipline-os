import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { S, sendBtn } from "../../lib/styles";
import { useAuth } from "../../lib/useAuth";
import { fetchThread, streamCoach } from "../../data/coach";

// Streaming coach. Message model:
//   user:      { role:"user", text }
//   assistant: { role:"assistant", segments:[{kind:"text"|"status", text}] }
type Seg = { kind: string; text: string };
type Msg = { role: "user"; text: string } | { role: "assistant"; segments: Seg[] };

export function Coach() {
  const { session } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Load thread on mount
  useEffect(() => {
    if (!session) return;
    fetchThread().then((data) => {
      if (!data || data.length === 0) return;
      setMsgs(data.map((m): Msg =>
        m.role === "user"
          ? { role: "user", text: m.content }
          : { role: "assistant", segments: [{ kind: "text", text: m.content }] }
      ));
    });
  }, [session]);

  const appendSeg = (seg: Seg) => setMsgs((m) => {
    const last = m[m.length - 1];
    if (!last || last.role !== "assistant") return m;
    const segments = [...last.segments];
    const tail = segments[segments.length - 1];
    if (seg.kind === "text" && tail && tail.kind === "text") {
      segments[segments.length - 1] = { kind: "text", text: tail.text + seg.text };
    } else {
      segments.push(seg);
    }
    const updated: Msg = { role: "assistant", segments };
    return [...m.slice(0, -1), updated];
  });

  const run = async (userText: string) => {
    setStreaming(true);
    setMsgs((m) => [...m, { role: "assistant" as const, segments: [] }]);
    try {
      await streamCoach(userText, session!.access_token,
        (t) => appendSeg({ kind: "text", text: t }),
        (s) => appendSeg({ kind: "status", text: s }));
    } catch (e) {
      appendSeg({ kind: "status", text: `⚠️ ${String(e)}` });
    } finally {
      setStreaming(false);
    }
  };

  const send = () => {
    const t = input.trim(); if (!t || streaming) return;
    setMsgs((m) => [...m, { role: "user" as const, text: t }]);
    setInput("");
    run(t);
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
              {m.segments.map((seg: { kind: string; text: string }, si: number) =>
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
        <button onClick={send} style={sendBtn(!!input.trim() && !streaming)}><ArrowUp size={18} strokeWidth={2.6} /></button>
      </div>
    </div>
  );
}

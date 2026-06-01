import { supabase } from "../lib/supabase";

export async function fetchThread() {
  const { data } = await supabase.from("coach_messages")
    .select("role, content, created_at")
    .order("created_at", { ascending: true })
    .limit(50);
  return data ?? [];
}

// NDJSON over fetch (invariant 8) — Bearer is the user's access token, not the anon key.
// Reads chunks, splits on newlines, parses each complete line into a {type,value} event.
export async function streamCoach(
  message: string, token: string,
  onText: (t: string) => void, onStatus: (s: string) => void,
) {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-stream`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let evt: { type: string; value: string };
      try { evt = JSON.parse(line); } catch { continue; }
      if (evt.type === "text") onText(evt.value);
      else if (evt.type === "status") onStatus(evt.value);
      else if (evt.type === "done") return;
      else if (evt.type === "error") { onStatus(`⚠️ ${evt.value}`); return; }
    }
  }
}

export async function reflectWeek(token: string) {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`weekly-review HTTP ${res.status}`);
  return res.json();
}

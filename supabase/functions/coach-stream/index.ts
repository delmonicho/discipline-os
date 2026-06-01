// supabase/functions/coach-stream/index.ts
//
// Streaming coach. Streams the reply token-by-token so the coach feels present
// rather than like a form — for a relationship product, perceived latency *is*
// the relationship.
//
// PROTOCOL: newline-delimited JSON (NDJSON) over a fetch ReadableStream — NOT SSE.
//   SSE can't carry the Supabase Authorization header cleanly and gets fragile
//   inside a webview / React Native. fetch streaming survives the native move.
//
// Each line is one event:
//   {"type":"text","value":"...token..."}        ← append to the bubble
//   {"type":"status","value":"📝 remembered ..."} ← coach used a tool (legible memory)
//   {"type":"done"}                                ← end of turn
//   {"type":"error","value":"..."}
//
// The tool-use loop segments the stream: text → [pause, run tool, status] → more text.
// Don't hide the pause — the status line is what makes the coach's memory + proposals
// visible, which is exactly the trust you want from something that claims to know you.

import {
  cors, clientFor, anthropic, MODEL, tools,
  buildState, buildMemory, buildHistory, buildSystemPrompt, runTool,
} from "../_shared/coach-core.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = clientFor(req);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  // persist the user's turn, then build history (which now includes it)
  await supabase.from("coach_messages").insert({ user_id: user.id, role: "user", content: message });
  // Two cache breakpoints: stance (static, caches across turns) + context (state/memory,
  // caches across the ≤5 within-turn iterations). Prefix order is tools → system → messages.
  const { stance, context } = buildSystemPrompt(await buildState(supabase), await buildMemory(supabase));
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: stance, cache_control: { type: "ephemeral" } },
    { type: "text", text: context, cache_control: { type: "ephemeral" } },
  ];
  let messages: Anthropic.MessageParam[] = await buildHistory(supabase);
  const client = anthropic();

  const body = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      let fullText = "";

      try {
        for (let i = 0; i < 5; i++) {
          const ms = client.messages.stream({ model: MODEL, max_tokens: 1500, system, tools, messages });
          ms.on("text", (delta) => { fullText += delta; send({ type: "text", value: delta }); });

          const final = await ms.finalMessage();
          // Usage incl. cache_creation/cache_read tokens — confirms caching is working.
          console.log("coach usage:", JSON.stringify(final.usage));
          if (final.stop_reason !== "tool_use") break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type === "tool_use") {
              const { result, status } = await runTool(supabase, user.id, block.name, block.input as Record<string, string>);
              if (status) send({ type: "status", value: status });
              toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
            }
          }
          messages = [...messages, { role: "assistant", content: final.content }, { role: "user", content: toolResults }];
          fullText += "\n"; // separate segmented text turns in the stored copy
        }

        await supabase.from("coach_messages").insert({ user_id: user.id, role: "assistant", content: fullText.trim() });
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", value: String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { ...cors, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
});

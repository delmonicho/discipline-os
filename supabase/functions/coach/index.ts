// supabase/functions/coach/index.ts
//
// Single-response coach. Simple to reason about — good for the first dogfood week.
// Swap your client to /coach-stream once you want streaming (the better UX).
// Both share _shared/coach-core.ts, so they can never drift apart.

import {
  cors, json, clientFor, anthropic, MODEL, tools,
  buildState, buildMemory, buildHistory, buildSystemPrompt, runTool,
} from "../_shared/coach-core.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabase = clientFor(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return json({ error: "unauthorized" }, 401);

    const { message } = await req.json();
    if (!message || typeof message !== "string") return json({ error: "message required" }, 400);

    await supabase.from("coach_messages").insert({ user_id: user.id, role: "user", content: message });

    const system = buildSystemPrompt(await buildState(supabase), await buildMemory(supabase));
    let messages: Anthropic.MessageParam[] = await buildHistory(supabase);

    const client = anthropic();
    let reply = "";
    for (let i = 0; i < 5; i++) {
      const resp = await client.messages.create({ model: MODEL, max_tokens: 1500, system, tools, messages });
      reply = resp.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
      if (resp.stop_reason !== "tool_use") break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of resp.content) {
        if (block.type === "tool_use") {
          const { result } = await runTool(supabase, user.id, block.name, block.input as Record<string, string>);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      messages = [...messages, { role: "assistant", content: resp.content }, { role: "user", content: toolResults }];
    }

    await supabase.from("coach_messages").insert({ user_id: user.id, role: "assistant", content: reply });
    return json({ reply });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

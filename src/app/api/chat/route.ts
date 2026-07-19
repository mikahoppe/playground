import Anthropic from "@anthropic-ai/sdk";
import { parseMessages } from "@/lib/chat/messages";
import { requireEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Anthropic model powering the chatbox. */
const MODEL = "claude-opus-4-8";
/** Output cap per reply. Streaming avoids HTTP timeouts at this size. */
const MAX_TOKENS = 4096;

/**
 * Stream a Claude reply for the posted conversation. Requires an authenticated
 * Supabase session; the request body is `{ messages: {role, content}[] }` and
 * the response streams assistant text as `text/plain` chunks.
 * @param {Request} request - The incoming POST request.
 * @returns {Promise<Response>} A streaming text response, or an error status.
 */
export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return new Response("Expected a non-empty messages array", { status: 400 });
  }

  const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system:
      "You are a helpful assistant embedded in a project-management app. Be concise and friendly.",
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(
      controller: ReadableStreamDefaultController<Uint8Array>,
    ): Promise<void> {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

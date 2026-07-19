/** A single chat turn exchanged with the chat API. */
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Validate an untrusted request body into a well-formed message list. Every
 * entry must be an object with a `user`/`assistant` role and a non-empty
 * string `content`; the list itself must be non-empty.
 * @param {unknown} body - The parsed JSON request body.
 * @returns {ChatMessage[] | null} The messages, or `null` if malformed/empty.
 */
export function parseMessages(body: unknown): ChatMessage[] | null {
  if (typeof body !== "object" || body === null || !("messages" in body)) {
    return null;
  }
  const { messages } = body as { messages: unknown };
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }
  const parsed: ChatMessage[] = [];
  for (const item of messages) {
    if (
      typeof item !== "object" ||
      item === null ||
      ((item as { role?: unknown }).role !== "user" &&
        (item as { role?: unknown }).role !== "assistant")
    ) {
      return null;
    }
    const { role, content } = item as { role: string; content: unknown };
    if (typeof content !== "string" || content.length === 0) {
      return null;
    }
    parsed.push({ role: role as ChatMessage["role"], content });
  }
  return parsed;
}

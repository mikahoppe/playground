"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useCallback,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

/** A chat turn held in component state. */
type Message = {
  /** Stable identity for React list keys and scroll anchoring. */
  id: number;
  role: "user" | "assistant";
  content: string;
};

/**
 * A streaming chatbox backed by Claude via the `/api/chat` route. Sends the
 * running conversation on each submit and appends the assistant reply as it
 * streams back. The transcript sticks to the latest message via the shadcn
 * MessageScroller; input is locked while a reply is in flight.
 * @returns {ReactElement} The chat panel.
 */
export function Chat(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(0);

  const send = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isStreaming) {
        return;
      }

      setError(null);
      setInput("");
      const next: Message[] = [
        ...messages,
        { id: nextId.current++, role: "user", content: trimmed },
      ];
      // Render the user turn plus an empty assistant turn to stream into.
      setMessages([
        ...next,
        { id: nextId.current++, role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(
            response.status === 401
              ? "Your session expired. Please sign in again."
              : `Request failed (${response.status})`,
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done: isDone, value } = await reader.read();
          if (isDone) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          setMessages((current) => {
            const updated = [...current];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
            return updated;
          });
        }
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Something went wrong.",
        );
        // Drop the empty assistant placeholder on failure.
        setMessages((current) =>
          current[current.length - 1]?.content === ""
            ? current.slice(0, -1)
            : current,
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, messages],
  );

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex max-h-[70vh] w-full max-w-2xl flex-col gap-4">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="flex-1 rounded-xl border border-border bg-card">
            <MessageScrollerViewport className="p-4">
              <MessageScrollerContent>
                {messages.length === 0 ? (
                  <p className="pt-8 text-center text-muted-foreground text-sm">
                    Ask me anything to get started.
                  </p>
                ) : (
                  messages.map((message, index) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={String(message.id)}
                      scrollAnchor={index === messages.length - 1}
                      className={cn(
                        "flex",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {message.content ||
                          (isStreaming && index === messages.length - 1
                            ? "…"
                            : "")}
                      </div>
                    </MessageScrollerItem>
                  ))
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </MessageScroller>
        </MessageScrollerProvider>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <form onSubmit={send} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              setInput(event.target.value)
            }
            placeholder="Type a message…"
            aria-label="Message"
            disabled={isStreaming}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="lg"
            disabled={isStreaming || !input.trim()}
          >
            {isStreaming ? "Sending…" : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}

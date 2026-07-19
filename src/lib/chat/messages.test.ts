import { describe, expect, it } from "vitest";
import { parseMessages } from "./messages";

describe("parseMessages", () => {
  it("accepts a well-formed conversation", () => {
    const body = {
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello!" },
        { role: "user", content: "How are you?" },
      ],
    };
    expect(parseMessages(body)).toEqual(body.messages);
  });

  it("strips unknown fields down to role and content", () => {
    const result = parseMessages({
      messages: [{ role: "user", content: "Hi", id: 7, extra: true }],
    });
    expect(result).toEqual([{ role: "user", content: "Hi" }]);
  });

  it.each([
    ["not an object", 42],
    ["missing messages key", {}],
    ["messages not an array", { messages: "nope" }],
    ["empty messages array", { messages: [] }],
    ["a non-object entry", { messages: ["hi"] }],
    ["an invalid role", { messages: [{ role: "system", content: "x" }] }],
    ["empty content", { messages: [{ role: "user", content: "" }] }],
    ["non-string content", { messages: [{ role: "user", content: 5 }] }],
  ])("rejects %s", (_label, body) => {
    expect(parseMessages(body)).toBeNull();
  });
});

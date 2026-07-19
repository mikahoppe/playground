import { describe, expect, it } from "vitest";
import {
  canGoBack,
  canGoForward,
  createInitialHistory,
  type HistoryState,
  reduceHistory,
} from "./navigation-history";

describe("createInitialHistory", () => {
  it("starts with a single entry at index 0", () => {
    expect(createInitialHistory("/")).toEqual({ entries: ["/"], index: 0 });
  });
});

describe("reduceHistory", () => {
  it("pushes a new route and truncates any forward history", () => {
    const start = createInitialHistory("/");
    const next = reduceHistory(start, "/projects", null);
    expect(next).toEqual({ entries: ["/", "/projects"], index: 1 });
  });

  it("is a no-op when the pathname matches the current entry", () => {
    const start = createInitialHistory("/");
    expect(reduceHistory(start, "/", null)).toBe(start);
  });

  it("decrements the index on an explicit back action", () => {
    const state: HistoryState = { entries: ["/", "/projects"], index: 1 };
    expect(reduceHistory(state, "/", "back")).toEqual({
      entries: ["/", "/projects"],
      index: 0,
    });
  });

  it("increments the index on an explicit forward action", () => {
    const state: HistoryState = { entries: ["/", "/projects"], index: 0 };
    expect(reduceHistory(state, "/projects", "forward")).toEqual({
      entries: ["/", "/projects"],
      index: 1,
    });
  });

  it("clamps back at the start and forward at the end", () => {
    const state: HistoryState = { entries: ["/"], index: 0 };
    expect(reduceHistory(state, "/", "back").index).toBe(0);
    expect(reduceHistory(state, "/", "forward").index).toBe(0);
  });

  it("detects a browser back gesture without an explicit action", () => {
    const state: HistoryState = { entries: ["/", "/projects"], index: 1 };
    expect(reduceHistory(state, "/", null)).toEqual({
      entries: ["/", "/projects"],
      index: 0,
    });
  });

  it("detects a browser forward gesture without an explicit action", () => {
    const state: HistoryState = { entries: ["/", "/projects"], index: 0 };
    expect(reduceHistory(state, "/projects", null)).toEqual({
      entries: ["/", "/projects"],
      index: 1,
    });
  });

  it("drops forward entries when navigating somewhere new after going back", () => {
    const state: HistoryState = {
      entries: ["/", "/projects", "/team"],
      index: 0,
    };
    const next = reduceHistory(state, "/settings", null);
    expect(next).toEqual({ entries: ["/", "/settings"], index: 1 });
  });

  it("survives a realistic session round-trip", () => {
    let state = createInitialHistory("/");
    state = reduceHistory(state, "/projects", null);
    state = reduceHistory(state, "/projects/website-redesign", null);
    expect(state.index).toBe(2);

    state = reduceHistory(state, "/projects", "back");
    expect(state.index).toBe(1);
    expect(canGoForward(state)).toBe(true);

    state = reduceHistory(state, "/projects/website-redesign", "forward");
    expect(state.index).toBe(2);
    expect(canGoForward(state)).toBe(false);
  });
});

describe("canGoBack / canGoForward", () => {
  it("reflects position within the stack", () => {
    const middle: HistoryState = {
      entries: ["/", "/projects", "/team"],
      index: 1,
    };
    expect(canGoBack(middle)).toBe(true);
    expect(canGoForward(middle)).toBe(true);

    const start: HistoryState = { entries: ["/", "/projects"], index: 0 };
    expect(canGoBack(start)).toBe(false);
    expect(canGoForward(start)).toBe(true);

    const end: HistoryState = { entries: ["/", "/projects"], index: 1 };
    expect(canGoBack(end)).toBe(true);
    expect(canGoForward(end)).toBe(false);
  });
});

/**
 * Pure model for an in-app navigation history stack.
 *
 * Next's router can move back and forward but does not expose whether either is
 * possible, so we maintain our own `entries`/`index` stack. Keeping the logic
 * pure (no React, no router) makes every transition unit-testable and lets the
 * provider stay a thin adapter.
 */

/** How the current pathname change was triggered. */
export type NavigationAction = "back" | "forward" | null;

/** The navigation history stack: visited routes and the active position. */
export type HistoryState = {
  /** Visited routes in navigation order. */
  entries: string[];
  /** Index into {@link entries} of the currently active route. */
  index: number;
};

/**
 * Create a fresh history containing only the current route.
 * @param pathname - The initial pathname.
 * @returns A single-entry history positioned at the start.
 */
export function createInitialHistory(pathname: string): HistoryState {
  return { entries: [pathname], index: 0 };
}

/**
 * Advance the history stack in response to a pathname change.
 *
 * Explicit `back`/`forward` actions (from the header buttons) simply move the
 * index. A `null` action means the change came from elsewhere — a link, or the
 * browser's own back/forward gesture — so we detect a move to an adjacent entry
 * and otherwise treat it as a brand new navigation, truncating any forward
 * history.
 * @param state - The current history state.
 * @param pathname - The pathname after the change.
 * @param action - What triggered the change, if known.
 * @returns The next history state (referentially equal when nothing changed).
 */
export function reduceHistory(
  state: HistoryState,
  pathname: string,
  action: NavigationAction,
): HistoryState {
  if (action === "back") {
    return { ...state, index: Math.max(0, state.index - 1) };
  }

  if (action === "forward") {
    return {
      ...state,
      index: Math.min(state.entries.length - 1, state.index + 1),
    };
  }

  if (state.entries[state.index] === pathname) {
    return state;
  }

  if (state.index > 0 && state.entries[state.index - 1] === pathname) {
    return { ...state, index: state.index - 1 };
  }

  if (
    state.index < state.entries.length - 1 &&
    state.entries[state.index + 1] === pathname
  ) {
    return { ...state, index: state.index + 1 };
  }

  const entries = [...state.entries.slice(0, state.index + 1), pathname];
  return { entries, index: entries.length - 1 };
}

/**
 * Whether there is an earlier entry to navigate back to.
 * @param state - The current history state.
 * @returns Whether back navigation is possible.
 */
export function canGoBack(state: HistoryState): boolean {
  return state.index > 0;
}

/**
 * Whether there is a later entry to navigate forward to.
 * @param state - The current history state.
 * @returns Whether forward navigation is possible.
 */
export function canGoForward(state: HistoryState): boolean {
  return state.index < state.entries.length - 1;
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  type Context,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  canGoBack,
  canGoForward,
  createInitialHistory,
  type HistoryState,
  type NavigationAction,
  reduceHistory,
} from "@/lib/navigation-history";

/** The back/forward controls exposed to consumers. */
export type NavigationHistoryValue = {
  /** Whether back navigation is currently possible. */
  isBackEnabled: boolean;
  /** Whether forward navigation is currently possible. */
  isForwardEnabled: boolean;
  /** Navigate to the previous entry in the history stack. */
  goBack: () => void;
  /** Navigate to the next entry in the history stack. */
  goForward: () => void;
};

export const NavigationHistoryContext: Context<NavigationHistoryValue | null> =
  createContext<NavigationHistoryValue | null>(null);

/**
 * Access the navigation-history controls.
 * @returns {NavigationHistoryValue} The current back/forward state and actions.
 * @throws When used outside a {@link NavigationHistoryProvider}.
 */
export function useNavigationHistory(): NavigationHistoryValue {
  const value = useContext(NavigationHistoryContext);
  if (!value) {
    throw new Error(
      "useNavigationHistory must be used within a NavigationHistoryProvider",
    );
  }
  return value;
}

/** Props for {@link NavigationHistoryProvider}. */
type NavigationHistoryProviderProps = {
  /** The subtree that can read the history controls. */
  children: ReactNode;
};

/**
 * Maintain an in-app navigation history stack and expose back/forward controls.
 * The stack is updated from route changes and stays in sync whether navigation
 * came from the buttons, an in-app link, or the browser's own gestures.
 * @param {NavigationHistoryProviderProps} props - The provider children.
 * @returns {ReactElement} The provider wrapping its children.
 */
export function NavigationHistoryProvider({
  children,
}: NavigationHistoryProviderProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const actionRef = useRef<NavigationAction>(null);
  const [state, setState] = useState<HistoryState>(() =>
    createInitialHistory(pathname),
  );

  const syncHistory = useCallback((): void => {
    const action = actionRef.current;
    actionRef.current = null;
    setState((previous) => reduceHistory(previous, pathname, action));
  }, [pathname]);

  useEffect(() => {
    syncHistory();
  }, [syncHistory]);

  const goBack = useCallback((): void => {
    if (!canGoBack(state)) {
      return;
    }
    actionRef.current = "back";
    router.back();
  }, [state, router]);

  const goForward = useCallback((): void => {
    if (!canGoForward(state)) {
      return;
    }
    actionRef.current = "forward";
    router.forward();
  }, [state, router]);

  const value = useMemo<NavigationHistoryValue>(
    () => ({
      isBackEnabled: canGoBack(state),
      isForwardEnabled: canGoForward(state),
      goBack,
      goForward,
    }),
    [state, goBack, goForward],
  );

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

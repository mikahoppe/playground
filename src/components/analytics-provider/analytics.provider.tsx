"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  EVENTS,
  grantConsent,
  identifyUser,
  initAnalytics,
  resetAnalytics,
  revokeConsent,
  track,
  trackPageViewed,
} from "@/lib/analytics/mixpanel";
import { createClient } from "@/lib/supabase/client";

/** localStorage key persisting the user's tracking-consent decision. */
const CONSENT_KEY = "mp_consent";

type Decision = "granted" | "denied";

/**
 * Initialises Mixpanel and gates it behind a consent prompt. The SDK starts
 * opted out; tracking begins only after the user accepts. The decision is
 * persisted so the prompt is shown only once.
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - The app subtree.
 * @returns {ReactElement} The children plus a consent banner when undecided.
 */
export function AnalyticsProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [decision, setDecision] = useState<Decision | null>(null);
  const pathname = usePathname();

  const syncConsent = useCallback((): void => {
    initAnalytics();
    const stored = window.localStorage.getItem(CONSENT_KEY) as Decision | null;
    if (stored === "granted") {
      grantConsent();
    }
    setDecision(stored);
  }, []);

  useEffect(() => {
    syncConsent();
  }, [syncConsent]);

  // Fire a page view on every route change. Gated on consent so nothing sends
  // beforehand; because `decision` is a dependency, the callback's identity
  // changes when the user accepts, re-running the effect so the landing view
  // (visited before consent) is still captured.
  const trackView = useCallback((): void => {
    if (decision !== "granted") {
      return;
    }
    trackPageViewed(pathname);
  }, [pathname, decision]);

  useEffect(() => {
    trackView();
  }, [trackView]);

  // The user id we've already counted as logged in, so a repeated `SIGNED_IN`
  // (Supabase fires it on tab refocus / session recovery, not just fresh
  // sign-ins) doesn't emit a duplicate "Logged In" event.
  const loggedInUserId = useRef<string | null>(null);

  // Keep the analytics identity in sync with the Supabase session: identify on
  // sign-in and on app re-open with an active session, reset on sign-out. Also
  // emit explicit "Logged In" / "Logged Out" events — but only on a genuine
  // sign-in (never `INITIAL_SESSION`, which is app re-open). Every helper is a
  // no-op until consent is granted / the SDK is ready, so this is safe to run
  // before any consent decision. Uses the user id as the distinct id — never
  // the email. Returns the unsubscribe cleanup.
  const syncAnalyticsIdentity = useCallback((): (() => void) => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_OUT") {
          track(EVENTS.LOGGED_OUT);
          loggedInUserId.current = null;
          resetAnalytics();
          return;
        }
        if (session?.user) {
          identifyUser({
            id: session.user.id,
            email: session.user.email,
          });
          if (
            event === "SIGNED_IN" &&
            loggedInUserId.current !== session.user.id
          ) {
            loggedInUserId.current = session.user.id;
            track(EVENTS.LOGGED_IN);
          }
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => syncAnalyticsIdentity(), [syncAnalyticsIdentity]);

  /**
   * Persist and apply the user's consent choice.
   * @param {Decision} next - The chosen decision.
   */
  function decide(next: Decision): void {
    window.localStorage.setItem(CONSENT_KEY, next);
    if (next === "granted") {
      grantConsent();
    } else {
      revokeConsent();
    }
    setDecision(next);
  }

  return (
    <>
      {children}
      {decision === null ? (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-muted-foreground text-sm">
            We use analytics to understand how the app is used. May we enable
            product analytics?
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => decide("denied")}>
              Decline
            </Button>
            <Button onClick={() => decide("granted")}>Accept</Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

import mixpanel from "mixpanel-browser";

/**
 * Mixpanel analytics wrapper.
 *
 * The SDK is initialised with tracking opted out by default so that no data is
 * sent before the user grants consent (GDPR/EU requirement). Call
 * {@link grantConsent} once the user accepts, and {@link revokeConsent} if they
 * decline. Every {@link track} call is additionally guarded on the opt-in
 * state, so events are silently dropped until consent is granted.
 *
 * Event names use Mixpanel's Title-Case-with-spaces convention (e.g.
 * `"Menu Item Clicked"`); property keys use `snake_case`.
 */

/** Analytics event names. Must be static string literals, never built at runtime. */
export const EVENTS = {
  /** Fired once, immediately after a user completes sign-up (post-identify). */
  SIGNUP_COMPLETED: "Signup Completed",
  /** Fired on every route change (initial view plus client-side navigations). */
  PAGE_VIEWED: "Page Viewed",
  /** Fired by the SDK when the user opts in to tracking (renamed from `$opt_in`). */
  TRACKING_OPT_IN: "Tracking Opt In",
  /** Fired on an explicit sign-in (not on app re-open with an existing session). */
  LOGGED_IN: "Logged In",
  /** Fired on sign-out, before the analytics identity is reset. */
  LOGGED_OUT: "Logged Out",
} as const;

let initialized = false;

/**
 * Initialise the Mixpanel SDK. Safe to call multiple times and on the server
 * (no-op outside the browser and after the first successful call).
 */
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") {
    return;
  }

  // Referenced statically (not via a helper) so Next.js inlines the value into
  // the browser bundle; a dynamic `process.env[name]` lookup stays undefined
  // client-side.
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) {
    return;
  }

  mixpanel.init(token, {
    // EU data residency: the project lives in Mixpanel's EU cluster, so events
    // must be sent here. The default US host returns 200 but silently drops the
    // data.
    api_host: "https://api-eu.mixpanel.com",
    debug: process.env.NODE_ENV !== "production",
    // Page views are tracked manually on route change (see AnalyticsProvider);
    // the SDK's auto-pageview only fires on full loads, missing SPA navigations.
    track_pageview: false,
    persistence: "localStorage",
    // No events leave the browser until the user opts in via grantConsent().
    opt_out_tracking_by_default: true,
  });

  initialized = true;
}

/** Whether the user has explicitly opted in to tracking. */
export function hasConsent(): boolean {
  return initialized && mixpanel.has_opted_in_tracking();
}

/** Opt the user in to tracking (call after they accept the consent prompt). */
export function grantConsent(): void {
  // Guard on the persisted opt-in state so the opt-in event fires exactly once
  // — at the accept transition — not again on every reload where syncConsent
  // re-applies a previously stored decision.
  if (initialized && !mixpanel.has_opted_in_tracking()) {
    // Rename the SDK's default "$opt_in" event to match our naming convention.
    mixpanel.opt_in_tracking({ track_event_name: EVENTS.TRACKING_OPT_IN });
  }
}

/** Opt the user out of tracking (call after they decline the consent prompt). */
export function revokeConsent(): void {
  if (initialized) {
    mixpanel.opt_out_tracking();
  }
}

/**
 * Track an event. No-op until the SDK is initialised and the user has opted in.
 * @param {string} event - A static event name from {@link EVENTS}.
 * @param {Record<string, unknown>} [properties] - Event properties (snake_case keys).
 */
export function track(
  event: (typeof EVENTS)[keyof typeof EVENTS],
  properties?: Record<string, unknown>,
): void {
  if (!hasConsent()) {
    return;
  }
  mixpanel.track(event, properties);
}

/**
 * Associate subsequent events with a known user and set their profile. Call on
 * login/signup and on every app re-open while a session is active. Must run
 * before tracking {@link EVENTS.SIGNUP_COMPLETED}.
 * @param {object} user - The authenticated user.
 * @param {string} user.id - Stable user id (never an email).
 * @param {string} [user.name] - Display name.
 * @param {string} [user.email] - Email address.
 */
export function identifyUser(user: {
  id: string;
  name?: string;
  email?: string;
}): void {
  if (!hasConsent()) {
    return;
  }
  mixpanel.identify(user.id);
  mixpanel.people.set({
    ...(user.name ? { $name: user.name } : {}),
    ...(user.email ? { $email: user.email } : {}),
  });
}

/**
 * Clear the current identity and start a fresh anonymous session. Call on
 * logout — omitting it merges the next user into the previous session.
 */
export function resetAnalytics(): void {
  if (initialized) {
    mixpanel.reset();
  }
}

/**
 * Track a page view.
 * @param {string} path - The pathname that was viewed.
 */
export function trackPageViewed(path: string): void {
  track(EVENTS.PAGE_VIEWED, { path });
}

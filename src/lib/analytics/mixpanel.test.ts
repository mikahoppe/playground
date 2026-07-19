import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMixpanel = {
  init: vi.fn(),
  track: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  opt_in_tracking: vi.fn(),
  opt_out_tracking: vi.fn(),
  has_opted_in_tracking: vi.fn(() => false),
  people: { set: vi.fn() },
};

vi.mock("mixpanel-browser", () => ({ default: mockMixpanel }));

// Imported after the mock is registered so the wrapper binds to the stub.
const {
  EVENTS,
  grantConsent,
  identifyUser,
  initAnalytics,
  resetAnalytics,
  track,
  trackPageViewed,
} = await import("./mixpanel");

describe("mixpanel wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMixpanel.has_opted_in_tracking.mockReturnValue(false);
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "test-token";
    // initAnalytics is idempotent across the suite; the first call wins.
    initAnalytics();
  });

  it("initialises opted out by default", () => {
    expect(mockMixpanel.init).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ opt_out_tracking_by_default: true }),
    );
  });

  it("drops events until consent is granted", () => {
    track(EVENTS.SIGNUP_COMPLETED);
    expect(mockMixpanel.track).not.toHaveBeenCalled();
  });

  it("renames the SDK opt-in event when consent is granted", () => {
    grantConsent();
    expect(mockMixpanel.opt_in_tracking).toHaveBeenCalledWith({
      track_event_name: "Tracking Opt In",
    });
  });

  it("only fires the opt-in event once, not on every reopen", () => {
    // First accept: not yet opted in, so the event fires.
    mockMixpanel.has_opted_in_tracking.mockReturnValue(false);
    grantConsent();
    // Subsequent reopens re-apply the stored decision while already opted in.
    mockMixpanel.has_opted_in_tracking.mockReturnValue(true);
    grantConsent();
    grantConsent();
    expect(mockMixpanel.opt_in_tracking).toHaveBeenCalledTimes(1);
  });

  it("tracks page views once consent is granted", () => {
    mockMixpanel.has_opted_in_tracking.mockReturnValue(true);
    grantConsent();
    trackPageViewed("/projects");
    expect(mockMixpanel.track).toHaveBeenCalledWith("Page Viewed", {
      path: "/projects",
    });
  });

  it("identifies before setting the profile", () => {
    mockMixpanel.has_opted_in_tracking.mockReturnValue(true);
    identifyUser({ id: "u1", name: "Ada", email: "ada@example.com" });
    const identifyOrder = mockMixpanel.identify.mock.invocationCallOrder[0];
    const setOrder = mockMixpanel.people.set.mock.invocationCallOrder[0];
    expect(mockMixpanel.identify).toHaveBeenCalledWith("u1");
    expect(identifyOrder).toBeLessThan(setOrder);
  });

  it("omits absent profile properties instead of sending empty values", () => {
    mockMixpanel.has_opted_in_tracking.mockReturnValue(true);
    identifyUser({ id: "u2" });
    expect(mockMixpanel.people.set).toHaveBeenCalledWith({});
  });

  it("resets identity on logout", () => {
    resetAnalytics();
    expect(mockMixpanel.reset).toHaveBeenCalled();
  });

  it("sends the login and logout lifecycle events once consent is granted", () => {
    mockMixpanel.has_opted_in_tracking.mockReturnValue(true);
    track(EVENTS.LOGGED_IN);
    track(EVENTS.LOGGED_OUT);
    expect(mockMixpanel.track).toHaveBeenCalledWith("Logged In", undefined);
    expect(mockMixpanel.track).toHaveBeenCalledWith("Logged Out", undefined);
  });
});

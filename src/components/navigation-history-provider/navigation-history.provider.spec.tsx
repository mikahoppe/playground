import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NavigationHistoryProvider,
  useNavigationHistory,
} from "./navigation-history.provider";

const mockPathname = vi.fn<() => string>(() => "/");
const back = vi.fn();
const forward = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: (): string => mockPathname(),
  useRouter: (): { back: () => void; forward: () => void } => ({
    back,
    forward,
  }),
}));

/**
 * Minimal consumer that surfaces the history controls for assertions.
 * @returns The rendered controls.
 */
function Controls(): ReactElement {
  const { isBackEnabled, isForwardEnabled, goBack, goForward } =
    useNavigationHistory();
  return (
    <div>
      <span data-testid="back-enabled">{String(isBackEnabled)}</span>
      <span data-testid="forward-enabled">{String(isForwardEnabled)}</span>
      <button type="button" onClick={goBack}>
        back
      </button>
      <button type="button" onClick={goForward}>
        forward
      </button>
    </div>
  );
}

/**
 * Render the provider wrapping the controls consumer.
 * @returns The Testing Library render result.
 */
function renderProvider() {
  return render(
    <NavigationHistoryProvider>
      <Controls />
    </NavigationHistoryProvider>,
  );
}

describe("NavigationHistoryProvider", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    back.mockClear();
    forward.mockClear();
  });

  it("throws when the hook is used without a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Controls />)).toThrow(/NavigationHistoryProvider/);
    spy.mockRestore();
  });

  it("starts with both controls disabled", () => {
    renderProvider();
    expect(screen.getByTestId("back-enabled")).toHaveTextContent("false");
    expect(screen.getByTestId("forward-enabled")).toHaveTextContent("false");
  });

  it("enables back after navigating to a new route", () => {
    const { rerender } = renderProvider();

    mockPathname.mockReturnValue("/projects");
    rerender(
      <NavigationHistoryProvider>
        <Controls />
      </NavigationHistoryProvider>,
    );

    expect(screen.getByTestId("back-enabled")).toHaveTextContent("true");
    expect(screen.getByTestId("forward-enabled")).toHaveTextContent("false");
  });

  it("drives router.back and updates enabled state after the route changes", async () => {
    const user = userEvent.setup();
    const { rerender } = renderProvider();

    mockPathname.mockReturnValue("/projects");
    rerender(
      <NavigationHistoryProvider>
        <Controls />
      </NavigationHistoryProvider>,
    );

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(back).toHaveBeenCalledOnce();

    mockPathname.mockReturnValue("/");
    rerender(
      <NavigationHistoryProvider>
        <Controls />
      </NavigationHistoryProvider>,
    );

    expect(screen.getByTestId("back-enabled")).toHaveTextContent("false");
    expect(screen.getByTestId("forward-enabled")).toHaveTextContent("true");
  });
});

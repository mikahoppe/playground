import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NavigationHistoryContext,
  type NavigationHistoryValue,
} from "@/components/navigation-history-provider/navigation-history.provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "./header.component";

const mockPathname = vi.fn<() => string>(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: (): string => mockPathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }): ReactElement => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const goBack = vi.fn();
const goForward = vi.fn();

/**
 * Render the header inside the sidebar and navigation-history providers.
 * @param overrides - Partial history value to merge over the defaults.
 * @returns The Testing Library render result.
 */
function renderHeader(overrides: Partial<NavigationHistoryValue> = {}) {
  const value: NavigationHistoryValue = {
    isBackEnabled: true,
    isForwardEnabled: true,
    goBack,
    goForward,
    ...overrides,
  };
  return render(
    <SidebarProvider>
      <NavigationHistoryContext.Provider value={value}>
        <Header />
      </NavigationHistoryContext.Provider>
    </SidebarProvider>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    goBack.mockClear();
    goForward.mockClear();
  });

  it("renders a single current crumb at the root", () => {
    renderHeader();
    expect(screen.getByText("Dashboard")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("links ancestor crumbs and marks the last as current", () => {
    mockPathname.mockReturnValue("/projects/website-redesign");
    renderHeader();

    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByText("Website Redesign")).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Dashboard is a sibling route, not an ancestor of Projects.
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("exposes a labelled breadcrumb landmark", () => {
    renderHeader();
    expect(
      screen.getByRole("navigation", { name: "breadcrumb" }),
    ).toBeInTheDocument();
  });

  it("renders the sidebar toggle and history controls", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /toggle sidebar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go forward" }),
    ).toBeInTheDocument();
  });

  it("disables the history controls when navigation is unavailable", () => {
    renderHeader({ isBackEnabled: false, isForwardEnabled: false });
    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go forward" })).toBeDisabled();
  });

  it("invokes the history actions on click", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Go back" }));
    await user.click(screen.getByRole("button", { name: "Go forward" }));

    expect(goBack).toHaveBeenCalledOnce();
    expect(goForward).toHaveBeenCalledOnce();
  });
});

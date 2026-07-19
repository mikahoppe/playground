import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar.component";

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

/**
 * Render the sidebar inside the shadcn SidebarProvider it depends on.
 * @returns The Testing Library render result.
 */
function renderSidebar() {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    </TooltipProvider>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("renders every top-level nav entry", () => {
    renderSidebar();
    for (const label of ["Dashboard", "Projects", "Team", "Settings"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active route with aria-current", () => {
    mockPathname.mockReturnValue("/projects");
    renderSidebar();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps the parent section active on nested detail routes", () => {
    mockPathname.mockReturnValue("/projects/website-redesign");
    renderSidebar();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("exposes a labelled primary navigation landmark", () => {
    renderSidebar();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
  });
});

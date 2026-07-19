import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar.component";

const meta = {
  title: "Navigation/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <SidebarProvider>
          <Story />
        </SidebarProvider>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default state with the dashboard route active. */
export const Dashboard: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByRole("link", { name: "Dashboard" });
    await expect(active).toHaveAttribute("aria-current", "page");
  },
};

/** A top-level route (Projects) selected. */
export const ProjectsActive: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/projects" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  },
};

/** Nested detail route keeps its parent section highlighted. */
export const NestedRouteKeepsParentActive: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/projects/website-redesign" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "page");
  },
};

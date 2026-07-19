import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import {
  NavigationHistoryContext,
  type NavigationHistoryValue,
} from "@/components/navigation-history-provider/navigation-history.provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "./header.component";

const baseHistory: NavigationHistoryValue = {
  isBackEnabled: true,
  isForwardEnabled: true,
  goBack: fn(),
  goForward: fn(),
};

const meta = {
  title: "Navigation/Header",
  component: Header,
  args: {
    userEmail: "user@example.com",
  },
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story, context) => {
      const value: NavigationHistoryValue = {
        ...baseHistory,
        ...(context.parameters.history as Partial<NavigationHistoryValue>),
      };
      return (
        <SidebarProvider>
          <NavigationHistoryContext.Provider value={value}>
            <Story />
          </NavigationHistoryContext.Provider>
        </SidebarProvider>
      );
    },
  ],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Root route: single current crumb, both history controls present. */
export const Root: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Dashboard")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      canvas.getByRole("button", { name: "Go back" }),
    ).toBeInTheDocument();
  },
};

/** Detail route with a full breadcrumb trail. */
export const DetailRoute: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/projects/website-redesign" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "Projects" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Website Redesign")).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

/** Start of history: back is disabled, forward is available. */
export const AtHistoryStart: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    history: { isBackEnabled: false, isForwardEnabled: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Go back" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Go forward" }),
    ).toBeEnabled();
  },
};

import { expect, test } from "@playwright/test";

test.describe("navigation shell", () => {
  test("sidebar renders all primary entries", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Dashboard", "Projects", "Team", "Settings"]) {
      await expect(sidebar.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("clicking a nav entry navigates and updates active state", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.getByRole("navigation", { name: "Primary" });
    await sidebar.getByRole("link", { name: "Projects" }).click();

    await expect(page).toHaveURL("/projects");
    await expect(
      sidebar.getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("breadcrumbs grow on a project detail page", async ({ page }) => {
    await page.goto("/projects/website-redesign");

    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(
      breadcrumb.getByRole("link", { name: "Projects" }),
    ).toBeVisible();
    await expect(breadcrumb.getByText("Website Redesign")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(breadcrumb.getByText("Dashboard")).toHaveCount(0);
  });

  test("breadcrumb ancestor link navigates back up", async ({ page }) => {
    await page.goto("/projects/website-redesign");
    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
    await breadcrumb.getByRole("link", { name: "Projects" }).click();
    await expect(page).toHaveURL("/projects");
  });

  test("skip link is reachable by keyboard", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
  });

  test("history buttons move back and forth through visited routes", async ({
    page,
  }) => {
    await page.goto("/");
    const back = page.getByRole("button", { name: "Go back" });
    const forward = page.getByRole("button", { name: "Go forward" });
    const sidebar = page.getByRole("navigation", { name: "Primary" });

    await expect(back).toBeDisabled();
    await expect(forward).toBeDisabled();

    await sidebar.getByRole("link", { name: "Projects" }).click();
    await expect(page).toHaveURL("/projects");
    await sidebar.getByRole("link", { name: "Team" }).click();
    await expect(page).toHaveURL("/team");

    await expect(back).toBeEnabled();
    await back.click();
    await expect(page).toHaveURL("/projects");
    await back.click();
    await expect(page).toHaveURL("/");
    await expect(back).toBeDisabled();

    await expect(forward).toBeEnabled();
    await forward.click();
    await expect(page).toHaveURL("/projects");
  });

  test("sidebar toggles between expanded and collapsed icon states", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar"]');
    const toggle = page.getByRole("button", { name: /toggle sidebar/i });

    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await toggle.click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    // Icon rail keeps the nav links reachable by name.
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
        name: "Dashboard",
      }),
    ).toBeVisible();

    await toggle.click();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  test("navigating somewhere new clears the forward history", async ({
    page,
  }) => {
    await page.goto("/");
    const back = page.getByRole("button", { name: "Go back" });
    const forward = page.getByRole("button", { name: "Go forward" });
    const sidebar = page.getByRole("navigation", { name: "Primary" });

    await sidebar.getByRole("link", { name: "Projects" }).click();
    await back.click();
    await expect(page).toHaveURL("/");
    await expect(forward).toBeEnabled();

    await sidebar.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL("/settings");
    await expect(forward).toBeDisabled();
  });
});

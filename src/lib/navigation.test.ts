import { describe, expect, it } from "vitest";
import { NAV_ITEMS, resolveBreadcrumbs } from "./navigation";

describe("NAV_ITEMS", () => {
  it("exposes the four top-level routes in order", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/projects",
      "/team",
      "/settings",
    ]);
  });

  it("gives every entry a label and an icon", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveBreadcrumbs", () => {
  it("returns a single current crumb for the root", () => {
    expect(resolveBreadcrumbs("/")).toEqual([
      { href: "/", label: "Dashboard", isCurrent: true },
    ]);
  });

  it("returns a single crumb for a top-level route", () => {
    expect(resolveBreadcrumbs("/projects")).toEqual([
      { href: "/projects", label: "Projects", isCurrent: true },
    ]);
  });

  it("accumulates hrefs and humanizes unknown detail segments", () => {
    expect(resolveBreadcrumbs("/projects/website-redesign")).toEqual([
      { href: "/projects", label: "Projects", isCurrent: false },
      {
        href: "/projects/website-redesign",
        label: "Website Redesign",
        isCurrent: true,
      },
    ]);
  });

  it("flags only the last crumb as current", () => {
    const crumbs = resolveBreadcrumbs("/projects/website-redesign");
    const currentCount = crumbs.filter((crumb) => crumb.isCurrent).length;
    expect(currentCount).toBe(1);
    expect(crumbs.at(-1)?.isCurrent).toBe(true);
  });

  it("ignores trailing slashes without emitting empty crumbs", () => {
    const crumbs = resolveBreadcrumbs("/team/");
    expect(crumbs).toEqual([{ href: "/team", label: "Team", isCurrent: true }]);
  });
});

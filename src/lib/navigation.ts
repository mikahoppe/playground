/**
 * Single source of truth for the app's navigation.
 *
 * The `Sidebar` renders {@link NAV_ITEMS} directly, while the `Header` derives
 * its breadcrumb trail from the same route table via {@link resolveBreadcrumbs}.
 * Keeping both surfaces backed by one definition means a route is described in
 * exactly one place.
 */

/** Identifiers for the built-in navigation glyphs. */
export type IconName = "dashboard" | "projects" | "team" | "settings";

/** A top-level entry rendered in the sidebar. */
export type NavItem = {
  /** Absolute route the entry links to. */
  href: string;
  /** Human-readable label shown next to the icon. */
  label: string;
  /** Which glyph to render for the entry. */
  icon: IconName;
};

/** A single hop in a breadcrumb trail. */
export type Breadcrumb = {
  /** Absolute route the crumb links to. */
  href: string;
  /** Human-readable label for the crumb. */
  label: string;
  /** Whether the crumb represents the currently active page. */
  isCurrent: boolean;
};

/** Top-level navigation shown in the sidebar, in display order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/team", label: "Team", icon: "team" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

/**
 * Exact-path titles used to label breadcrumbs. This is a superset of the
 * sidebar entries so that detail pages (which never appear in the sidebar) can
 * still contribute a readable crumb. Unknown segments fall back to a humanized
 * form of the URL slug.
 */
const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/team": "Team",
  "/settings": "Settings",
};

/**
 * Turn a URL slug into a display label, e.g. `website-redesign` -> `Website
 * Redesign`.
 * @param segment - A single path segment (no slashes).
 * @returns The title-cased, space-separated label.
 */
function humanizeSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build the breadcrumb trail for a given pathname.
 *
 * The trail contains one crumb per path segment, resolving each cumulative path
 * against {@link ROUTE_TITLES} and humanizing anything not found there. The
 * final crumb is flagged as current. Top-level routes therefore render a single
 * crumb (e.g. `/team` -> `Team`); the dashboard root is not prepended as an
 * ancestor since it is a sibling, not a parent, of the other top-level routes.
 * @param pathname - The active pathname, e.g. `/projects/website-redesign`.
 * @returns The ordered breadcrumb trail for the current page.
 */
export function resolveBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === "/") {
    return [{ href: "/", label: ROUTE_TITLES["/"] ?? "Home", isCurrent: true }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [];
  let cumulative = "";

  segments.forEach((segment, index) => {
    cumulative += `/${segment}`;
    crumbs.push({
      href: cumulative,
      label: ROUTE_TITLES[cumulative] ?? humanizeSegment(segment),
      isCurrent: index === segments.length - 1,
    });
  });

  return crumbs;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { NavIcon } from "@/components/icons/nav-icon.component";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarRoot,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/lib/navigation";

/**
 * Decide whether a nav entry is active for the current route. The root (`/`)
 * only matches exactly; every other entry also matches its nested detail
 * routes, e.g. `/projects` stays active on `/projects/website-redesign`.
 * @param {string} href - The nav entry's href.
 * @param {string} pathname - The currently active pathname.
 * @returns {boolean} Whether the entry should render as active.
 */
function isActiveRoute(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Primary application sidebar.
 * @returns {ReactElement} The primary navigation landmark.
 */
export function Sidebar(): ReactElement {
  const pathname = usePathname();

  return (
    <SidebarRoot collapsible="icon" className="border-transparent">
      <SidebarContent className="pt-12">
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Primary">
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const isActive = isActiveRoute(item.href, pathname);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <NavIcon name={item.icon} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarRoot>
  );
}

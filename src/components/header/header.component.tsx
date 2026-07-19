"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, type ReactElement } from "react";
import { signOut } from "@/app/auth/actions";
import { ArrowIcon } from "@/components/icons/arrow-icon.component";
import { useNavigationHistory } from "@/components/navigation-history-provider/navigation-history.provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { resolveBreadcrumbs } from "@/lib/navigation";

/**
 * Application header. Renders the sidebar toggle and history back/forward
 * controls alongside a breadcrumb trail derived from the active route via the
 * shared {@link resolveBreadcrumbs} helper. The final crumb is the current
 * page; the history buttons disable at the ends of the stack. The trailing
 * section shows the signed-in user's email and a sign-out control.
 * @param {object} props - Component props.
 * @param {string | null} props.userEmail - The signed-in user's email, or
 *   `null` when unavailable.
 * @returns {ReactElement} The header banner with controls and breadcrumbs.
 */
export function Header({
  userEmail,
}: {
  userEmail: string | null;
}): ReactElement {
  const pathname = usePathname();
  const breadcrumbs = resolveBreadcrumbs(pathname);
  const { isBackEnabled, isForwardEnabled, goBack, goForward } =
    useNavigationHistory();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 bg-sidebar px-4 md:px-6">
      <SidebarTrigger />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goBack}
          disabled={!isBackEnabled}
          aria-label="Go back"
        >
          <ArrowIcon direction="back" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goForward}
          disabled={!isForwardEnabled}
          aria-label="Go forward"
        >
          <ArrowIcon direction="forward" />
        </Button>
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isCurrent ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        {userEmail ? (
          <span className="hidden text-muted-foreground text-sm sm:inline">
            {userEmail}
          </span>
        ) : null}
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

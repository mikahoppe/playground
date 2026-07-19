import type { ReactElement, ReactNode } from "react";
import { Header } from "@/components/header/header.component";
import { NavigationHistoryProvider } from "@/components/navigation-history-provider/navigation-history.provider";
import { Sidebar } from "@/components/sidebar/sidebar.component";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated app shell. Wraps every route in the `(app)` group with the
 * sidebar, header and main content area. Unauthenticated visitors never reach
 * these routes — the middleware redirects them to `/login` first — so the
 * user's email is fetched here to show in the header.
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - The routed page.
 * @returns {ReactElement} The app shell around the page.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <NavigationHistoryProvider>
      <TooltipProvider>
        <SidebarProvider>
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header userEmail={user?.email ?? null} />
            <main
              id="main-content"
              className="bg m-1 flex-1 overflow-auto rounded-xl border border-border p-4 shadow-sm md:mt-0 md:ml-0 md:p-8"
              style={{
                backgroundImage:
                  "radial-gradient(var(--dot) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              {children}
            </main>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </NavigationHistoryProvider>
  );
}

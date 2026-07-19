import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactElement, ReactNode } from "react";
import { AnalyticsProvider } from "@/components/analytics-provider/analytics.provider";
import { cn } from "@/lib/utils";
import "./globals.css";
import type { NextFontWithVariable } from "next/dist/compiled/@next/font";

const geist: NextFontWithVariable = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "app",
  description: "Playground app with sidebar navigation and breadcrumbs.",
};

/**
 * Root layout. Keeps only document-level concerns and the analytics provider so
 * consent and page-view tracking apply to every route, including the
 * unauthenticated auth pages. The authenticated app shell (sidebar, header)
 * lives in the `(app)` route group so it never wraps the login/signup screens.
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - The routed subtree.
 * @returns {ReactElement} The document shell.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="bg-card antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10"
        >
          Skip to content
        </a>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}

"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * App toast host. Thin wrapper over sonner's Toaster wired to the design
 * system's CSS variables so toasts match the app surface in light and dark.
 * @param {ToasterProps} props - Passed through to sonner's Toaster.
 * @returns {React.ReactElement} The toaster portal.
 */
function Toaster(props: ToasterProps): React.ReactElement {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };

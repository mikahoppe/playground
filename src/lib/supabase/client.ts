import { createBrowserClient } from "@supabase/ssr";

// Referenced statically (not via `requireEnv`) so Next.js inlines the values
// into the browser bundle. A dynamic `process.env[name]` lookup — as
// `requireEnv` does — stays `undefined` client-side, matching the Mixpanel
// token handling documented in AGENTS.md.
const SUPABASE_URL: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY: string | undefined =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Create a Supabase client for use in client components (`"use client"`).
 * @returns {ReturnType<typeof createBrowserClient>} The browser client.
 */
export function createClient(): ReturnType<typeof createBrowserClient> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}

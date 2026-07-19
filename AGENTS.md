# Instructions

## Project Overview

## Key Technologies

- **Next.js 16** with App Router
- **React 19** with Server Components and Server Actions
- **Supabase** for PostgreSQL database
- **TypeScript** with strict mode
- **Tailwind CSS 4** for styling
- **Vitest** for unit tests
- **Playwright** for E2E tests
- **Storybook 10** for component development
- **Biome** for linting/formatting

## Important Patterns

### Server Actions

Server actions are in `src/app/actions.ts`. They use the Supabase server client and call `revalidatePath("/")` to refresh data after mutations.

### Supabase Clients

- **Browser client** (`src/lib/supabase/client.ts`): Use in client components with `"use client"`
- **Server client** (`src/lib/supabase/server.ts`): Use in Server Components and Server Actions

## Authentication (Supabase)

Email + password auth following Supabase's Next.js App Router guide.

- **Session refresh + gating**: `src/lib/supabase/middleware.ts` (`updateSession`),
  wired via Next 16's proxy convention in `src/proxy.ts` (NOT `middleware.ts` —
  Next 16 rejects both files together). It calls `supabase.auth.getUser()`
  immediately after `createServerClient` (no logic in between — the token must
  refresh first) and redirects unauthenticated requests to `/login`. Public
  prefixes: `/login`, `/signup`, `/auth`.
- **Actions** (`src/app/auth/actions.ts`): `signIn`, `signUp`, `signOut`. They
  take `FormData`, call the server client, `revalidatePath("/", "layout")` and
  `redirect`. Errors round-trip via `?error=`; email-confirmation signups
  (no session returned) route to `/login?message=`.
- **UI**: `/login` and `/signup` pages. The authenticated app shell (sidebar,
  header) lives in the `(app)` route group so it never wraps the auth pages;
  the root layout only holds document concerns + `AnalyticsProvider`.
- **Browser env vars**: `client.ts` references `process.env.NEXT_PUBLIC_*`
  **statically**, never via `requireEnv` — a dynamic `process.env[name]` lookup
  is `undefined` in the browser bundle (same gotcha as the Mixpanel token).
  `server.ts` / the middleware use `requireEnv` (real `process.env` server-side).
- **Analytics**: `AnalyticsProvider` subscribes to
  `supabase.auth.onAuthStateChange` — `identifyUser()` (id = `user.id`, never
  email) on sign-in / active session, `resetAnalytics()` on sign-out.
- **Never** trust `getSession()` in server code; always `getUser()`.

## Testing

### Unit Tests

- Framework: Vitest with Testing Library
- Run: `bun test` (watch) or `bun test:run` (once)
- Config: `vitest.config.ts`

### E2E Tests

- Framework: Playwright
- Location: `playwright/` directory
- Run: `bun test:e2e`
- Config: `playwright.config.ts`
- Tests run against `http://localhost:3000` (dev server starts automatically)

### Storybook

- Location: Stories are co-located with components (e.g., `Button.stories.tsx`)
- Run: `bun storybook` (starts on port 6006)
- Build: `bun storybook:build`
- Config: `.storybook/` directory
- Addons: a11y, docs, vitest integration

## Analytics (Mixpanel)

- **SDK**: `mixpanel-browser` (web). Wrapper: `src/lib/analytics/mixpanel.ts`.
- **Data residency**: EU project. `init` sets `api_host: https://api-eu.mixpanel.com`
  — the default US host returns 200 but silently drops EU-project data.
- **Token**: `NEXT_PUBLIC_MIXPANEL_TOKEN` in `.env.local`. Referenced statically
  (not via `requireEnv`) so Next.js inlines it into the browser bundle — a
  dynamic `process.env[name]` lookup is `undefined` client-side.
- **Consent (EU/GDPR)**: SDK inits with `opt_out_tracking_by_default: true`.
  `AnalyticsProvider` (`src/components/analytics-provider/`) shows a consent
  banner and calls `grantConsent()` / `revokeConsent()`; the decision is stored
  in `localStorage` under `mp_consent`. No events send until the user accepts.
- **Events** (Title Case names, `snake_case` properties):
  - `Signup Completed` — call `identifyUser()` then `track(EVENTS.SIGNUP_COMPLETED)`
    on signup. Helper wired but no auth UI exists yet.
  - `Page Viewed` — fired on every route change from `AnalyticsProvider` (via a
    `usePathname` effect) with a `path` property. The SDK's auto-pageview is
    disabled (`track_pageview: false`) since it misses SPA navigations.
  - `Logged In` / `Logged Out` — fired from `AnalyticsProvider`'s
    `onAuthStateChange` handler. `Logged In` fires only on a genuine `SIGNED_IN`
    (deduped per user id; **not** on `INITIAL_SESSION`, which is app re-open).
    `Logged Out` fires on `SIGNED_OUT` before `resetAnalytics()` so it's still
    attributed to the departing user.
- **Identity**: `identifyUser()` on login/app-reopen, `resetAnalytics()` on
  logout. Never use email as the id.
- **Verify**: events appear in Mixpanel → Live View. `Bad HTTP status: 0` in the
  browser means an ad/tracker blocker is blocking `mixpanel.com` — not a code bug.

## Code Style

- Use Biome for linting and formatting
- Run `bun lint` to check, `bun format` to fix
- Prefer `type` over `interface` for simple types
- Use `import type` for type-only imports


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
- **Biome** for linting/formatting

## Important Patterns

### Server Actions

Server actions are in `src/app/actions.ts`. They use the Supabase server client and call `revalidatePath("/")` to refresh data after mutations.

### Supabase Clients

- **Browser client** (`src/lib/supabase/client.ts`): Use in client components with `"use client"`
- **Server client** (`src/lib/supabase/server.ts`): Use in Server Components and Server Actions

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

## Code Style

- Use Biome for linting and formatting
- Run `bun lint` to check, `bun format` to fix
- Prefer `type` over `interface` for simple types
- Use `import type` for type-only imports


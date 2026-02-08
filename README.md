# Playground

## Stack

### Core
- **Next.js 16** with **React 19** and App Router
- **TypeScript 5**
- **Tailwind CSS 4**

### Backend & Database
- **Supabase** (`@supabase/supabase-js`) as PostgreSQL database and authentication

### Testing
- **Vitest** for unit tests
- **Playwright** for end-to-end tests

### Development Tools
- **Biome** for linting and formatting
- **bun** as package manager and runtime

## Getting Started

### Prerequisites
- Node.js
- bun
- Supabase

### Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Run the database migration in Supabase SQL Editor

4. Start the development server:
   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun lint` | Run Biome linter |
| `bun format` | Format code with Biome |
| `bun test` | Run unit tests in watch mode |
| `bun test:run` | Run unit tests once |
| `bun test:e2e` | Run Playwright E2E tests |




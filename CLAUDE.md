# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foco Diet Planner helps students plan meals at Foco (Downwood dining services) by setting calorie/protein goals and browsing daily menu items with full nutritional data. Menu data is scraped daily from the Foco website via a cloud browser automation service.

## Commands

```bash
# Install dependencies (pnpm is the package manager)
pnpm install

# Run Next.js dev server (localhost:3000)
pnpm dev

# Run Convex backend (required alongside Next.js dev server - use a separate terminal)
npx convex dev

# Build for production
pnpm build

# Lint
pnpm lint

# Deploy Convex to production
npx convex deploy --prod
```

Development requires **two terminals**: one for `npx convex dev` (backend + type generation) and one for `pnpm dev` (frontend).

## Architecture

**Frontend**: Next.js 16 App Router with React 19. Pages use a server component (`page.tsx`) that renders a `"use client"` companion (`*Client.tsx`). All client components consume Convex reactive queries via `useQuery`/`useMutation` hooks.

**Backend**: Convex serverless functions (not Next.js API routes). All backend logic lives in `convex/`:
- `schema.ts` - Database schema (4 collections: `menuItems`, `userPreferences`, `mealPlans`, `scrapeLog`)
- `menuItems.ts` - Queries (list, getById, getToday, search) and internal mutations (insert, seedDemoData)
- `mealPlans.ts` - CRUD for user meal plans with automatic calorie/protein recalculation
- `userPreferences.ts` - Upsert pattern for user diet goals
- `scraping.ts` - Browserbase + Playwright action for scraping the Foco website
- `crons.ts` - Daily scrape job at 5:00 AM UTC

**Auth**: Clerk handles authentication. Clerk wraps Convex via `ConvexProviderWithClerk` in `components/providers/ConvexClientProvider.tsx`. The Clerk JWT template must be named exactly `"convex"`. Auth config is in `convex/auth.config.ts`. The middleware gracefully degrades when Clerk keys are not configured.

**Provider hierarchy**: `ClerkProvider` -> `ConvexProviderWithClerk` -> App

**Scraping pipeline**: `crons.ts` triggers `scraping.scrapeFocoMenu` action daily -> Browserbase creates a stealth browser session -> Playwright navigates/clicks meal tabs -> extracts items -> calls `internal.menuItems.insert` for deduplication via `uniqueKey` (`name-location-mealType-date`).

## Key Conventions

- **Path alias**: `@/*` maps to the project root
- **UI components**: shadcn/ui primitives in `components/ui/`, domain components in `components/meal-planning/` and `components/layout/`
- **Styling**: Tailwind CSS v4 with `cn()` utility from `lib/utils.ts` (clsx + tailwind-merge)
- **Types**: `lib/types.ts` has frontend mirror types of the Convex schema. Convex auto-generates types in `convex/_generated/` (gitignored)
- **Constants**: `lib/constants.ts` has app-wide constants (meal types, calorie thresholds, nav items, dietary restrictions)
- **Dates**: Stored as ISO strings (`YYYY-MM-DD`), generated via `new Date().toISOString().split("T")[0]`
- **Convex functions**: Queries for reads (real-time reactive), mutations for writes, actions for external side effects (scraping). Internal functions prefixed with `internal.` are not callable from the client
- **TypeScript**: Strict mode enabled. Convex files are excluded from `tsconfig.json` (Convex has its own TS config)

## Environment Variables

Required env vars (see `.env.local.example`):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` - Clerk auth
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk Frontend API URL for Convex auth
- `BROWSERBASE_API_KEY` / `BROWSERBASE_PROJECT_ID` - Cloud browser for scraping
- `FOCO_WEBSITE_URL` - Target website to scrape

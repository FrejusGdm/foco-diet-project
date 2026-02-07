# Foco Diet Planner

A modern web application that helps students plan meals at Foco (Downwood dining services) based on their calorie goals. Instead of clicking through endless menus, set your calorie target and get a streamlined meal planning experience.

## Features

- **Calorie Goal Tracking** - Set daily calorie and protein goals, track progress in real-time
- **Daily Menu Browser** - Browse breakfast, lunch, and dinner options with full nutritional info
- **Smart Meal Planning** - Build meal plans with running calorie totals
- **Automated Menu Scraping** - Daily scraping of the Foco website via Browserbase (cloud browser automation)
- **Real-time Updates** - Powered by Convex reactive queries - UI updates instantly
- **Modern UI** - Built with shadcn/ui components, Tailwind CSS, and responsive design

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router) | Server-side rendering, routing |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 | Component library, styling |
| Backend | Convex | Real-time database, serverless functions |
| Auth | Clerk | Authentication, user management |
| Scraping | Browserbase + Playwright | Cloud browser automation |
| Language | TypeScript (strict) | Type safety across the stack |

## Project Structure

```
foco-diet-project/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── meal-planner/page.tsx     # Meal planning interface
│   ├── preferences/page.tsx      # User preferences/goals
│   ├── sign-in/[[...sign-in]]/   # Clerk sign-in
│   └── sign-up/[[...sign-up]]/   # Clerk sign-up
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/                   # Header, navigation
│   ├── meal-planning/            # Meal-specific components
│   └── providers/                # Clerk + Convex providers
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── menuItems.ts              # Menu item queries/mutations
│   ├── userPreferences.ts        # User preferences functions
│   ├── mealPlans.ts              # Meal plan functions
│   ├── scraping.ts               # Browserbase scraping action
│   ├── crons.ts                  # Scheduled jobs
│   └── auth.config.ts            # Clerk JWT auth config
├── lib/
│   ├── utils.ts                  # Utility functions (cn, formatters)
│   └── constants.ts              # App constants and types
├── docs/
│   ├── openapi.yaml              # OpenAPI 3.1 specification
│   ├── architecture.md           # Architecture documentation
│   └── api-reference.md          # API reference guide
├── middleware.ts                  # Clerk auth middleware
└── BUILD_INSTRUCTIONS.md         # Original build specification
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Accounts: [Clerk](https://clerk.com), [Convex](https://convex.dev), [Browserbase](https://browserbase.com)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Clerk

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a JWT Template named exactly `convex`
3. Copy your keys

### 3. Set Up Convex

```bash
npx convex dev
```

This initializes your Convex project, generates types, and creates the `.env.local` with your Convex URL.

### 4. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-frontend-api.clerk.accounts.dev
BROWSERBASE_API_KEY=your_key
BROWSERBASE_PROJECT_ID=your_project
FOCO_WEBSITE_URL=https://foco-website-url.com
```

### 5. Run Development Server

In two terminals:

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Load Demo Data (Optional)

Once logged in, go to the Dashboard and click **"Load Demo Menu Data"** to populate test menu items.

## API Documentation

- **OpenAPI Spec**: [`docs/openapi.yaml`](docs/openapi.yaml) - Full API specification (OpenAPI 3.1)
- **API Reference**: [`docs/api-reference.md`](docs/api-reference.md) - Detailed function documentation
- **Architecture**: [`docs/architecture.md`](docs/architecture.md) - System design and data flows

## Database Schema

Four collections in Convex:

| Collection | Purpose | Key Indexes |
|-----------|---------|-------------|
| `menuItems` | Daily menu items with nutrition data | by_date, by_date_mealType, by_uniqueKey |
| `userPreferences` | User calorie/protein goals | by_userId |
| `mealPlans` | User's selected meals per day | by_userId_date |
| `scrapeLog` | Scraping operation history | by_date |

## Scraping

Menu data is collected via Browserbase (cloud browser service) + Playwright:

- **Schedule**: Daily at 5:00 AM UTC via Convex cron job
- **Method**: Stealth-mode browser navigates the Foco website, clicks through meal tabs, extracts nutritional data
- **Deduplication**: Items are identified by a composite key (`name-location-mealType-date`)
- **Debugging**: Each session has a replay URL in the Browserbase dashboard

## Deployment

### Convex Backend
```bash
npx convex deploy --prod
```

### Next.js Frontend
Deploy to Vercel (recommended):
```bash
vercel deploy
```

Set all environment variables in the Vercel dashboard. Update `CLERK_JWT_ISSUER_DOMAIN` for your production Clerk domain.

## License

MIT

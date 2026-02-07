# Foco Diet Planner

I built this because trying to diet while eating at Foco is genuinely painful.

If you're a Dartmouth student, you know the deal — Foco (53 Commons) is where you eat most of your meals. The dining website technically has calorie info, but the UI is so bad and unintuitive that actually finding it feels like a scavenger hunt. You have to click through multiple pages, expand individual items, and even then there's no way to say "I have 800 calories left for dinner, what can I actually eat?" You're left guessing, mentally adding up numbers, or just giving up and grabbing whatever looks good.

I got tired of that. I wanted to set a calorie target for the day, pull up tonight's menu, and build a plate that actually fits my goals — with a running total that updates as I add items. That's what this app does.

## Why I Built This

Every semester I'd try to be more intentional about what I eat. Cut, bulk, maintain — whatever the goal was, it always ran into the same wall: Foco's menu changes daily, and the nutrition info is technically there but buried under the worst UI imaginable. You'd have to click into each item one by one just to see the calories — forget about comparing options or planning a full meal.

The dining site lists items, sure. But it doesn't let you:
- Set a calorie or protein budget
- Build a meal and see the totals add up
- Filter by dietary restrictions
- Get suggestions for what fits your remaining budget

I kept wishing someone would build this. Eventually I just built it myself.

## Features

- **Real-time menu data** - Pulled directly from Dartmouth's dining API with full nutritional info
- **Calorie & protein goal tracking** - Set your targets and see color-coded progress throughout the day
- **Smart meal planning** - Build your plate with a running calorie total that updates as you add items
- **Dietary restriction filters** - Filter out items that don't match your diet
- **Dark mode** - Because sometimes you're planning tomorrow's meals at 2 AM
- **Real-time updates** - Powered by Convex reactive queries, the UI stays in sync instantly

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

## Menu Data

Menu data is fetched from Dartmouth's public dining API:

- **Source**: `https://menu.dartmouth.edu/menuapi/mealitems?dates=YYYYMMDD`
- **Schedule**: Daily at 5:00 AM UTC via Convex cron job
- **Data**: Full nutritional info (calories, protein, fat, carbs, allergens) for all dining locations
- **Deduplication**: Items are identified by a composite key (`name-location-mealType-date`)

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

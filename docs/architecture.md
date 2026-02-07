# Foco Diet Planner - Architecture Documentation

## System Overview

The Foco Diet Planner is a full-stack web application that helps university students plan meals at Foco dining services based on their calorie goals. The system automates menu data collection via web scraping and provides a real-time meal planning interface.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │  Next.js    │  │  Clerk Auth     │  │  Convex React    │    │
│  │  App Router │  │  Components     │  │  Subscriptions   │    │
│  └──────┬──────┘  └───────┬─────────┘  └────────┬─────────┘    │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          │ HTTP            │ JWT                  │ WebSocket
          ▼                 ▼                      ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│  Vercel Edge    │  │  Clerk API   │  │    Convex Backend        │
│  (Next.js SSR)  │  │              │  │                          │
│                 │  │  ┌────────┐  │  │  ┌────────────────────┐  │
│  ┌───────────┐  │  │  │  JWT   │──┼──┼─▶│  Auth Validation  │  │
│  │Middleware │  │  │  │Template│  │  │  └────────────────────┘  │
│  │(Clerk)    │  │  │  └────────┘  │  │                          │
│  └───────────┘  │  └──────────────┘  │  ┌────────────────────┐  │
└─────────────────┘                    │  │  Queries (live)    │  │
                                       │  │  - menuItems.list  │  │
                                       │  │  - mealPlans.get   │  │
                                       │  │  - preferences.get │  │
                                       │  └────────────────────┘  │
                                       │                          │
                                       │  ┌────────────────────┐  │
                                       │  │  Mutations         │  │
                                       │  │  - addMeal         │  │
                                       │  │  - removeMeal      │  │
                                       │  │  - updatePrefs     │  │
                                       │  └────────────────────┘  │
                                       │                          │
                                       │  ┌────────────────────┐  │
                                       │  │  Actions           │  │
                                       │  │  - scrapeFocoMenu  │──┼──┐
                                       │  └────────────────────┘  │  │
                                       │                          │  │
                                       │  ┌────────────────────┐  │  │
                                       │  │  Cron Jobs         │  │  │
                                       │  │  - daily @ 5am UTC │  │  │
                                       │  └────────────────────┘  │  │
                                       │                          │  │
                                       │  ┌────────────────────┐  │  │
                                       │  │  Database          │  │  │
                                       │  │  ├─ menuItems      │  │  │
                                       │  │  ├─ userPreferences│  │  │
                                       │  │  ├─ mealPlans      │  │  │
                                       │  │  └─ scrapeLog      │  │  │
                                       │  └────────────────────┘  │  │
                                       └──────────────────────────┘  │
                                                                     │
                                       ┌──────────────────────────┐  │
                                       │    Browserbase           │◀─┘
                                       │  (Cloud Browser)         │
                                       │                          │
                                       │  ┌────────────────────┐  │
                                       │  │  Playwright CDP    │  │
                                       │  │  + Stealth Mode    │──┼──┐
                                       │  └────────────────────┘  │  │
                                       └──────────────────────────┘  │
                                                                     │
                                       ┌──────────────────────────┐  │
                                       │  Foco Dining Website     │◀─┘
                                       │  (Target for scraping)   │
                                       └──────────────────────────┘
```

## Data Flow

### 1. Menu Scraping Flow
```
Cron Job (5am UTC)
  └─▶ scraping.scrapeFocoMenu action
       └─▶ Browserbase creates cloud browser session
            └─▶ Playwright navigates Foco website
                 ├─▶ Click "Breakfast" tab → extract items
                 ├─▶ Click "Lunch" tab → extract items
                 └─▶ Click "Dinner" tab → extract items
                      └─▶ For each item:
                           └─▶ menuItems.insert mutation
                                └─▶ Check uniqueKey index (dedup)
                                     ├─▶ EXISTS: update availability
                                     └─▶ NEW: insert into database
```

### 2. Meal Planning Flow
```
User opens Meal Planner page
  └─▶ useQuery(menuItems.list) → subscribes to today's menu
  └─▶ useQuery(mealPlans.getByDate) → subscribes to today's plan

User clicks "Add to Plan"
  └─▶ useMutation(mealPlans.addMeal)
       └─▶ Verify menu item exists
       └─▶ Get or create meal plan for date
       └─▶ Add item ID to meals[mealType] array
       └─▶ Recalculate totalCalories + totalProtein
       └─▶ Convex reactivity updates all subscribed clients
```

### 3. Authentication Flow
```
User visits protected route
  └─▶ Clerk middleware checks auth
       ├─▶ No token: redirect to /sign-in
       └─▶ Has token: allow through
            └─▶ ClerkProvider provides auth context
                 └─▶ ConvexProviderWithClerk forwards JWT
                      └─▶ Convex validates JWT against Clerk issuer
                           └─▶ ctx.auth.getUserIdentity() available
```

## Database Schema

### Indexes Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| menuItems | by_date | Filter items by date |
| menuItems | by_mealType | Filter items by meal type |
| menuItems | by_date_mealType | Compound filter (most common query) |
| menuItems | by_uniqueKey | Deduplication during scraping |
| menuItems | by_available_date | Filter available items by date |
| userPreferences | by_userId | Lookup preferences by authenticated user |
| mealPlans | by_userId_date | Lookup plan by user and date (primary query) |
| scrapeLog | by_date | Check scraping history |

### Deduplication Strategy

Menu items are deduplicated using a composite key:
```
uniqueKey = `${name}-${location}-${mealType}-${date}`
```

When the scraper encounters an item that already exists (same key),
it updates the `available` flag to `true` instead of inserting a duplicate.

## Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js 16 (App Router) | SSR, file-based routing, React Server Components |
| UI Library | shadcn/ui + Radix UI | Accessible, customizable, Tailwind-native |
| Styling | Tailwind CSS v4 | Utility-first, design token system, no config file needed |
| Backend | Convex | Real-time subscriptions, type-safe, serverless |
| Auth | Clerk | Drop-in auth UI, JWT integration with Convex |
| Scraping | Browserbase + Playwright | Cloud browsers, stealth mode, handles JS-heavy sites |
| Package Manager | pnpm | Fast, disk-efficient, strict dependency resolution |

## Security Considerations

1. **Authentication**: All user-specific data queries/mutations check `ctx.auth.getUserIdentity()`
2. **Authorization**: Users can only access their own preferences and meal plans (filtered by userId)
3. **Input Validation**: Convex validators enforce types at the function boundary
4. **Secrets Management**: API keys stored in environment variables, never committed
5. **Scraping Ethics**: Stealth mode used responsibly for legitimate menu data access
6. **CORS**: Handled by Convex and Next.js middleware

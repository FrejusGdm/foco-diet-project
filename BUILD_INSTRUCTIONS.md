# Foco Diet Planner - Comprehensive Build Instructions

## 🎯 Project Overview

Build a modern web application that helps users plan their meals at Foco (dining services at Downwood) based on their calorie goals. The current Foco website has poor UX - users must click through multiple pages to check calories. This app will provide a streamlined experience where users can set calorie goals and receive personalized meal recommendations.

### Core Problem Statement
- **Current State**: Foco website requires users to manually click through each menu item to check calories
- **User Need**: Quick access to meal planning based on calorie goals (e.g., "stay under 1500 calories")
- **Solution**: Automated menu scraping + intelligent meal planning interface

---

## 📋 Project Requirements

### Functional Requirements

1. **User Authentication & Preferences**
   - Users can sign up/login
   - Users can set daily calorie goals
   - Users can specify meal preferences (breakfast, lunch, dinner)
   - Users can track their daily calorie intake

2. **Menu Data Management**
   - Automated daily scraping of Foco menu (breakfast, lunch, dinner)
   - Store menu items with: name, calories, protein, location, meal type, date
   - Deduplicate menu items (if item already exists, don't add again)
   - Historical data tracking

3. **Meal Planning Engine**
   - Algorithm to suggest meal combinations based on calorie goals
   - Filter by meal type (breakfast/lunch/dinner)
   - Show available options for current day
   - Display total calories, protein, and other nutritional info
   - Allow users to select meals and track daily intake

4. **Scraping System**
   - Browser-based agent that runs daily at midnight
   - Navigate Foco website
   - Extract menu items for breakfast, lunch, and dinner
   - Handle JavaScript-heavy pages
   - Store data in database

### Non-Functional Requirements
- Modern, clean UI/UX (use front-end design plugins/tools)
- Responsive design (mobile-first)
- Real-time data updates
- Fast performance
- Type-safe codebase
- Production-ready architecture

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Use a modern component library (shadcn/ui recommended) or front-end design plugins
- **State Management**: React hooks + Convex real-time subscriptions
- **Package Manager**: pnpm

### Backend & Database
- **Backend**: Convex (serverless functions, real-time database)
- **Database**: Convex (NoSQL, reactive queries)
- **Authentication**: Clerk (integrated with Convex)

### Scraping & Automation
- **Scraping Tool**: Puppeteer or Playwright (browser automation)
- **Scheduling**: Convex scheduled functions (cron jobs)
- **Browser**: Headless Chrome/Firefox

### Development Tools
- **Type Safety**: TypeScript strict mode
- **Linting**: ESLint + Next.js config
- **Formatting**: Prettier
- **Version Control**: Git

---

## 🏗 Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth UI    │  │  Meal Planner│  │  Preferences  │     │
│  │   (Clerk)    │  │     UI       │  │      UI       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Real-time Queries
                          │ Mutations
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Queries    │  │  Mutations    │  │   Actions     │     │
│  │  (Real-time) │  │  (Writes)     │  │  (Scraping)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Scheduled Functions (Cron Jobs)              │  │
│  │  - Daily at midnight: Scrape Foco menu              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Store Data
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Convex Database                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Menu Items   │  │ User Prefs    │  │ Meal Plans   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Design

#### `menuItems` Collection
```typescript
{
  _id: Id<"menuItems">,
  name: string,                    // Menu item name
  calories: number,                 // Calorie count
  protein: number,                  // Protein in grams
  location: string,                 // Which Foco location
  mealType: "breakfast" | "lunch" | "dinner",
  date: string,                    // ISO date string (YYYY-MM-DD)
  available: boolean,               // Currently available
  createdAt: number,                // Timestamp
  // Optional: other nutritional info
  carbs?: number,
  fat?: number,
  description?: string,
  imageUrl?: string,
  // Deduplication key
  uniqueKey: string,               // Composite: name-location-mealType-date
}
```

#### `userPreferences` Collection
```typescript
{
  _id: Id<"userPreferences">,
  userId: string,                   // From Clerk auth
  dailyCalorieGoal: number,         // User's calorie target
  preferredMealTypes: ("breakfast" | "lunch" | "dinner")[],
  dietaryRestrictions?: string[],   // e.g., ["vegetarian", "gluten-free"]
  createdAt: number,
  updatedAt: number,
}
```

#### `mealPlans` Collection (User's selected meals)
```typescript
{
  _id: Id<"mealPlans">,
  userId: string,
  date: string,                     // ISO date string
  meals: {
    breakfast?: Id<"menuItems">[],
    lunch?: Id<"menuItems">[],
    dinner?: Id<"menuItems">[],
  },
  totalCalories: number,
  totalProtein: number,
  createdAt: number,
  updatedAt: number,
}
```

### API Functions Structure

#### Queries (Read-only, Real-time)
- `menuItems.list` - Get menu items for a date/meal type
- `menuItems.getById` - Get specific menu item
- `userPreferences.get` - Get user preferences
- `mealPlans.getByDate` - Get user's meal plan for a date
- `mealPlans.getCurrent` - Get today's meal plan

#### Mutations (Write operations)
- `userPreferences.update` - Update user calorie goals/preferences
- `mealPlans.addMeal` - Add meal to plan
- `mealPlans.removeMeal` - Remove meal from plan
- `mealPlans.clear` - Clear meal plan for a date

#### Actions (External operations, async)
- `scraping.scrapeFocoMenu` - Scrape Foco website (called by scheduled function)
- `scraping.scrapeMealType` - Scrape specific meal type

#### Scheduled Functions
- `scheduled.scrapeDailyMenu` - Runs daily at midnight (0 0 * * *)

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Git installed
- Clerk account (free tier)
- Convex account (free tier)

### Step 1: Initialize Next.js Project

```bash
# In the project directory
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-pnpm
```

**Important**: If the directory has existing files (like goal.txt), temporarily move them out, initialize Next.js, then move them back.

### Step 2: Install Dependencies

```bash
# Core dependencies
pnpm add convex @clerk/nextjs

# Convex should be in devDependencies for CLI
pnpm add -D convex

# UI Component Library (choose one)
pnpm add @radix-ui/react-*  # For shadcn/ui
# OR use another modern component library

# Additional utilities
pnpm add date-fns  # For date manipulation
pnpm add zod       # For schema validation (if not using Convex v)
```

### Step 3: Initialize Convex

```bash
# Run Convex setup
npx convex dev

# This will:
# - Create convex.json
# - Set up Convex project
# - Generate API types
# - Create .env.local with CONVEX_URL
```

**Note**: You'll need to sign up/login to Convex during this process.

### Step 4: Set Up Clerk

1. **Create Clerk Application**
   - Go to https://dashboard.clerk.com
   - Create new application
   - Choose authentication methods (Email, Google, etc.)
   - Copy your publishable key and secret key

2. **Create JWT Template for Convex**
   - In Clerk Dashboard, go to JWT Templates
   - Click "New template"
   - Select "Convex" template
   - **CRITICAL**: Do NOT rename the template - it must be called `convex`
   - Copy the Issuer URL (Frontend API URL)
   - Format: `https://verb-noun-00.clerk.accounts.dev` (dev) or `https://clerk.<your-domain>.com` (prod)

3. **Configure Environment Variables**

Create `.env.local`:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=dev

# Clerk JWT Issuer (for Convex auth)
CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
```

### Step 5: Configure Convex Auth

Create `convex/auth.config.ts`:
```typescript
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

Deploy to Convex:
```bash
npx convex dev
```

### Step 6: Set Up Clerk + Convex Integration

Create `components/ConvexClientProvider.tsx`:
```typescript
'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file')
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
```

Create `middleware.ts`:
```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

Update `app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Foco Diet Planner',
  description: 'Plan your meals at Foco based on your calorie goals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

---

## 📐 Implementation Details

### 1. Database Schema (`convex/schema.ts`)

Define the schema using Convex's `defineSchema`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  menuItems: defineTable({
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    location: v.string(),
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner")),
    date: v.string(), // ISO date format
    available: v.boolean(),
    createdAt: v.number(),
    uniqueKey: v.string(), // For deduplication
    // Optional fields
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_mealType", ["mealType"])
    .index("by_date_mealType", ["date", "mealType"])
    .index("by_uniqueKey", ["uniqueKey"]), // For deduplication checks

  userPreferences: defineTable({
    userId: v.string(),
    dailyCalorieGoal: v.number(),
    preferredMealTypes: v.array(v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"))),
    dietaryRestrictions: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  mealPlans: defineTable({
    userId: v.string(),
    date: v.string(),
    meals: v.object({
      breakfast: v.optional(v.array(v.id("menuItems"))),
      lunch: v.optional(v.array(v.id("menuItems"))),
      dinner: v.optional(v.array(v.id("menuItems"))),
    }),
    totalCalories: v.number(),
    totalProtein: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_date", ["userId", "date"]),
});
```

### 2. Menu Items Functions (`convex/menuItems.ts`)

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get menu items for a specific date and meal type
export const list = query({
  args: {
    date: v.string(),
    mealType: v.optional(v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("menuItems")
      .withIndex("by_date", (q) => q.eq("date", args.date));

    if (args.mealType) {
      query = query.filter((q) => q.eq(q.field("mealType"), args.mealType));
    }

    return await query.collect();
  },
});

// Query: Get available menu items for today
export const getToday = query({
  args: {
    mealType: v.optional(v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"))),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    // Implementation similar to list
  },
});

// Mutation: Insert menu item (used by scraping action)
export const insert = mutation({
  args: {
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    location: v.string(),
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner")),
    date: v.string(),
    uniqueKey: v.string(),
    // Optional fields
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if item already exists (deduplication)
    const existing = await ctx.db
      .query("menuItems")
      .withIndex("by_uniqueKey", (q) => q.eq("uniqueKey", args.uniqueKey))
      .first();

    if (existing) {
      // Update if exists, or skip
      return existing._id;
    }

    // Insert new item
    return await ctx.db.insert("menuItems", {
      ...args,
      available: true,
      createdAt: Date.now(),
    });
  },
});
```

### 3. User Preferences Functions (`convex/userPreferences.ts`)

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get user preferences
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    return preferences;
  },
});

// Mutation: Update user preferences
export const update = mutation({
  args: {
    dailyCalorieGoal: v.number(),
    preferredMealTypes: v.array(v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"))),
    dietaryRestrictions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("userPreferences", {
        userId: identity.subject,
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
```

### 4. Meal Plans Functions (`convex/mealPlans.ts`)

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get meal plan for a date
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date)
      )
      .first();

    return plan;
  },
});

// Mutation: Add meal to plan
export const addMeal = mutation({
  args: {
    date: v.string(),
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner")),
    menuItemId: v.id("menuItems"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get or create meal plan
    let plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date)
      )
      .first();

    // Calculate totals
    // Implementation details...
  },
});
```

### 5. Scraping Action (`convex/scraping.ts`)

```typescript
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Action: Scrape Foco menu for a specific date
export const scrapeFocoMenu = action({
  args: {
    date: v.string(), // ISO date string
  },
  handler: async (ctx, args) => {
    // Use Puppeteer or Playwright to scrape
    // This is an action because it needs to make external HTTP requests
    
    // Pseudo-code:
    // 1. Launch headless browser
    // 2. Navigate to Foco website
    // 3. Click through breakfast, lunch, dinner menus
    // 4. Extract menu items with calories, protein, etc.
    // 5. For each item, call menuItems.insert mutation
    
    // Example structure:
    const menuItems = await scrapeFocoWebsite(args.date);
    
    for (const item of menuItems) {
      await ctx.runMutation(internal.menuItems.insert, {
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        location: item.location,
        mealType: item.mealType,
        date: args.date,
        uniqueKey: `${item.name}-${item.location}-${item.mealType}-${args.date}`,
      });
    }
  },
});

// Helper function to scrape (implement with Puppeteer/Playwright)
async function scrapeFocoWebsite(date: string) {
  // Implementation with browser automation
  // Return array of menu items
}
```

### 6. Scheduled Function (`convex/scheduled.ts`)

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at midnight UTC
crons.daily(
  "scrapeDailyMenu",
  {
    hourUTC: 0, // Midnight UTC
    minuteUTC: 0,
  },
  internal.scraping.scrapeFocoMenu,
  {
    date: new Date().toISOString().split("T")[0], // Today's date
  }
);

export default crons;
```

---

## 🎨 UI/UX Design Requirements

### Design Principles
- **Clean & Modern**: Use a modern design system (shadcn/ui, Radix UI, or similar)
- **Mobile-First**: Responsive design that works on all devices
- **Accessible**: Follow WCAG guidelines
- **Fast**: Optimize for performance and loading times
- **Intuitive**: Clear navigation and user flows

### Use Front-End Design Plugins/Tools
- **shadcn/ui**: Recommended component library (built on Radix UI)
- **Tailwind CSS**: For styling
- **Radix UI**: For accessible primitives
- **Lucide React**: For icons
- **Framer Motion**: For animations (optional but recommended)

### Key Pages/Components

1. **Landing/Auth Page**
   - Sign in/Sign up with Clerk
   - Welcome message
   - Brief explanation of the app

2. **Dashboard/Home Page**
   - Current calorie goal display
   - Today's meal plan summary
   - Quick access to meal planning
   - Progress indicators

3. **Preferences Page**
   - Set daily calorie goal
   - Select preferred meal types
   - Dietary restrictions
   - Save preferences

4. **Meal Planning Page**
   - Filter by meal type (breakfast/lunch/dinner)
   - List of available menu items
   - Search/filter functionality
   - Add to meal plan button
   - Show calories, protein for each item
   - Running total of selected meals

5. **Meal Plan View**
   - Display selected meals for the day
   - Breakdown by meal type
   - Total calories vs goal
   - Total protein
   - Ability to remove meals
   - Calendar view for different days

### Component Structure
```
components/
  ├── ui/              # shadcn/ui components
  │   ├── button.tsx
  │   ├── card.tsx
  │   ├── input.tsx
  │   └── ...
  ├── auth/            # Auth-related components
  │   └── AuthGuard.tsx
  ├── meal-planning/   # Meal planning components
  │   ├── MealItemCard.tsx
  │   ├── MealPlanSummary.tsx
  │   ├── MealSelector.tsx
  │   └── CalorieProgress.tsx
  └── layout/          # Layout components
      ├── Header.tsx
      ├── Sidebar.tsx
      └── Footer.tsx
```

---

## 🤖 Scraping Implementation Deep Dive

### Challenges
- Foco website likely uses JavaScript for dynamic content
- May require authentication or session management
- Need to handle different locations
- Menu structure may change over time

### Implementation Strategy

#### Option 1: Puppeteer (Recommended)
```typescript
import puppeteer from 'puppeteer';

async function scrapeFocoMenu(date: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://foco-website-url.com');
    
    // Wait for content to load
    await page.waitForSelector('.menu-container');
    
    // Scrape breakfast
    const breakfastItems = await scrapeMealType(page, 'breakfast');
    
    // Navigate to lunch
    await page.click('[data-meal="lunch"]');
    await page.waitForTimeout(1000);
    const lunchItems = await scrapeMealType(page, 'lunch');
    
    // Navigate to dinner
    await page.click('[data-meal="dinner"]');
    await page.waitForTimeout(1000);
    const dinnerItems = await scrapeMealType(page, 'dinner');
    
    return [...breakfastItems, ...lunchItems, ...dinnerItems];
  } finally {
    await browser.close();
  }
}

async function scrapeMealType(page: Page, mealType: string) {
  // Implementation to extract menu items
  // Look for calorie information, protein, etc.
  return items;
}
```

#### Option 2: Playwright
Similar approach but with Playwright API.

### Error Handling
- Retry logic for failed scrapes
- Logging for debugging
- Fallback mechanisms
- Alert system if scraping fails multiple days

### Data Extraction
- Parse HTML/CSS selectors
- Extract text content
- Parse nutritional information
- Handle edge cases (missing data, format variations)

---

## 🔒 Security Considerations

1. **Authentication**: All user data protected by Clerk auth
2. **Authorization**: Users can only access their own meal plans/preferences
3. **Input Validation**: Validate all inputs using Convex validators
4. **Rate Limiting**: Implement rate limiting for scraping actions
5. **Environment Variables**: Never commit secrets to git
6. **CORS**: Configure properly for production

---

## 📊 Testing Strategy

### Unit Tests
- Test Convex functions (queries, mutations)
- Test utility functions
- Test data transformations

### Integration Tests
- Test Convex + Clerk integration
- Test scraping functionality
- Test meal planning algorithm

### E2E Tests
- Test user flows (sign up → set preferences → plan meals)
- Test scraping workflow
- Test real-time updates

---

## 🚢 Deployment

### Convex Deployment
```bash
# Deploy to production
npx convex deploy --prod

# Set production environment variables in Convex dashboard
```

### Next.js Deployment
- Deploy to Vercel (recommended) or other platform
- Set environment variables in deployment platform
- Configure Clerk for production domain
- Update `CLERK_JWT_ISSUER_DOMAIN` for production

### Environment Variables Checklist
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (prod)
- [ ] `CLERK_SECRET_KEY` (prod)
- [ ] `NEXT_PUBLIC_CONVEX_URL` (prod)
- [ ] `CLERK_JWT_ISSUER_DOMAIN` (prod)
- [ ] Any API keys for scraping

---

## 📝 Open Spec Considerations

If possible, consider:
- **OpenAPI/Swagger**: Document API endpoints
- **API Documentation**: Clear docs for all Convex functions
- **Component Documentation**: Storybook or similar
- **Architecture Diagrams**: Visual representation
- **Data Flow Diagrams**: Show how data moves through system

---

## 🎯 Success Criteria

1. ✅ Users can sign up and log in
2. ✅ Users can set calorie goals
3. ✅ Menu items are scraped daily automatically
4. ✅ Users can view available menu items
5. ✅ Users can create meal plans
6. ✅ Meal plans show calorie totals vs goals
7. ✅ UI is clean, modern, and responsive
8. ✅ Real-time updates work correctly
9. ✅ Scraping runs reliably at midnight
10. ✅ Production deployment is successful

---

## 🔄 Future Enhancements

- Historical meal tracking
- Nutritional analysis and insights
- Meal recommendations based on preferences
- Social features (share meal plans)
- Mobile app (React Native)
- Integration with fitness trackers
- Advanced filtering (dietary restrictions, allergies)
- Meal prep suggestions
- Cost tracking (if prices available)

---

## 📚 Resources & References

- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Puppeteer Documentation](https://pptr.dev)
- [Playwright Documentation](https://playwright.dev)

---

## ⚠️ Important Notes

1. **Clerk JWT Template**: Must be named exactly `convex` (not `Convex` or anything else)
2. **Convex Auth Config**: Must match Clerk issuer domain exactly
3. **Deduplication**: Critical for menu items - use composite unique key
4. **Scraping Reliability**: Implement robust error handling and retries
5. **Type Safety**: Use TypeScript strict mode and Convex generated types
6. **Real-time Updates**: Leverage Convex's reactive queries for live updates
7. **Performance**: Index database queries properly
8. **Security**: Always check authentication in Convex functions

---

## 🎬 Getting Started Checklist

- [ ] Initialize Next.js project
- [ ] Install dependencies (Convex, Clerk, UI library)
- [ ] Set up Convex project
- [ ] Create Clerk application and JWT template
- [ ] Configure environment variables
- [ ] Set up Convex auth config
- [ ] Create ConvexClientProvider component
- [ ] Set up middleware
- [ ] Create database schema
- [ ] Implement Convex functions (queries, mutations, actions)
- [ ] Set up scheduled scraping function
- [ ] Build UI components
- [ ] Implement meal planning logic
- [ ] Test scraping functionality
- [ ] Deploy to production
- [ ] Monitor and iterate

---

**This document should serve as a comprehensive guide for building the Foco Diet Planner application. Follow it step-by-step, and don't hesitate to refer to official documentation when needed.**

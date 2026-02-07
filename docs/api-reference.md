# Foco Diet Planner - API Reference

## Overview

This application uses **Convex** for its backend. Instead of traditional REST endpoints, the API is organized into:

- **Queries**: Read-only, real-time reactive subscriptions
- **Mutations**: Write operations that modify state
- **Actions**: Side-effect operations (external API calls, scraping)

All functions are fully typed via TypeScript and Convex code generation.

---

## Menu Items API

### `menuItems.list` (Query)

Fetch menu items for a specific date with optional meal type filter.

**Arguments:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | Yes | ISO date (YYYY-MM-DD) |
| `mealType` | `"breakfast" \| "lunch" \| "dinner"` | No | Filter by meal |

**Returns:** `MenuItem[]`

**Usage:**
```tsx
const items = useQuery(api.menuItems.list, {
  date: "2026-02-07",
  mealType: "lunch",
});
```

---

### `menuItems.getById` (Query)

Fetch a single menu item by its document ID.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `id` | `Id<"menuItems">` | Yes |

**Returns:** `MenuItem | null`

---

### `menuItems.getToday` (Query)

Fetch available menu items for today's date.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `mealType` | `"breakfast" \| "lunch" \| "dinner"` | No |

**Returns:** `MenuItem[]`

---

### `menuItems.search` (Query)

Search menu items by name or location.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `date` | `string` | Yes |
| `searchTerm` | `string` | Yes |

**Returns:** `MenuItem[]` (items where name or location contains the search term)

---

### `menuItems.getAvailableDates` (Query)

Get all dates that have menu data available.

**Returns:** `string[]` (sorted newest first)

---

### `menuItems.insert` (Internal Mutation)

Insert a menu item with deduplication. Used internally by the scraping action.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `name` | `string` | Yes |
| `calories` | `number` | Yes |
| `protein` | `number` | Yes |
| `location` | `string` | Yes |
| `mealType` | `"breakfast" \| "lunch" \| "dinner"` | Yes |
| `date` | `string` | Yes |
| `uniqueKey` | `string` | Yes |
| `carbs` | `number` | No |
| `fat` | `number` | No |
| `fiber` | `number` | No |
| `description` | `string` | No |
| `servingSize` | `string` | No |

**Returns:** `Id<"menuItems">`

---

### `menuItems.seedDemoData` (Mutation)

Populate demo menu items for testing. Creates 18 items across all meal types.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `date` | `string` | Yes |

**Returns:** `{ inserted: number, total: number }`

---

## User Preferences API

### `userPreferences.get` (Query)

Get the authenticated user's preferences. Requires authentication.

**Arguments:** None

**Returns:** `UserPreferences | null`

---

### `userPreferences.update` (Mutation)

Create or update the authenticated user's preferences (upsert).

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `dailyCalorieGoal` | `number` | Yes |
| `dailyProteinGoal` | `number` | No |
| `preferredMealTypes` | `MealType[]` | Yes |
| `dietaryRestrictions` | `string[]` | No |

**Returns:** `Id<"userPreferences">`

---

## Meal Plans API

### `mealPlans.getByDate` (Query)

Get the user's meal plan for a specific date, with resolved meal item details.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `date` | `string` | Yes |

**Returns:** `MealPlan & { resolvedMeals } | null`

---

### `mealPlans.getCurrent` (Query)

Get today's meal plan for the authenticated user.

**Returns:** `MealPlan & { resolvedMeals } | null`

---

### `mealPlans.addMeal` (Mutation)

Add a menu item to the user's meal plan. Creates the plan if needed.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `date` | `string` | Yes |
| `mealType` | `MealType` | Yes |
| `menuItemId` | `Id<"menuItems">` | Yes |

**Behavior:**
- Creates meal plan if none exists for the date
- Prevents duplicate items in the same meal type
- Recalculates `totalCalories` and `totalProtein`

**Returns:** `Id<"mealPlans">`

---

### `mealPlans.removeMeal` (Mutation)

Remove a menu item from the user's meal plan.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `date` | `string` | Yes |
| `mealType` | `MealType` | Yes |
| `menuItemId` | `Id<"menuItems">` | Yes |

**Returns:** `Id<"mealPlans">`

---

### `mealPlans.clear` (Mutation)

Clear all meals from a date's plan (resets to empty).

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `date` | `string` | Yes |

---

## Scraping API

### `scraping.scrapeFocoMenu` (Action)

Trigger a full menu scrape using Browserbase + Playwright.

**Arguments:**
| Field | Type | Required |
|-------|------|----------|
| `date` | `string` | Yes |

**Returns:**
```typescript
{
  success: boolean;
  itemsScraped: number;
  duration: number;        // milliseconds
  sessionReplay: string;   // Browserbase debug URL
}
```

**Environment Variables Required:**
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`
- `FOCO_WEBSITE_URL`

---

## Scheduled Jobs

### `scrape-daily-foco-menu` (Daily Cron)

Runs daily at **5:00 AM UTC** (midnight Eastern).

Calls `scraping.scrapeFocoMenu` with today's date to populate the database with the latest menu items.

---

## Data Types

### MenuItem
```typescript
{
  _id: Id<"menuItems">;
  name: string;
  calories: number;
  protein: number;
  location: string;
  mealType: "breakfast" | "lunch" | "dinner";
  date: string;
  available: boolean;
  createdAt: number;
  uniqueKey: string;
  carbs?: number;
  fat?: number;
  fiber?: number;
  description?: string;
  servingSize?: string;
}
```

### UserPreferences
```typescript
{
  _id: Id<"userPreferences">;
  userId: string;
  dailyCalorieGoal: number;
  dailyProteinGoal?: number;
  preferredMealTypes: ("breakfast" | "lunch" | "dinner")[];
  dietaryRestrictions?: string[];
  createdAt: number;
  updatedAt: number;
}
```

### MealPlan
```typescript
{
  _id: Id<"mealPlans">;
  userId: string;
  date: string;
  meals: {
    breakfast?: Id<"menuItems">[];
    lunch?: Id<"menuItems">[];
    dinner?: Id<"menuItems">[];
  };
  totalCalories: number;
  totalProtein: number;
  createdAt: number;
  updatedAt: number;
}
```

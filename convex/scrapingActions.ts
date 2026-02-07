"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MENU_API_URL = "https://menu.dartmouth.edu/menuapi/mealitems";
const FOCO_LOCATION = "53 Commons";

const MEAL_PERIOD_MAP: Record<string, "breakfast" | "lunch" | "dinner"> = {
  Breakfast: "breakfast",
  Lunch: "lunch",
  Dinner: "dinner",
};

interface Nutrient {
  id: string;
  value: number;
}

interface MealMenu {
  mealPeriod: string;
  subLocation?: string;
}

interface DateAvailable {
  date: string;
  menus: MealMenu[];
}

interface ApiMealItem {
  id: string;
  itemName: string;
  mainLocationLabel: string;
  isAnalyzed: boolean;
  nutrients: Nutrient[];
  datesAvailable: DateAvailable[];
  portionSize?: string;
  imagePath?: string;
  ingredients?: string;
}

function getNutrient(nutrients: Nutrient[], id: string): number {
  return nutrients.find((n) => n.id === id)?.value ?? 0;
}

/**
 * Action: Fetch Foco menu from Dartmouth's public Menu API.
 *
 * Replaces the previous Browserbase + Playwright scraper with a direct
 * HTTP fetch to the Dartmouth dining API, which returns structured JSON
 * with full nutritional data for all menu items.
 *
 * Flow:
 * 1. Fetch menu items from /menuapi/mealitems?dates=YYYYMMDD
 * 2. Filter to 53 Commons (Foco) items with nutritional data
 * 3. Map meal periods (Breakfast/Lunch/Dinner) to our schema
 * 4. Store each item via the menuItems.insert mutation
 * 5. Log the result
 */
export const scrapeFocoMenu = action({
  args: {
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = args.date || new Date().toISOString().split("T")[0];
    const startTime = Date.now();

    await ctx.runMutation(internal.scraping.logScrape, {
      date,
      status: "started",
      itemsScraped: 0,
    });

    try {
      // Convert YYYY-MM-DD to YYYYMMDD for the API
      const apiDate = date.replace(/-/g, "");
      const url = `${MENU_API_URL}?dates=${apiDate}`;
      console.log(`Fetching menu for date=${date} (apiDate=${apiDate}): ${url}`);

      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "FocoDietPlanner/1.0",
        },
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(`API error: ${response.status} ${response.statusText}`, body);
        throw new Error(`API returned ${response.status}: ${response.statusText} - ${body}`);
      }

      const data = await response.json();
      const items: ApiMealItem[] = data.mealItems ?? [];

      let totalInserted = 0;

      for (const item of items) {
        // Only Foco items with nutritional data
        if (item.mainLocationLabel !== FOCO_LOCATION || !item.isAnalyzed) {
          continue;
        }

        const calories = getNutrient(item.nutrients, "calories");
        if (calories <= 0) continue;

        const protein = getNutrient(item.nutrients, "protein");
        const fat = getNutrient(item.nutrients, "totalFat");
        const carbs = getNutrient(item.nutrients, "totalCarbohydrates");
        const fiber = getNutrient(item.nutrients, "dietaryFiber");

        // An item can appear in multiple meal periods (e.g., Lunch + Dinner)
        const dateEntry = item.datesAvailable.find((d) => d.date === apiDate);
        if (!dateEntry) continue;

        const mealTypes = new Set<"breakfast" | "lunch" | "dinner">();
        for (const menu of dateEntry.menus) {
          const mapped = MEAL_PERIOD_MAP[menu.mealPeriod];
          if (mapped) mealTypes.add(mapped);
        }

        for (const mealType of mealTypes) {
          await ctx.runMutation(internal.menuItems.insert, {
            name: item.itemName,
            calories,
            protein,
            location: item.mainLocationLabel,
            mealType,
            date,
            uniqueKey: `${item.itemName}-${item.mainLocationLabel}-${mealType}-${date}`,
            fat: fat || undefined,
            carbs: carbs || undefined,
            fiber: fiber || undefined,
            servingSize: item.portionSize || undefined,
            description: item.ingredients || undefined,
            imageUrl: item.imagePath || undefined,
          });
          totalInserted++;
        }
      }

      const duration = Date.now() - startTime;

      await ctx.runMutation(internal.scraping.logScrape, {
        date,
        status: "completed",
        itemsScraped: totalInserted,
        duration,
      });

      return {
        success: true,
        itemsScraped: totalInserted,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await ctx.runMutation(internal.scraping.logScrape, {
        date,
        status: "failed",
        itemsScraped: 0,
        errorMessage,
        duration,
      });

      throw new Error(`Menu fetch failed: ${errorMessage}`);
    }
  },
});

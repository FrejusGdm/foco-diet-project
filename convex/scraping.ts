import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Internal Mutation: Log scraping operations.
 * Used by the scraping action to track success/failure.
 */
export const logScrape = internalMutation({
  args: {
    date: v.string(),
    status: v.union(
      v.literal("started"),
      v.literal("completed"),
      v.literal("failed")
    ),
    itemsScraped: v.number(),
    errorMessage: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scrapeLog", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Action: Scrape Foco menu using Browserbase + Playwright.
 *
 * This is a Convex action (not a mutation) because it makes external HTTP
 * requests to Browserbase's cloud browser service. Actions can call mutations
 * to store scraped data.
 *
 * Flow:
 * 1. Create a Browserbase session with stealth mode
 * 2. Connect Playwright to the cloud browser
 * 3. Navigate to Foco website
 * 4. Click through breakfast/lunch/dinner tabs
 * 5. Extract menu items with nutritional info
 * 6. Store each item via the menuItems.insert mutation
 * 7. Log the scraping result
 *
 * Environment variables required:
 * - BROWSERBASE_API_KEY
 * - BROWSERBASE_PROJECT_ID
 * - FOCO_WEBSITE_URL
 */
export const scrapeFocoMenu = action({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Log scrape start
    await ctx.runMutation(internal.scraping.logScrape, {
      date: args.date,
      status: "started",
      itemsScraped: 0,
    });

    try {
      // Dynamic imports to avoid bundling issues
      const { Browserbase } = await import("@browserbasehq/sdk");
      const { chromium } = await import("playwright-core");

      const browserbase = new Browserbase({
        apiKey: process.env.BROWSERBASE_API_KEY!,
      });

      // Create session with stealth mode for bot detection bypass
      const session = await browserbase.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
      });

      const browser = await chromium.connectOverCDP(
        `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${session.id}`
      );

      const context = browser.contexts[0];
      const page = context.pages[0] || (await context.newPage());

      // Navigate to Foco website
      await page.goto(process.env.FOCO_WEBSITE_URL!, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for menu content to load
      await page.waitForSelector(".menu-container, .menu-items, [class*='menu']", {
        timeout: 15000,
      }).catch(() => {
        // If no specific selector found, wait for page to stabilize
        return page.waitForTimeout(3000);
      });

      let totalInserted = 0;

      // Scrape each meal type
      for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
        try {
          // Click on meal type tab/button
          const mealSelector = [
            `[data-meal="${mealType}"]`,
            `button:has-text("${mealType}")`,
            `a:has-text("${mealType}")`,
            `[class*="${mealType}"]`,
          ].join(", ");

          const mealTab = await page.$(mealSelector);
          if (mealTab) {
            await mealTab.click();
            await page.waitForTimeout(2000);
          }

          // Extract menu items from current page view
          const items = await page.$$eval(
            ".menu-item, [class*='food-item'], [class*='menu-entry'], tr[class*='item']",
            (elements: Element[]) => {
              return elements.map((el) => {
                const getText = (selector: string) =>
                  el.querySelector(selector)?.textContent?.trim() || "";

                const getNumber = (selector: string) => {
                  const text = getText(selector);
                  const match = text.match(/[\d.]+/);
                  return match ? parseFloat(match[0]) : 0;
                };

                return {
                  name:
                    getText(".item-name, .food-name, [class*='name'], td:first-child") ||
                    el.textContent?.trim().split("\n")[0] ||
                    "",
                  calories: getNumber(
                    ".calories, .cal, [class*='calorie'], td:nth-child(2)"
                  ),
                  protein: getNumber(
                    ".protein, [class*='protein'], td:nth-child(3)"
                  ),
                  location:
                    getText(".location, .station, [class*='location'], [class*='station']") ||
                    "Main Line",
                  carbs: getNumber(".carbs, [class*='carb'], td:nth-child(4)"),
                  fat: getNumber(".fat, [class*='fat'], td:nth-child(5)"),
                };
              });
            }
          );

          // Insert valid items into database
          for (const item of items) {
            if (item.name && item.calories > 0) {
              await ctx.runMutation(internal.menuItems.insert, {
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                location: item.location,
                mealType,
                date: args.date,
                uniqueKey: `${item.name}-${item.location}-${mealType}-${args.date}`,
                carbs: item.carbs || undefined,
                fat: item.fat || undefined,
              });
              totalInserted++;
            }
          }
        } catch (mealError) {
          console.error(`Failed to scrape ${mealType}:`, mealError);
          // Continue with other meal types
        }
      }

      await browser.close();

      const duration = Date.now() - startTime;

      // Log success
      await ctx.runMutation(internal.scraping.logScrape, {
        date: args.date,
        status: "completed",
        itemsScraped: totalInserted,
        duration,
      });

      return {
        success: true,
        itemsScraped: totalInserted,
        duration,
        sessionReplay: `https://www.browserbase.com/sessions/${session.id}`,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Log failure
      await ctx.runMutation(internal.scraping.logScrape, {
        date: args.date,
        status: "failed",
        itemsScraped: 0,
        errorMessage,
        duration,
      });

      throw new Error(`Scraping failed: ${errorMessage}`);
    }
  },
});
